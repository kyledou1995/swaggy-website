import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sendOrderEmail, sendAdminOrderEmail } from '@/lib/order-emails';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  });
}

function getServiceSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

type PaymentType = 'deposit' | 'sample' | 'final';

const COPY: Record<
  PaymentType,
  { status: string; update: string; clientTitle: string; clientBody: string; adminTitle: string; adminBody: (amt: string) => string }
> = {
  deposit: {
    status: 'deposit_paid',
    update: 'Deposit payment received and confirmed. Your order is now being processed.',
    clientTitle: 'Deposit Confirmed',
    clientBody: 'Your deposit payment has been confirmed. We are now proceeding with your order.',
    adminTitle: 'Deposit Received',
    adminBody: (amt) => `Client paid the deposit of ${amt}. Order is now active.`,
  },
  sample: {
    status: 'sample_approval_pending',
    update: 'Sample payment received. We are now preparing your samples for review.',
    clientTitle: 'Sample Payment Confirmed',
    clientBody: 'Your sample payment has been confirmed. We will send photos or ship samples for your approval.',
    adminTitle: 'Sample Payment Received',
    adminBody: (amt) => `Client paid ${amt} for samples. Please prepare sample photos or shipment.`,
  },
  final: {
    status: 'preparing_to_ship',
    update: 'Final payment received. Your order is now being prepared for shipment.',
    clientTitle: 'Payment Confirmed',
    clientBody: 'Your final payment has been confirmed. We are now preparing your order for shipment.',
    adminTitle: 'Final Payment Received',
    adminBody: (amt) => `Client paid the final balance of ${amt}. Ready to ship.`,
  },
};

/** Apply a confirmed payment to the order. Idempotent: repeated events are ignored. */
async function applyPayment(
  supabase: SupabaseClient,
  orderId: string,
  type: PaymentType,
  amountCents: number | null,
  paymentIntentId: string | null
) {
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (!order) return { ok: false, error: 'Order not found' };

  if (type === 'deposit' && order.deposit_paid) return { ok: true, skipped: true };
  if (type === 'final' && order.final_payment_paid) return { ok: true, skipped: true };
  if (type === 'sample' && order.status === COPY.sample.status) return { ok: true, skipped: true };

  const now = new Date().toISOString();
  const c = COPY[type];
  const patch: Record<string, unknown> = { status: c.status, updated_at: now };
  if (type === 'deposit') Object.assign(patch, { deposit_paid: true, deposit_paid_at: now, stripe_payment_intent_id: paymentIntentId });
  if (type === 'final') Object.assign(patch, { final_payment_paid: true, final_payment_paid_at: now, final_payment_stripe_id: paymentIntentId });

  const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
  if (error) {
    console.error(`Error updating order after ${type} payment:`, error);
    return { ok: false, error: 'Database update failed' };
  }

  await supabase.from('order_updates').insert([{ order_id: orderId, status: c.status, message: c.update }]);

  const no = order.order_number || orderId.slice(0, 8);
  const amount = amountCents != null ? amountCents / 100 : null;
  const amt = amount != null ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A';

  // In-app notifications
  if (order.client_id) {
    await supabase.from('notifications').insert([{
      user_id: order.client_id,
      type: 'order_status',
      title: `${c.clientTitle} — Order #${no}`,
      body: c.clientBody,
      order_id: orderId,
      target_role: 'client',
      is_read: false,
      email_sent: false,
    }]);
  }
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  if (admins?.length) {
    await supabase.from('notifications').insert(
      admins.map((a: { id: string }) => ({
        user_id: a.id,
        type: 'order_status',
        title: `${c.adminTitle} — #${no}`,
        body: c.adminBody(amt),
        order_id: orderId,
        target_role: 'admin',
        is_read: false,
        email_sent: false,
      }))
    );
  }

  // Emails
  const clientEvent = type === 'deposit' ? 'deposit_confirmed' : type === 'sample' ? 'sample_paid' : 'final_payment_confirmed';
  const adminEvent = type === 'deposit' ? 'deposit_paid' : type === 'sample' ? 'sample_paid' : 'final_payment_paid';
  await Promise.all([
    sendOrderEmail(supabase, { orderId, event: clientEvent }),
    sendAdminOrderEmail(supabase, { orderId, event: adminEvent, amount }),
  ]);

  return { ok: true };
}

function paymentTypeOf(meta: Stripe.Metadata | null | undefined): PaymentType {
  const t = meta?.type || meta?.paymentType;
  return t === 'sample' || t === 'final' ? t : 'deposit';
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error: unknown) {
    console.error('Webhook signature verification failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Card payments complete immediately; bank (ACH) payments complete later via async_payment_succeeded.
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId && session.payment_status === 'paid') {
      const result = await applyPayment(
        getServiceSupabase(),
        orderId,
        paymentTypeOf(session.metadata),
        session.amount_total ?? null,
        (session.payment_intent as string) || null
      );
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
