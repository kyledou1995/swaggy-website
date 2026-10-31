import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAdminOrderEmail } from '@/lib/order-emails';

/**
 * Client submits a response (text and/or uploaded file URLs) to an information
 * request. Runs with the service role so we can also lift the order out of
 * "Action Required" and notify the Merchin team.
 */
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { requestId?: string; text?: string; files?: string[] } | null;
  const text = (body?.text || '').trim();
  const files = Array.isArray(body?.files) ? body!.files.filter((f) => typeof f === 'string' && /^https:\/\//.test(f)).slice(0, 20) : [];
  if (!body?.requestId) return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
  if (!text && files.length === 0) return NextResponse.json({ error: 'Add a note or at least one file.' }, { status: 400 });

  const { data: req } = await admin.from('order_info_requests').select('*').eq('id', body.requestId).single();
  if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (req.status !== 'open') return NextResponse.json({ error: 'This request is no longer open.' }, { status: 409 });

  // Caller must belong to the order (owner or same organization)
  const { data: order } = await admin.from('orders').select('*').eq('id', req.order_id).single();
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const { data: me } = await admin.from('profiles').select('*').eq('id', user.id).single();
  let allowed = order.client_id === user.id || me?.role === 'admin';
  if (!allowed) {
    const { data: owner } = await admin.from('profiles').select('organization_id').eq('id', order.client_id).single();
    allowed = !!owner?.organization_id && owner.organization_id === me?.organization_id;
  }
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const now = new Date().toISOString();
  const { error: updErr } = await admin
    .from('order_info_requests')
    .update({ status: 'submitted', response_text: text || null, response_files: files, responded_by: user.id, responded_at: now, updated_at: now })
    .eq('id', req.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Lift "Action Required" once nothing else is waiting on the client
  let restoredStatus: string | null = null;
  const { count: stillOpen } = await admin
    .from('order_info_requests')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', order.id)
    .eq('status', 'open');
  if (order.status === 'action_required' && !stillOpen) {
    restoredStatus = req.previous_status && req.previous_status !== 'action_required' ? req.previous_status : 'under_review';
    await admin.from('orders').update({ status: restoredStatus, updated_at: now }).eq('id', order.id);
  }

  const who = me?.full_name || 'The client';
  const summary = [text, files.length ? `${files.length} file${files.length === 1 ? '' : 's'} uploaded` : ''].filter(Boolean).join(' — ');
  await admin.from('order_updates').insert([{
    order_id: order.id,
    status: restoredStatus || order.status,
    message: `Client provided the requested information${files.length ? ` (${files.length} file${files.length === 1 ? '' : 's'})` : ''}.`,
    created_by: user.id,
  }]);

  // In-app notification for admins
  const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin');
  if (admins?.length) {
    await admin.from('notifications').insert(
      admins.map((a: { id: string }) => ({
        user_id: a.id,
        type: 'order_status',
        title: `Information received — #${order.order_number || order.id.slice(0, 8)}`,
        body: `${who} responded: ${summary.slice(0, 140)}`,
        order_id: order.id,
        target_role: 'admin',
        is_read: false,
        email_sent: false,
      }))
    );
  }

  await sendAdminOrderEmail(admin, {
    orderId: order.id,
    event: 'info_provided',
    message: [`Request: ${req.message}`, text ? `Response: ${text}` : '', files.length ? `Files: ${files.length} uploaded (view them on the order page)` : ''].filter(Boolean).join('\n\n'),
    actorId: user.id,
  });

  return NextResponse.json({ ok: true, restoredStatus });
}
