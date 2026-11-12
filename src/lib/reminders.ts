/**
 * Automatic follow-up reminders for things waiting on the client (server-side only).
 *
 * Schedule (counted from when the client was asked):
 *   reminder 1 → 24 hours, reminder 2 → day 3, reminder 3 (final) → day 7,
 *   then hand-off: the Merchin team is alerted 2 days after the final reminder.
 * Unread messages get a single reminder after 24 hours and no hand-off.
 *
 * Rules: weekdays only, at most one email per client organization per run (items are bundled),
 * stops as soon as the client acts, pauses while the client's latest message is waiting on Merchin,
 * and respects the "Reminder emails" preference.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order } from '@/types';
import { sendEmail } from '@/lib/email';
import { renderClientReminderEmail, renderAdminHandoffEmail, type ReminderLine } from '@/lib/reminder-emails';

const DAY = 86400000;
export const REMINDER_DAYS = [1, 3, 7];
export const MESSAGE_REMINDER_DAYS = [1];
export const HANDOFF_AFTER_DAYS = 2;
/** Cron runs can drift by up to an hour; treat anything due within this window as due. */
const SLACK_MS = 3 * 3600000;

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.merchin.co').replace(/\/$/, '');

export type ReminderKind =
  | 'quote'
  | 'deposit'
  | 'sample_pricing'
  | 'sample_payment'
  | 'sample_review'
  | 'final_payment'
  | 'info_request'
  | 'action_required'
  | 'message';

interface PendingItem {
  orderId: string;
  kind: ReminderKind;
  itemKey: string;
  startedAt: Date;
  detail?: string | null;
}

interface ReminderRow {
  id: string;
  order_id: string;
  item_key: string;
  kind: ReminderKind;
  started_at: string;
  reminders_sent: number;
  last_sent_at: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
}

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name?: string | null;
  organization_id?: string | null;
  invite_status?: string | null;
  email_reminders?: boolean | null;
  role?: string | null;
  email_order_status?: boolean | null;
};

type Msg = { id: string; order_id: string; sender_role: string; message: string | null; attachments?: string[] | null; created_at: string };

export interface ReminderRunResult {
  dryRun: boolean;
  weekday: boolean;
  pending: number;
  created: number;
  resolved: number;
  remindersDue: { orderId: string; order: string; kind: ReminderKind; reminder: number; recipients: string[] }[];
  emailsSent: number;
  handoffs: { orderId: string; order: string; kind: ReminderKind }[];
  paused: { orderId: string; order: string; kind: ReminderKind }[];
  upcoming: { orderId: string; order: string; kind: ReminderKind; next: string; reminder: number }[];
  errors: string[];
}

const ACTION_STATUSES = ['quote_ready', 'deposit_required', 'sample_production', 'sample_approval_pending', 'final_payment_required', 'action_required'];

/** Works out what each order is waiting on the client for. */
function pendingItems(
  orders: Order[],
  updates: { order_id: string; status: string; created_at: string }[],
  infoRequests: { id: string; order_id: string; message: string; created_at: string }[],
  messages: Msg[],
  readsByOrder: Record<string, Record<string, string>>,
  membersByOrder: Record<string, string[]>
): PendingItem[] {
  const items: PendingItem[] = [];
  const statusSince = (o: Order) => {
    const latest = updates
      .filter((u) => u.order_id === o.id && u.status === o.status)
      .reduce<string | null>((max, u) => (!max || u.created_at > max ? u.created_at : max), null);
    return new Date(latest || o.updated_at || o.created_at);
  };
  const add = (o: Order, kind: ReminderKind, since: Date, detail?: string | null, key?: string) =>
    items.push({ orderId: o.id, kind, startedAt: since, detail, itemKey: key || `${kind}:${since.toISOString()}` });

  for (const o of orders) {
    const since = statusSince(o);
    switch (o.status) {
      case 'quote_ready':
        if (!o.selected_shipping) add(o, 'quote', since);
        break;
      case 'deposit_required':
        if (!o.deposit_paid) add(o, 'deposit', since);
        break;
      case 'sample_production':
        if (o.sample_price_per_unit && !o.sample_quantity_requested) add(o, 'sample_pricing', since);
        else if (o.sample_price_per_unit && o.sample_quantity_requested) add(o, 'sample_payment', since);
        break;
      case 'sample_approval_pending':
        // Only once there's something to review (photos shared or physical samples shipped)
        if (o.sample_images?.length || o.sample_shipped) add(o, 'sample_review', since);
        break;
      case 'final_payment_required':
        if (!o.final_payment_paid) add(o, 'final_payment', since);
        break;
      case 'action_required': {
        const open = infoRequests.filter((r) => r.order_id === o.id);
        if (open.length) open.forEach((r) => add(o, 'info_request', new Date(r.created_at), r.message, `info:${r.id}`));
        else add(o, 'action_required', since);
        break;
      }
    }

    // Unread message from Merchin (latest message in the thread is ours and nobody on their team has read it)
    const thread = messages.filter((m) => m.order_id === o.id);
    const last = thread[thread.length - 1];
    if (last && last.sender_role === 'admin' && Date.now() - new Date(last.created_at).getTime() < 14 * DAY) {
      const reads = readsByOrder[o.id] || {};
      const members = membersByOrder[o.id] || [];
      const readByAnyone = members.some((uid) => reads[uid] && reads[uid] >= last.created_at);
      if (!readByAnyone) {
        const preview = last.message?.trim() || (last.attachments?.length ? `Sent ${last.attachments.length} file${last.attachments.length === 1 ? '' : 's'}` : null);
        add(o, 'message', new Date(last.created_at), preview, `message:${last.id}`);
      }
    }
  }
  return items;
}

