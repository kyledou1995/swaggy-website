'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  MessageSquare,
  Package,
  RefreshCw,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { AppNotification, Order } from '@/types';
import { NOTIFICATIONS_CHANGED, RECENT_MS, getClientUnreadCounts, getLastSeen, markOrderSeen } from '@/lib/order-reads';

/* ─────────────────────────── helpers ─────────────────────────── */

export { NOTIFICATIONS_CHANGED };

/** Scroll to a section of the order page and briefly highlight it. */
export function jumpToSection(id: string) {
  const el =
    document.getElementById(id) ||
    (id === 'info-request' ? document.getElementById('messages') : null) ||
    document.getElementById('progress');
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.classList.remove('merchin-flash');
  // restart the animation
  void el.offsetWidth;
  el.classList.add('merchin-flash');
  window.setTimeout(() => el.classList.remove('merchin-flash'), 2400);
  if (el.id === 'messages') {
    window.setTimeout(() => (document.getElementById('message-input') as HTMLTextAreaElement | null)?.focus({ preventScroll: true }), 600);
  }
}

const money = (n?: number | null) =>
  n == null ? '' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

/** Drop the "— Order #MRC-123" suffix; we're already on that order. */
const cleanTitle = (t: string) => t.replace(/\s*[—–-]\s*Order\s*#\S+\s*$/i, '').trim();

/* ─────────────────────────── next step ─────────────────────────── */

type Tone = 'action' | 'waiting' | 'done' | 'cancelled';

export interface NextStep {
  tone: Tone;
  title: string;
  body: string;
  cta?: { label: string; target: string };
}

export function getNextStep(order: Order): NextStep {
  const waiting = (title: string, body: string, cta?: NextStep['cta']): NextStep => ({ tone: 'waiting', title, body, cta });
  switch (order.status) {
    case 'action_required':
      return {
        tone: 'action',
        title: 'Send us the information we asked for',
        body: 'Your order is on hold until you respond. Upload the files or answer the question below.',
        cta: { label: 'Respond now', target: 'info-request' },
      };
    case 'quote_ready':
      return {
        tone: 'action',
        title: 'Choose your shipping option',
        body: 'Your quote is ready. Compare air and ocean freight, then pick the one that works best for you.',
        cta: { label: 'Review quote', target: 'quote' },
      };
    case 'deposit_required':
      return {
        tone: 'action',
        title: `Pay your deposit${order.deposit_amount ? ` of ${money(order.deposit_amount)}` : ''}`,
        body: 'Your deposit locks in your order so we can move forward with samples and production.',
        cta: { label: 'Pay deposit', target: 'deposit' },
      };
    case 'sample_production':
      if (!order.sample_price_per_unit)
        return waiting('We’re preparing your sample pricing', 'Nothing needed from you right now. We’ll let you know as soon as sample pricing is ready.');
      if (!order.sample_quantity_requested)
        return {
          tone: 'action',
          title: 'Approve your sample pricing',
          body: 'Review the sample cost and lead time, choose a quantity, and approve to continue.',
          cta: { label: 'Review sample pricing', target: 'samples' },
        };
      return {
        tone: 'action',
        title: 'Pay for your samples',
        body: 'You approved the sample pricing. Complete payment and we’ll start producing your samples.',
        cta: { label: 'Pay for samples', target: 'samples' },
      };
    case 'sample_approval_pending':
      if (!(order.sample_images?.length || order.sample_shipped))
        return waiting(
          'We’re preparing your samples',
          order.sample_physical_requested
            ? 'Nothing needed from you right now. We’ll let you know when your physical samples ship.'
            : 'Nothing needed from you right now. We’ll email you as soon as sample photos are ready to review.'
        );
      return {
        tone: 'action',
        title: 'Review your samples',
        body: 'Look over the sample photos and approve them, or tell us what you’d like changed.',
        cta: { label: 'Review samples', target: 'sample-review' },
      };
    case 'final_payment_required':
      return {
        tone: 'action',
        title: `Pay your remaining balance${order.final_payment_amount ? ` of ${money(order.final_payment_amount)}` : ''}`,
        body: 'Your order is ready to ship once the final payment is complete.',
        cta: { label: 'Pay balance', target: 'final-payment' },
      };
    case 'submitted':
    case 'under_review':
      return waiting('We’re reviewing your order', 'Nothing needed from you right now. We’ll email you when it’s time for your next step.');
    case 'sourcing':
      return waiting('We’re sourcing suppliers', 'Nothing needed from you right now. Your quote usually takes up to 5 business days.');
    case 'quote_accepted':
      return waiting('Quote accepted', 'Nothing needed from you right now. We’re preparing your deposit request.');
    case 'deposit_paid':
      return waiting('Deposit received', 'Nothing needed from you right now. We’re setting up samples with the factory.');
    case 'sample_approved':
      return waiting('Samples approved', 'Nothing needed from you right now. Your order is moving into production.');
    case 'manufacturing':
      return waiting('Your order is in production', 'Nothing needed from you right now. We’ll update you when it moves to quality check.');
    case 'quality_check':
      return waiting('Quality check in progress', 'Nothing needed from you right now. We’re inspecting your order before packing.');
    case 'packing':
      return waiting('Your order is being packed', 'Nothing needed from you right now.');
    case 'preparing_to_ship':
      return waiting('Preparing to ship', 'Nothing needed from you right now. We’ll share tracking once it leaves the factory.');
    case 'in_transit':
      return waiting('Your order is on its way', 'Nothing needed from you right now.', { label: 'Track shipment', target: 'tracker' });
    case 'delivered':
      return { tone: 'done', title: 'Your order was delivered', body: 'Thanks for building with Merchin. Questions? Send us a message below.' };
    case 'cancelled':
      return { tone: 'cancelled', title: 'This order was cancelled', body: 'See the details above. Send us a message if you have questions.' };
    default:
      return waiting('We’re on it', 'Nothing needed from you right now.');
  }
}

/* ─────────────────────────── unread updates ─────────────────────────── */

/**
 * Loads this user's unread notifications for the order (= what changed since they last
 * looked), keeps them on screen for this visit, and marks them read so the bell clears.
 */
export function useOrderUnread(orderId: string | undefined, userId: string | undefined) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!orderId || !userId) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const seenAt = await getLastSeen(supabase, userId, orderId);
      // Everything since the client last opened this order (never opened: the last 14 days)
      const after = seenAt || new Date(Date.now() - RECENT_MS).toISOString();
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('order_id', orderId)
        .eq('target_role', 'client')
        .gt('created_at', after)
        .order('created_at', { ascending: false })
        .limit(20);
      if (cancelled) return;
      const list = (data as AppNotification[]) || [];
      setLastSeen(seenAt);
      setItems(list);
      setLoaded(true);
      // Opening the order = seen: clear its bell notifications and the sidebar counts
      const unreadIds = list.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length) await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
      await markOrderSeen(userId, orderId, supabase);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, userId]);

  /** Messages/updates newer than this are "new" on this visit. */
  const since = lastSeen
    ? new Date(lastSeen)
    : items.length
      ? new Date(new Date(items[items.length - 1].created_at).getTime() - 2 * 60 * 1000)
      : null;
  const hasStatusUpdate = items.some((n) => n.type !== 'new_message');
  // "Got it" hides the summary; message highlights stay for this visit.
  return { items: hidden ? [] : items, loaded, since, hasStatusUpdate, dismiss: () => setHidden(true) };
}

