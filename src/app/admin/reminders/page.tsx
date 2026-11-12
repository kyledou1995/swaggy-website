'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  BellRing,
  Clock,
  PauseCircle,
  Send,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  X,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase';
import type { EmailPreview, ReminderRunResult, ReminderKind } from '@/lib/reminders';

const KIND_LABEL: Record<ReminderKind, string> = {
  quote: 'Choose shipping option',
  deposit: 'Pay deposit',
  sample_pricing: 'Approve sample pricing',
  sample_payment: 'Pay for samples',
  sample_review: 'Review samples',
  final_payment: 'Pay remaining balance',
  info_request: 'Answer info request',
  action_required: 'Respond to request',
  message: 'Unread message',
};

const ordinal = (n: number) => (n === 1 ? '1st (24 hours)' : n === 2 ? '2nd (day 3)' : n === 3 ? 'Final (day 7)' : `#${n}`);
const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** One reminder row the admin can open (due now, upcoming, or paused). */
interface ItemView {
  orderId: string;
  itemKey: string;
  order: string;
  company: string;
  kind: ReminderKind;
  reminder: number | null;
  recipients: string[];
  preview: EmailPreview | null;
  /** When it would normally go out. */
  when: string;
  section: 'due' | 'upcoming' | 'paused';
}

/* ─────────────────────────── small UI pieces ─────────────────────────── */

