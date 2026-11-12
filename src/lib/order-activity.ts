import type { SupabaseClient } from '@supabase/supabase-js';

type OrderLike = { id: string; created_at: string; updated_at?: string | null };

/**
 * Latest activity per order (ISO strings): order edits, status updates, and messages.
 * Used to list orders "most recently updated first".
 */
export async function fetchLastActivity(supabase: SupabaseClient, orders: OrderLike[]): Promise<Record<string, string>> {
  const latest: Record<string, string> = {};
  const bump = (id: string, at?: string | null) => {
    if (!at) return;
    const iso = new Date(at).toISOString();
    if (!latest[id] || iso > latest[id]) latest[id] = iso;
  };
  orders.forEach((o) => {
    bump(o.id, o.updated_at);
    bump(o.id, o.created_at);
  });
  const ids = orders.map((o) => o.id);
  if (ids.length) {
    const [upd, msgs] = await Promise.all([
      supabase.from('order_updates').select('order_id, created_at').in('order_id', ids),
      supabase.from('order_messages').select('order_id, created_at').in('order_id', ids),
    ]);
    [...(upd.data || []), ...(msgs.data || [])].forEach((r: { order_id: string; created_at: string }) => bump(r.order_id, r.created_at));
  }
  return latest;
}

export const byLastActivity =
  (latest: Record<string, string>) =>
  (a: OrderLike, b: OrderLike) =>
    (latest[b.id] || b.created_at).localeCompare(latest[a.id] || a.created_at);

export function updatedAgo(iso?: string | null): string {
  if (!iso) return '—';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : d < 30 ? `${d} days ago` : new Date(iso).toLocaleDateString();
}