/* ─────────────────────────── UI ─────────────────────────── */

function targetFor(n: AppNotification, next: NextStep): string {
  if (n.type === 'new_message') return 'messages';
  const t = `${n.title} ${n.body}`.toLowerCase();
  if (t.includes('information needed') || t.includes('more information')) return 'info-request';
  if (t.includes('quote')) return 'quote';
  if (t.includes('sample')) return next.cta?.target === 'sample-review' ? 'sample-review' : 'samples';
  if (t.includes('final payment') || t.includes('balance')) return 'final-payment';
  if (t.includes('deposit') && next.cta?.target === 'deposit') return 'deposit';
  if (t.includes('transit') || t.includes('shipped') || t.includes('tracking')) return 'tracker';
  return next.tone === 'action' && next.cta ? next.cta.target : 'progress';
}

function itemIcon(n: AppNotification) {
  if (n.type === 'new_message') return { Icon: MessageSquare, cls: 'bg-blue-100 text-blue-600' };
  const t = n.title.toLowerCase();
  if (t.includes('information')) return { Icon: AlertCircle, cls: 'bg-amber-100 text-amber-600' };
  if (t.includes('payment') || t.includes('deposit') || t.includes('invoice') || t.includes('refund'))
    return { Icon: CreditCard, cls: 'bg-orange-100 text-orange-600' };
  if (t.includes('sample')) return { Icon: FlaskConical, cls: 'bg-purple-100 text-purple-600' };
  if (t.includes('quote')) return { Icon: FileText, cls: 'bg-yellow-100 text-yellow-700' };
  if (t.includes('transit') || t.includes('ship')) return { Icon: Truck, cls: 'bg-sky-100 text-sky-600' };
  if (t.includes('cancel')) return { Icon: XCircle, cls: 'bg-red-100 text-red-600' };
  if (t.includes('deliver')) return { Icon: Package, cls: 'bg-green-100 text-green-600' };
  return { Icon: RefreshCw, cls: 'bg-emerald-100 text-emerald-600' };
}

