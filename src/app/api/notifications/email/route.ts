import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sendOrderEmail, sendAdminOrderEmail } from '@/lib/order-emails';
import type { ClientEmailEvent } from '@/lib/client-emails';
import type { AdminEmailEvent } from '@/lib/admin-emails';
import type { OrderStatus } from '@/types';

// Client-audience events a client may trigger for their own order. Everything else is admin-only.
const CLIENT_ALLOWED = new Set<ClientEmailEvent>(['order_received']);
// Admin-audience events clients trigger by acting on their own order.
const ADMIN_EVENTS = new Set<AdminEmailEvent>([
  'new_order',
  'new_message',
  'quote_accepted',
  'sample_pricing_approved',
  'physical_samples_requested',
  'sample_approved',
  'sample_changes_requested',
  'order_cancelled',
]);

interface Body {
  orderId?: string;
  audience?: 'client' | 'admin';
  event?: string;
  message?: string | null;
  status?: OrderStatus | null;
  amount?: number | null;
}

async function callerBelongsToOrder(admin: SupabaseClient, orderId: string, userId: string, callerOrg?: string | null) {
  const { data: order } = await admin.from('orders').select('client_id').eq('id', orderId).single();
  if (!order) return false;
  if (order.client_id === userId) return true;
  const { data: owner } = await admin.from('profiles').select('organization_id').eq('id', order.client_id).single();
  return !!owner?.organization_id && owner.organization_id === callerOrg;
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 });
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.orderId || !body?.event) return NextResponse.json({ error: 'orderId and event are required' }, { status: 400 });

  const { data: caller } = await admin.from('profiles').select('role, organization_id').eq('id', user.id).single();
  const isAdmin = caller?.role === 'admin';
  const amount = typeof body.amount === 'number' ? body.amount : null;

  // ── Emails to the Merchin team ──
  if (body.audience === 'admin') {
    const event = body.event as AdminEmailEvent;
    if (!ADMIN_EVENTS.has(event)) return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
    if (!isAdmin && !(await callerBelongsToOrder(admin, body.orderId, user.id, caller?.organization_id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const result = await sendAdminOrderEmail(admin, {
      orderId: body.orderId,
      event,
      message: body.message ?? null,
      amount,
      actorId: user.id,
    });
    return NextResponse.json(result);
  }

  // ── Emails to the client's team ──
  const event = body.event as ClientEmailEvent;
  if (!isAdmin) {
    if (!CLIENT_ALLOWED.has(event)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!(await callerBelongsToOrder(admin, body.orderId, user.id, caller?.organization_id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  const result = await sendOrderEmail(admin, {
    orderId: body.orderId,
    event,
    message: body.message ?? null,
    status: body.status ?? null,
    amount,
  });
  return NextResponse.json(result);
}

/** Configuration check (booleans only, no secrets). */
export async function GET() {
  return NextResponse.json({
    resendKey: !!process.env.RESEND_API_KEY,
    serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    from: process.env.EMAIL_FROM || 'Merchin <noreply@merchin.co>',
  });
}
