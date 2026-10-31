/**
 * Server-side: email everyone in the client's organization about an order
 * update, respecting each member's email preferences.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order, OrderStatus } from '@/types';
import { sendEmail } from '@/lib/email';
import { renderClientEmail, type ClientEmailEvent } from '@/lib/client-emails';
import { renderAdminEmail, type AdminEmailEvent } from '@/lib/admin-emails';

export interface OrderEmailRequest {
  orderId: string;
  event: ClientEmailEvent;
  message?: string | null;
  status?: OrderStatus | null;
  amount?: number | null;
}

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.merchin.co').replace(/\/$/, '');

export async function sendOrderEmail(admin: SupabaseClient, req: OrderEmailRequest) {
  const { data: order } = await admin.from('orders').select('*').eq('id', req.orderId).single();
  if (!order) return { sent: 0, error: 'Order not found' };

  // Recipients: active members of the client's organization (or just the owner).
  // select('*') so a missing optional column can't break the lookup.
  type Member = { id: string; email: string; full_name: string | null; organization_id?: string | null; email_order_status?: boolean | null; email_new_message?: boolean | null; invite_status?: string | null };
  const { data: owner, error: ownerError } = await admin.from('profiles').select('*').eq('id', order.client_id).single();
  if (ownerError) console.error('order-email: owner lookup failed', ownerError.message);

  let members: Member[] = owner ? [owner as Member] : [];
  if (owner?.organization_id) {
    const { data, error } = await admin.from('profiles').select('*').eq('organization_id', owner.organization_id);
    if (error) console.error('order-email: org lookup failed', error.message);
    if (data?.length) {
      const active = (data as Member[]).filter((m) => !m.invite_status || m.invite_status === 'active');
      if (active.length) members = active;
    }
  }

  const wantsEmail = (m: Member) =>
    req.event === 'new_message' ? m.email_new_message !== false : m.email_order_status !== false;
  const recipients = members.filter((m) => m.email && wantsEmail(m));

  let sent = 0;
  const errors: string[] = [];
  for (const m of recipients) {
    const email = renderClientEmail(req.event, {
      order: order as Order,
      recipientName: m.full_name,
      message: req.message,
      status: req.status,
      amount: req.amount,
      baseUrl: BASE_URL,
    });
    const res = await sendEmail({ to: m.email, ...email, replyTo: null });
    if (res.sent) sent++;
    else if (res.error) errors.push(res.error);
  }
  if (errors.length) console.error('order-email: send errors', errors);
  console.log(`order-email: ${req.event} for ${order.order_number || order.id} → ${sent}/${recipients.length} sent (${members.length} members)`);
  return { sent, recipients: recipients.length, error: errors[0] ?? (recipients.length ? undefined : 'No recipients with email notifications enabled') };
}

// ───────────────────────────── Admin emails ─────────────────────────────

export interface AdminOrderEmailRequest {
  orderId: string;
  event: AdminEmailEvent;
  message?: string | null;
  amount?: number | null;
  /** Profile id of the client who took the action (for "who did it"). */
  actorId?: string | null;
}

export async function sendAdminOrderEmail(admin: SupabaseClient, req: AdminOrderEmailRequest) {
  const { data: order } = await admin.from('orders').select('*').eq('id', req.orderId).single();
  if (!order) return { sent: 0, error: 'Order not found' };

  const { data: client } = await admin.from('profiles').select('*').eq('id', order.client_id).single();
  let actorName: string | null = null;
  if (req.actorId && req.actorId !== order.client_id) {
    const { data: actor } = await admin.from('profiles').select('*').eq('id', req.actorId).single();
    actorName = actor?.full_name || null;
  }

  type AdminProfile = { id: string; email: string; email_order_status?: boolean | null; email_new_message?: boolean | null };
  const { data: admins, error } = await admin.from('profiles').select('*').eq('role', 'admin');
  if (error) console.error('admin-email: admin lookup failed', error.message);
  const recipients = ((admins || []) as AdminProfile[]).filter(
    (a) => a.email && (req.event === 'new_message' ? a.email_new_message !== false : a.email_order_status !== false)
  );

  const email = renderAdminEmail(req.event, {
    order: order as Order,
    client: client || null,
    actorName,
    message: req.message,
    amount: req.amount,
    baseUrl: BASE_URL,
  });

  let sent = 0;
  const errors: string[] = [];
  for (const a of recipients) {
    const res = await sendEmail({ to: a.email, ...email, replyTo: null });
    if (res.sent) sent++;
    else if (res.error) errors.push(res.error);
  }
  if (errors.length) console.error('admin-email: send errors', errors);
  console.log(`admin-email: ${req.event} for ${order.order_number || order.id} → ${sent}/${recipients.length} sent`);
  return { sent, recipients: recipients.length, error: errors[0] ?? (recipients.length ? undefined : 'No admins with email notifications enabled') };
}
