import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  });
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
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
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId && session.payment_status === 'paid') {
      const supabase = getServiceSupabase();

      const { error } = await supabase
        .from('orders')
        .update({
          deposit_paid: true,
          deposit_paid_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'deposit_paid',
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order after payment:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      await supabase.from('order_updates').insert([{
        order_id: orderId,
        status: 'deposit_paid',
        message: 'Deposit payment received and confirmed. Your order is now being processed.',
      }]);

      const { data: orderData } = await supabase
        .from('orders')
        .select('client_id, order_number')
        .eq('id', orderId)
        .single();

      if (orderData?.client_id) {
        // Notify the client
        await supabase.from('notifications').insert([{
          user_id: orderData.client_id,
          type: 'order_status',
          title: `Deposit Confirmed — Order #${orderData.order_number || orderId.slice(0, 8)}`,
          body: 'Your deposit payment has been confirmed. We are now proceeding with your order.',
          order_id: orderId,
          target_role: 'client',
          is_read: false,
          email_sent: false,
        }]);

        // Notify all admins
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin');

        if (admins && admins.length > 0) {
          await supabase.from('notifications').insert(
            admins.map((admin: any) => ({
              user_id: admin.id,
              type: 'order_status',
              title: `Deposit Received — #${orderData.order_number || orderId.slice(0, 8)}`,
              body: `Client paid the deposit of $${(session.amount_total ? (session.amount_total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A')}. Order is now active.`,
              order_id: orderId,
              target_role: 'admin',
              is_read: false,
              email_sent: false,
            }))
          );
        }
      }
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      const supabase = getServiceSupabase();

      const { data: order } = await supabase
        .from('orders')
        .select('deposit_paid')
        .eq('id', orderId)
        .single();

      if (order && !order.deposit_paid) {
        await supabase.from('orders').update({
          deposit_paid: true,
          deposit_paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id,
          status: 'deposit_paid',
        }).eq('id', orderId);

        await supabase.from('order_updates').insert([{
          order_id: orderId,
          status: 'deposit_paid',
          message: 'Deposit payment received via bank transfer and confirmed.',
        }]);
      }
    }
  }

  return NextResponse.json({ received: true });
}
