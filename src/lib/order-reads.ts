import { createClient } from '@/lib/supabase';

/**
 * "Seen" tracking for clients, per order, stored in `message_reads` (user_id, order_id, last_read_at).
 * An order counts as seen when the client opens it, or opens its thread on the Messages page.
 * This is independent of the notification bell, so clearing the bell doesn't hide what's new.
 */

export const NOTIFICATIONS_CHANGED = 'merchin:notifications-changed';

type Supabase = ReturnType<typeof createClient>;

/** Updates on never-opened orders count as new for this long. */
export const RECENT_MS = 14 * 86400000;

export async function getLastSeenMap(supabase: Supabase, userId: string): Promise<Record<string, string>> {
  const { data } = await supabase.from('message_reads').select('order_id, last_read_at').eq('user_id', userId);
  const map: Record<string, string> = {};
  (data || []).forEach((r: { order_id: string; last_read_at: string }) => (map[r.order_id] = r.last_read_at));
  return map;
}

export async function getLastSeen(supabase: Supabase, userId: string, orderId: string): Promise<string | null> {
  const { data } = await supabase
    .from('message_reads')
    .select('last_read_at')
    .eq('user_id', userId)
    .eq('order_id', orderId)
    .maybeSingle();
  return (data as { last_read_at?: string } | null)?.last_read_at ?? null;
}

/** Mark an order (its messages and updates) as seen now, and tell badges to refresh. */
export async function markOrderSeen(userId: string, orderId: string, supabase: Supabase = createClient()) {
  const { error } = await supabase
    .from('message_reads')
    .upsert({ user_id: userId, order_id: orderId, last_read_at: new Date().toISOString() }, { onConflict: 'user_id,order_id' });
  if (error) console.error('Could not mark order as seen:', error.message);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

/** Order ids (non-draft) belonging to the client's organization. */
async function getOrgOrderIds(supabase: Supabase, userId: string): Promise<string[]> {
  const { data: me } = await supabase.from('profiles').select('organization_id').eq('id', userId).single();
  let memberIds = [userId];
  if (me?.organization_id) {
    const { data: members } = await supabase.from('profiles').select('id').eq('organization_id', me.organization_id);
    if (members?.length) memberIds = members.map((m: { id: string }) => m.id);
  }
  const { data: orders } = await supabase.from('orders').select('id').in('client_id', memberIds).neq('status', 'draft');
  return (orders || []).map((o: { id: string }) => o.id);
}

/**
 * Unread counts for the client sidebar — same rules as the Messages page:
 * messages = Merchin messages newer than the order's last-seen time;
 * orders   = orders with an update notification newer than the last-seen time.
 */
export async function getClientUnreadCounts(userId: string): Promise<{ messages: number; orders: number; ordersWithUpdates: Set<string> }> {
  const supabase = createClient();
  const orderIds = await getOrgOrderIds(supabase, userId);
  if (!orderIds.length) return { messages: 0, orders: 0, ordersWithUpdates: new Set() };
  const [seen, msgs, notifs] = await Promise.all([
    getLastSeenMap(supabase, userId),
    supabase.from('order_messages').select('order_id, created_at').in('order_id', orderIds).eq('sender_role', 'admin'),
    supabase
      .from('notifications')
      .select('order_id, created_at')
      .eq('user_id', userId)
      .eq('target_role', 'client')
      .neq('type', 'new_message')
      .in('order_id', orderIds)
      .gte('created_at', new Date(Date.now() - 60 * 86400000).toISOString()),
  ]);
  const isNew = (orderId: string, at: string) => !seen[orderId] || new Date(at) > new Date(seen[orderId]);
  const recent = (at: string) => Date.now() - new Date(at).getTime() < RECENT_MS;

  const messages = (msgs.data || []).filter((m: { order_id: string; created_at: string }) => isNew(m.order_id, m.created_at)).length;
  const ordersWithUpdates = new Set<string>();
  // An order has a "new update" when a status update or Merchin message arrived after the client
  // last opened it (for never-opened orders: anything from the last 14 days).
  const flag = (orderId: string, at: string) => {
    if (seen[orderId] ? isNew(orderId, at) : recent(at)) ordersWithUpdates.add(orderId);
  };
  (notifs.data || []).forEach((n: { order_id: string; created_at: string }) => flag(n.order_id, n.created_at));
  (msgs.data || []).forEach((m: { order_id: string; created_at: string }) => flag(m.order_id, m.created_at));
  return { messages, orders: ordersWithUpdates.size, ordersWithUpdates };
}
