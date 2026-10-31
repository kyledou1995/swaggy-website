/**
 * Server-side: email everyone in the client's organization about an order
 * update, respecting each member's email preferences.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order, OrderStatus } from '@/types';
import { sendEmail } from '@/lib/email';
import { renderClientEmail, type ClientEmailEvent } from '@/lib/client-emails';

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