function Modal({ title, onClose, children, footer }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full sm:max-w-3xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">{title}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

function EmailFrame({ email, height = 560 }: { email: EmailPreview; height?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-xs space-y-1">
        <p className="text-gray-500">
          <span className="font-semibold text-gray-700">To:</span>{' '}
          {email.to.length ? email.to.join(', ') : <span className="text-amber-700">No recipients (reminders turned off). It will be counted, not emailed.</span>}
        </p>
        <p className="text-gray-500">
          <span className="font-semibold text-gray-700">Subject:</span> <span className="text-gray-900">{email.subject}</span>
        </p>
      </div>
      {/* Sandboxed: preview only, links and scripts are disabled */}
      <iframe title={email.subject} srcDoc={email.html} sandbox="" className="w-full bg-[#f5f5f5]" style={{ height }} />
    </div>
  );
}

function Row({ item, onOpen, right }: { item: { order: string; company: string; kind: ReminderKind }; onOpen: () => void; right: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full text-left py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm"
    >
      <span className="sm:w-40 shrink-0">
        <span className="font-semibold text-gray-900 block">{item.order}</span>
        <span className="text-xs text-gray-500 block truncate">{item.company}</span>
      </span>
      <span className="text-gray-700 flex-1">{KIND_LABEL[item.kind]}</span>
      {right}
      <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-green-700 opacity-0 group-hover:opacity-100 transition-opacity">
        <Mail className="w-3.5 h-3.5" /> Preview
      </span>
      <ChevronRight className="hidden sm:block w-4 h-4 text-gray-300 group-hover:text-gray-600" />
    </button>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

export default function AdminRemindersPage() {
  const [preview, setPreview] = useState<ReminderRunResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  // Single-item preview / send early
  const [openItem, setOpenItem] = useState<ItemView | null>(null);
  const [confirmItem, setConfirmItem] = useState(false);
  const [sendingItem, setSendingItem] = useState(false);

  // "Send due now" review
  const [reviewAll, setReviewAll] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [sendingAll, setSendingAll] = useState(false);

  const call = useCallback(async (body: Record<string, unknown>) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/cron/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return json as ReminderRunResult;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPreview(await call({ dryRun: true }));
      setCheckedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reminders');
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  const closeItem = useCallback(() => {
    setOpenItem(null);
    setConfirmItem(false);
  }, []);
  const closeReview = useCallback(() => setReviewAll(false), []);

  const sendItemNow = async () => {
    if (!openItem) return;
    setSendingItem(true);
    setError('');
    try {
      const r = await call({ dryRun: false, only: { orderId: openItem.orderId, itemKey: openItem.itemKey } });
      if (r.errors.length && !r.emailsSent) throw new Error(r.errors.join('; '));
      setNotice(
        r.emailsSent
          ? `Sent the ${openItem.reminder ? ordinal(openItem.reminder).split(' ')[0].toLowerCase() : ''} reminder for ${openItem.order} to ${openItem.recipients.join(', ')}.`
          : `Reminder for ${openItem.order} recorded, but no one received it (reminders are turned off for this client).`
      );
      closeItem();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the reminder');
    } finally {
      setSendingItem(false);
    }
  };

  const sendAllNow = async () => {
    setSendingAll(true);
    setError('');
    try {
      const r = await call({ dryRun: false });
      setNotice(
        `Sent ${r.emailsSent} email${r.emailsSent === 1 ? '' : 's'} (${r.remindersDue.length} reminder${r.remindersDue.length === 1 ? '' : 's'}, ${r.handoffs.length} hand-off${r.handoffs.length === 1 ? '' : 's'}).` +
          (!r.weekday ? ' It’s the weekend, so client reminders wait for the next business day.' : '') +
          (r.errors.length ? ` Errors: ${r.errors.join('; ')}` : '')
      );
      setReviewAll(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setSendingAll(false);
    }
  };

  const dueItems: ItemView[] = (preview?.remindersDue || []).map((r) => ({ ...r, when: 'Due now', section: 'due' }));
  const upcomingItems: ItemView[] = [...(preview?.upcoming || [])]
    .sort((a, b) => a.next.localeCompare(b.next))
    .map((u) => ({ ...u, when: `Due ${fmt(u.next)}`, section: 'upcoming' }));
  const pausedItems: ItemView[] = (preview?.paused || []).map((p) => ({ ...p, when: 'Paused', section: 'paused' }));

  const batchCount = preview?.batches.length || 0;
  const totalEmails =
    (preview?.batches || []).reduce((n, b) => n + b.preview.to.length, 0) + (preview?.handoffPreview?.to.length || 0);
  const nothingDue = !preview?.remindersDue.length && !preview?.handoffs.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BellRing className="w-7 h-7 text-green-600" /> Client Reminders
            </h1>
            <p className="text-gray-600 mt-1 max-w-2xl">
              When an order is waiting on the client, they get automatic email reminders at <b>24 hours</b>, <b>day 3</b>, and a <b>final reminder on day 7</b>.
              Two days after that, you get a hand-off alert to follow up personally. Unread messages get one reminder after 24 hours.
              Runs every weekday at about 10am ET; stops as soon as the client acts. Click any reminder to preview it.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setNotice(''); load(); }} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Refreshing…' : 'Refresh'}
              </Button>
              <Button variant="primary" size="sm" onClick={() => { setExpanded(0); setReviewAll(true); }} disabled={loading || nothingDue}>
                <Send className="w-4 h-4 mr-2" /> Send due now
              </Button>
            </div>
            {checkedAt && <p className="text-xs text-gray-400">Last checked {checkedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</p>}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}
        {notice && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> {notice}
          </div>
        )}

        {loading && !preview ? (
          <p className="text-gray-500">Loading…</p>
        ) : preview ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Waiting on clients', value: preview.pending, icon: Clock },
                { label: 'Reminders due now', value: preview.remindersDue.length, icon: Send },
                { label: 'Paused (client replied)', value: preview.paused.length, icon: PauseCircle },
                { label: 'Hand-offs due', value: preview.handoffs.length, icon: UserCheck },
              ].map((s) => (
                <Card key={s.label}>
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{s.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    </div>
                    <s.icon className="w-6 h-6 text-green-600" />
                  </CardBody>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-gray-900">Due on the next run</h2></CardHeader>
              <CardBody>
                {dueItems.length === 0 && preview.handoffs.length === 0 ? (
                  <p className="text-sm text-gray-500">Nothing due right now.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {dueItems.map((r, i) => (
                      <Row
                        key={`r${i}`}
                        item={r}
                        onOpen={() => setOpenItem(r)}
                        right={
                          <>
                            <Badge variant={(r.reminder || 0) >= 3 ? 'warning' : 'info'} size="sm">{r.kind === 'message' ? 'Message reminder' : ordinal(r.reminder || 1)}</Badge>
                            <span className="text-gray-500 text-xs sm:w-56 truncate">{r.recipients.length ? r.recipients.join(', ') : 'No recipients (reminders off)'}</span>
                          </>
                        }
                      />
                    ))}
                    {preview.handoffs.map((h, i) => (
                      <Link key={`h${i}`} href={`/admin/orders/${h.orderId}`} className="group py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                        <span className="font-semibold text-gray-900 sm:w-40">{h.order}</span>
                        <span className="text-gray-700 flex-1">{KIND_LABEL[h.kind]}</span>
                        <Badge variant="error" size="sm">Hand-off to team</Badge>
                        <span className="text-gray-500 text-xs sm:w-56">Admins get an email + bell alert</span>
                        <ChevronRight className="hidden sm:block w-4 h-4 text-gray-300 group-hover:text-gray-600" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-gray-900">Upcoming</h2></CardHeader>
              <CardBody>
                {upcomingItems.length === 0 ? (
                  <p className="text-sm text-gray-500">No upcoming reminders.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {upcomingItems.map((u, i) => (
                      <Row
                        key={i}
                        item={u}
                        onOpen={() => setOpenItem(u)}
                        right={
                          <>
                            <Badge variant="neutral" size="sm">{u.kind === 'message' ? 'Message reminder' : ordinal(u.reminder || 1)}</Badge>
                            <span className="text-gray-500 text-xs sm:w-56">{u.when} · goes out on the next weekday run after that</span>
                          </>
                        }
                      />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {pausedItems.length > 0 && (
              <Card>
                <CardHeader><h2 className="text-lg font-semibold text-gray-900">Paused: the client is waiting on us</h2></CardHeader>
                <CardBody>
                  <p className="text-sm text-gray-500 mb-1">The client sent a message after we asked. Reminders resume once we reply.</p>
                  <div className="divide-y divide-gray-100">
                    {pausedItems.map((p, i) => (
                      <Row
                        key={i}
                        item={p}
                        onOpen={() => setOpenItem(p)}
                        right={<Badge variant="neutral" size="sm">Paused</Badge>}
                      />
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {preview.errors.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {preview.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
            <p className="text-xs text-gray-400">
              Clients can turn reminders off in their Notification Preferences.
            </p>
          </>
        ) : null}
      </div>

      {/* ── Single reminder: preview + send early ── */}
      {openItem && (
        <Modal
          onClose={closeItem}
          title={
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {openItem.company} · Order {openItem.order}
              </p>
              <p className="text-lg font-bold text-gray-900">{KIND_LABEL[openItem.kind]}</p>
              <p className="text-sm text-gray-500">
                {openItem.reminder ? (openItem.kind === 'message' ? 'Message reminder' : `${ordinal(openItem.reminder)} reminder`) : 'All reminders sent'} · {openItem.when}
              </p>
            </div>
          }
          footer={
            confirmItem ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-sm text-gray-800 flex-1">
                  Send this reminder to <b>{openItem.recipients.length ? openItem.recipients.join(', ') : 'nobody (reminders off)'}</b> now?
                  {openItem.section !== 'due' && ' The next reminder will follow the normal schedule from today.'}
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={sendItemNow} isLoading={sendingItem}>Yes, send now</Button>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmItem(false)} disabled={sendingItem}>Back</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
                <Link href={`/admin/orders/${openItem.orderId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
                  <ExternalLink className="w-4 h-4" /> Open order
                </Link>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={closeItem}>Close</Button>
                  {openItem.preview && (
                    <Button variant="primary" size="sm" onClick={() => setConfirmItem(true)}>
                      <Send className="w-4 h-4 mr-2" /> {openItem.section === 'due' ? 'Send now' : 'Send early'}
                    </Button>
                  )}
                </div>
              </div>
            )
          }
        >
          {openItem.preview ? (
            <EmailFrame email={openItem.preview} />
          ) : (
            <p className="text-sm text-gray-500">All automatic reminders for this item have been sent. Follow up personally from the order page.</p>
          )}
        </Modal>
      )}

      {/* ── Send due now: review every email first ── */}
      {reviewAll && preview && (
        <Modal
          onClose={closeReview}
          title={
            <div>
              <p className="text-lg font-bold text-gray-900">Review before sending</p>
              <p className="text-sm text-gray-500">
                {batchCount} client email{batchCount === 1 ? '' : 's'}
                {preview.handoffPreview ? ' + 1 team hand-off' : ''} · {totalEmails} recipient{totalEmails === 1 ? '' : 's'} in total
              </p>
            </div>
          }
          footer={
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-gray-700 flex-1">
                {!preview.weekday
                  ? 'It’s the weekend: client reminders will wait for the next business day. Team hand-offs send now.'
                  : 'Each company gets one email with all of its items. Nothing is sent until you confirm.'}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={closeReview} disabled={sendingAll}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={sendAllNow} isLoading={sendingAll}>
                  <Send className="w-4 h-4 mr-2" /> Confirm & send {totalEmails} email{totalEmails === 1 ? '' : 's'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-3">
            {preview.batches.map((b, i) => (
              <div key={i} className="rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-xl"
                >
                  <Mail className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900 truncate">{b.preview.subject}</span>
                    <span className="block text-xs text-gray-500 truncate">
                      {b.company} · {b.orders.join(', ')} · to {b.preview.to.length ? b.preview.to.join(', ') : 'nobody (reminders off)'}
                    </span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
                </button>
                {expanded === i && (
                  <div className="px-4 pb-4">
                    <EmailFrame email={b.preview} height={520} />
                  </div>
                )}
              </div>
            ))}
            {preview.handoffPreview && (
              <div className="rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === -1 ? null : -1)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-xl"
                >
                  <UserCheck className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900 truncate">{preview.handoffPreview.subject}</span>
                    <span className="block text-xs text-gray-500 truncate">Team hand-off · to {preview.handoffPreview.to.join(', ') || 'no admins'}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded === -1 ? 'rotate-180' : ''}`} />
                </button>
                {expanded === -1 && (
                  <div className="px-4 pb-4">
                    <EmailFrame email={preview.handoffPreview} height={480} />
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
