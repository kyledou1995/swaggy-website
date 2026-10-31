import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderEmail, type OrderEmailRequest } from '@/lib/order-emails';

// Events a client may trigger for their own order. Everything else is admin-only.
const CLIENT_ALLOWED = new Set(['order_received']);

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

  const body = (await request.json().catch(() => null)) as OrderEmailRequest | null;
  if (!body?.orderId || !body?.event) return NextResponse.json({ error: 'orderId and event are required' }, { status: 400 });

  const { data: caller } = await admin.from('profiles').select('role, organization_id').eq('id', user.id).single();
  const isAdmin = caller?.role === 'admin';

  if (!isAdmin) {
    if (!CLIENT_ALLOWED.has(body.event)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // Client may only trigger emails for orders in their own organization
    const { data: order } = await admin.from('orders').select('client_id').eq('id', body.orderId).single();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.client_id !== user.id) {
      const { data: owner } = await admin.from('profiles').select('organization_id').eq('id', order.client_id).single();
      if (!owner?.organization_id || owner.organization_id !== caller?.organization_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
  }

  const result = await sendOrderEmail(admin, {
    orderId: body.orderId,
    event: body.event,
    message: body.message ?? null,
    status: body.status ?? null,
    amount: typeof body.amount === 'number' ? body.amount : null,
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