const TONE: Record<Tone, { wrap: string; icon: React.ElementType; iconCls: string; label: string; labelCls: string }> = {
  action: {
    wrap: 'border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-white',
    icon: AlertCircle,
    iconCls: 'bg-emerald-500 text-white',
    label: 'Action needed from you',
    labelCls: 'text-emerald-700',
  },
  waiting: {
    wrap: 'border border-gray-200 bg-white',
    icon: Clock,
    iconCls: 'bg-gray-100 text-gray-500',
    label: 'Your next step',
    labelCls: 'text-gray-500',
  },
  done: {
    wrap: 'border border-green-200 bg-green-50',
    icon: CheckCircle2,
    iconCls: 'bg-green-100 text-green-600',
    label: 'All done',
    labelCls: 'text-green-700',
  },
  cancelled: {
    wrap: 'border border-gray-200 bg-white',
    icon: XCircle,
    iconCls: 'bg-red-50 text-red-500',
    label: 'Order status',
    labelCls: 'text-gray-500',
  },
};

export function OrderWhatsNew({
  order,
  items,
  onDismiss,
}: {
  order: Order;
  items: AppNotification[];
  onDismiss: () => void;
}) {
  const next = getNextStep(order);
  const tone = TONE[next.tone];
  const ToneIcon = tone.icon;

  return (
    <div className="space-y-4">
      {/* What's new since the last visit */}
      {items.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5 animate-fade-up">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="flex items-center gap-2 font-bold text-gray-900">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
                <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-blue-500" />
              </span>
              What&apos;s new on this order
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">
                {items.length} update{items.length === 1 ? '' : 's'}
              </span>
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
              aria-label="Dismiss updates"
            >
              <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Got it</span>
            </button>
          </div>
          <ul className="space-y-2">
            {items.slice(0, 5).map((n, i) => {
              const { Icon, cls } = itemIcon(n);
              const target = targetFor(n, next);
              const isMsg = n.type === 'new_message';
              return (
                <li
                  key={n.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="flex items-start gap-3 rounded-lg bg-white border border-blue-100 p-3 animate-fade-up"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {isMsg ? 'Merchin sent you a message' : cleanTitle(n.title)}
                      <span className="ml-2 text-xs font-normal text-gray-400">{timeAgo(n.created_at)}</span>
                    </p>
                    {n.body ? (
                      <p className={`text-sm text-gray-600 mt-0.5 line-clamp-3 break-words ${isMsg ? 'italic' : ''}`}>
                        {isMsg ? `“${n.body}”` : n.body}
                      </p>
                    ) : isMsg ? (
                      <p className="text-sm text-gray-600 mt-0.5">Sent you a file.</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => jumpToSection(target)}
                    className="shrink-0 self-center flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    {isMsg ? 'Reply' : 'View'} <ArrowRight className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
          {items.length > 5 && <p className="text-xs text-gray-500 mt-2">+{items.length - 5} earlier update{items.length - 5 === 1 ? '' : 's'}</p>}
        </div>
      )}

      {/* Next step */}
      <div className={`rounded-xl p-4 sm:p-5 ${tone.wrap}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tone.iconCls} ${next.tone === 'action' ? 'animate-pulse' : ''}`}>
              <ToneIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-bold uppercase tracking-wide ${tone.labelCls}`}>{tone.label}</p>
              <p className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">{next.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{next.body}</p>
            </div>
          </div>
          {next.cta && (
            <button
              type="button"
              onClick={() => jumpToSection(next.cta!.target)}
              className={`shrink-0 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors w-full sm:w-auto ${
                next.tone === 'action'
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {next.cta.label} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small "New" pill used next to section headers. */
export function NewPill({ label = 'New' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5">
      <Bell className="w-3 h-3" /> {label}
    </span>
  );
}

/** Order ids that have updates the client hasn't seen yet (for list badges). */
export function useUnreadOrderIds(userId: string | undefined) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async () => {
      const { ordersWithUpdates } = await getClientUnreadCounts(userId);
      if (!cancelled) setIds(ordersWithUpdates);
    };
    load();
    window.addEventListener(NOTIFICATIONS_CHANGED, load);
    return () => {
      cancelled = true;
      window.removeEventListener(NOTIFICATIONS_CHANGED, load);
    };
  }, [userId]);
  return ids;
}

/** "New update" / "Your turn" pills for order lists. */
export function OrderFlags({ order, hasUpdate }: { order: Order; hasUpdate: boolean }) {
  const yourTurn = order.status !== 'draft' && getNextStep(order).tone === 'action';
  if (!hasUpdate && !yourTurn) return null;
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {hasUpdate && (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> New update
        </span>
      )}
      {yourTurn && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5">
          Your turn
        </span>
      )}
    </span>
  );
}