function nextDueAt(row: ReminderRow): Date | null {
  const schedule = row.kind === 'message' ? MESSAGE_REMINDER_DAYS : REMINDER_DAYS;
  const i = row.reminders_sent;
  if (i >= schedule.length) return null;
  const fromStart = new Date(row.started_at).getTime() + schedule[i] * DAY;
  const gap = (schedule[i] - (i > 0 ? schedule[i - 1] : 0)) * DAY;
  const fromLast = row.last_sent_at ? new Date(row.last_sent_at).getTime() + gap : 0;
  return new Date(Math.max(fromStart, fromLast));
}

function isWeekday(d: Date) {
  // Evaluated in US Eastern time so a run near midnight UTC still counts as the US business day.
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/New_York' }).format(d);
  return day !== 'Sat' && day !== 'Sun';
}

export async function runClientReminders(admin: SupabaseClient, opts: { dryRun?: boolean; now?: Date } = {}): Promise<ReminderRunResult> {
  const dryRun = !!opts.dryRun;
  const now = opts.now || new Date();
  const weekday = isWeekday(now);
  const result: ReminderRunResult = {
    dryRun, weekday, pending: 0, created: 0, resolved: 0, remindersDue: [], emailsSent: 0, handoffs: [], paused: [], upcoming: [], errors: [],
  };

  // ── Load everything we need ──
  const { data: ordersData, error: ordersErr } = await admin
    .from('orders')
    .select('*')
    .not('status', 'in', '(draft,cancelled,delivered)');
  if (ordersErr) {
    result.errors.push(`orders: ${ordersErr.message}`);
    return result;
  }
  const orders = (ordersData || []) as Order[];
  const orderIds = orders.map((o) => o.id);
  const byId = new Map(orders.map((o) => [o.id, o]));

  const { data: openRowsData, error: rowsErr } = await admin.from('client_reminders').select('*').is('resolved_at', null);
  if (rowsErr) {
    result.errors.push(`client_reminders: ${rowsErr.message} (run supabase/migrations/2026-11-12_client_reminders.sql)`);
    return result;
  }
  const openRows = (openRowsData || []) as ReminderRow[];

  const [upd, info, msgs, reads] = orderIds.length
    ? await Promise.all([
        admin.from('order_updates').select('order_id, status, created_at').in('order_id', orderIds).in('status', ACTION_STATUSES),
        admin.from('order_info_requests').select('id, order_id, message, created_at').in('order_id', orderIds).eq('status', 'open'),
        admin.from('order_messages').select('id, order_id, sender_role, message, attachments, created_at').in('order_id', orderIds).order('created_at', { ascending: true }),
        admin.from('message_reads').select('user_id, order_id, last_read_at').in('order_id', orderIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  // Client organizations → members
  const ownerIds = [...new Set(orders.map((o) => o.client_id).filter(Boolean))];
  const { data: ownersData } = ownerIds.length ? await admin.from('profiles').select('*').in('id', ownerIds) : { data: [] };
  const owners = new Map(((ownersData || []) as Profile[]).map((p) => [p.id, p]));
  const orgIds = [...new Set([...owners.values()].map((p) => p.organization_id).filter(Boolean))] as string[];
  const { data: orgMembersData } = orgIds.length ? await admin.from('profiles').select('*').in('organization_id', orgIds) : { data: [] };
  const orgMembers = (orgMembersData || []) as Profile[];

  const groupKeyFor = (o: Order) => owners.get(o.client_id)?.organization_id || o.client_id;
  const membersFor = (o: Order): Profile[] => {
    const owner = owners.get(o.client_id);
    if (owner?.organization_id) {
      const m = orgMembers.filter((p) => p.organization_id === owner.organization_id && (!p.invite_status || p.invite_status === 'active'));
      if (m.length) return m;
    }
    return owner ? [owner] : [];
  };

  const readsByOrder: Record<string, Record<string, string>> = {};
  ((reads.data || []) as { user_id: string; order_id: string; last_read_at: string }[]).forEach((r) => {
    (readsByOrder[r.order_id] ||= {})[r.user_id] = new Date(r.last_read_at).toISOString();
  });
  const membersByOrder: Record<string, string[]> = {};
  orders.forEach((o) => (membersByOrder[o.id] = membersFor(o).map((m) => m.id)));
  const messages = ((msgs.data || []) as Msg[]).map((m) => ({ ...m, created_at: new Date(m.created_at).toISOString() }));

  const items = pendingItems(
    orders,
    (upd.data || []) as { order_id: string; status: string; created_at: string }[],
    (info.data || []) as { id: string; order_id: string; message: string; created_at: string }[],
    messages,
    readsByOrder,
    membersByOrder
  );
  result.pending = items.length;

  // ── Sync the reminder log with what's pending now ──
  const rowKey = (orderId: string, key: string) => `${orderId}|${key}`;
  const rowsByKey = new Map(openRows.map((r) => [rowKey(r.order_id, r.item_key), r]));
  const liveKeys = new Set(items.map((i) => rowKey(i.orderId, i.itemKey)));

  // Resolved: the client acted (or the item otherwise went away)
  const toResolve = openRows.filter((r) => !liveKeys.has(rowKey(r.order_id, r.item_key)));
  result.resolved = toResolve.length;
  if (!dryRun && toResolve.length) {
    await admin.from('client_reminders').update({ resolved_at: now.toISOString() }).in('id', toResolve.map((r) => r.id));
  }

  // New items
  const working: (ReminderRow & { item: PendingItem })[] = [];
  for (const item of items) {
    let row = rowsByKey.get(rowKey(item.orderId, item.itemKey));
    if (!row) {
      result.created++;
      const fresh = {
        order_id: item.orderId,
        item_key: item.itemKey,
        kind: item.kind,
        started_at: item.startedAt.toISOString(),
        reminders_sent: 0,
      };
      if (!dryRun) {
        const { data, error } = await admin.from('client_reminders').upsert(fresh, { onConflict: 'order_id,item_key' }).select('*').single();
        if (error) {
          result.errors.push(`insert ${item.itemKey}: ${error.message}`);
          continue;
        }
        row = data as ReminderRow;
        if (row.resolved_at) continue; // was resolved before and came back with the same key — leave it
      } else {
        row = { id: `dry-${item.itemKey}`, last_sent_at: null, escalated_at: null, resolved_at: null, ...fresh } as ReminderRow;
      }
    }
    working.push({ ...row, item });
  }

  // ── Decide what's due ──
  const due: (ReminderRow & { item: PendingItem; reminderNo: number })[] = [];
  const handoff: (ReminderRow & { item: PendingItem })[] = [];
  for (const row of working) {
    const o = byId.get(row.order_id)!;
    // Paused while the client's latest message is waiting on Merchin (ball is in our court)
    const thread = messages.filter((m) => m.order_id === row.order_id);
    const last = thread[thread.length - 1];
    // (10-minute buffer: some client actions post an automatic message at the same moment)
    if (row.kind !== 'message' && last && last.sender_role !== 'admin' && new Date(last.created_at).getTime() > new Date(row.started_at).getTime() + 10 * 60000) {
      result.paused.push({ orderId: o.id, order: o.order_number || o.id, kind: row.kind });
      continue;
    }
    const nextAt = nextDueAt(row);
    if (nextAt) {
      if (nextAt.getTime() <= now.getTime() + SLACK_MS) due.push({ ...row, reminderNo: row.reminders_sent + 1 });
      else result.upcoming.push({ orderId: o.id, order: o.order_number || o.id, kind: row.kind, next: nextAt.toISOString(), reminder: row.reminders_sent + 1 });
    } else if (
      row.kind !== 'message' &&
      !row.escalated_at &&
      row.last_sent_at &&
      new Date(row.last_sent_at).getTime() + HANDOFF_AFTER_DAYS * DAY <= now.getTime() + SLACK_MS
    ) {
      handoff.push(row);
    }
  }

  if (!weekday) return result; // log is synced; emails wait for the next business day

  // ── Client reminder emails: one per organization ──
  const groups = new Map<string, typeof due>();
  due.forEach((d) => {
    const k = groupKeyFor(byId.get(d.order_id)!);
    groups.set(k, [...(groups.get(k) || []), d]);
  });

  for (const [, group] of groups) {
    const firstOrder = byId.get(group[0].order_id)!;
    const recipients = membersFor(firstOrder).filter((m) => m.email && m.email_reminders !== false);
    const lines: ReminderLine[] = group.map((g) => ({
      order: byId.get(g.order_id)!,
      kind: g.kind,
      detail: g.item.detail,
      reminderNo: g.reminderNo,
      isFinal: g.kind !== 'message' && g.reminderNo >= REMINDER_DAYS.length,
    }));
    group.forEach((g) =>
      result.remindersDue.push({
        orderId: g.order_id,
        order: byId.get(g.order_id)!.order_number || g.order_id,
        kind: g.kind,
        reminder: g.reminderNo,
        recipients: recipients.map((r) => r.email!),
      })
    );
    if (dryRun) continue;

    for (const m of recipients) {
      const email = renderClientReminderEmail(lines, { recipientName: m.full_name, baseUrl: BASE_URL });
      const res = await sendEmail({ to: m.email!, ...email, replyTo: null });
      if (res.sent) result.emailsSent++;
      else if (res.error) result.errors.push(`email ${m.email}: ${res.error}`);
    }
    // Count the reminder even if everyone opted out, so the team hand-off still happens on time.
    await admin
      .from('client_reminders')
      .update({ last_sent_at: now.toISOString() })
      .in('id', group.map((g) => g.id));
    for (const g of group) {
      await admin.from('client_reminders').update({ reminders_sent: g.reminderNo }).eq('id', g.id);
    }
  }

  // ── Hand-off to the Merchin team ──
  if (handoff.length) {
    handoff.forEach((h) => result.handoffs.push({ orderId: h.order_id, order: byId.get(h.order_id)!.order_number || h.order_id, kind: h.kind }));
    if (!dryRun) {
      const { data: adminsData } = await admin.from('profiles').select('*').eq('role', 'admin');
      const admins = (adminsData || []) as Profile[];
      const lines = handoff.map((h) => {
        const o = byId.get(h.order_id)!;
        const owner = owners.get(o.client_id);
        return {
          order: o,
          kind: h.kind,
          detail: h.item.detail,
          company: owner?.company_name || owner?.full_name || owner?.email || 'Client',
          since: h.started_at,
        };
      });
      const email = renderAdminHandoffEmail(lines, { baseUrl: BASE_URL });
      for (const a of admins.filter((x) => x.email && x.email_order_status !== false)) {
        const res = await sendEmail({ to: a.email!, ...email, replyTo: null });
        if (res.sent) result.emailsSent++;
        else if (res.error) result.errors.push(`admin email ${a.email}: ${res.error}`);
      }
      // In-app alert per order
      const notifRows = admins.flatMap((a) =>
        lines.map((l) => ({
          user_id: a.id,
          type: 'order_status',
          title: `Client hasn't responded — #${l.order.order_number || l.order.id.slice(0, 8)}`,
          body: `${l.company} hasn't acted after 3 reminders. Time for a personal follow-up.`,
          order_id: l.order.id,
          target_role: 'admin',
          is_read: false,
          email_sent: true,
        }))
      );
      if (notifRows.length) await admin.from('notifications').insert(notifRows);
      await admin.from('client_reminders').update({ escalated_at: now.toISOString() }).in('id', handoff.map((h) => h.id));
    }
  }

  return result;
}
