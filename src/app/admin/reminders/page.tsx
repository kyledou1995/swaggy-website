'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, Clock, PauseCircle, Send, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase';
import type { ReminderRunResult, ReminderKind } from '@/lib/reminders';

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

export default function AdminRemindersPage() {
  const [preview, setPreview] = useState<ReminderRunResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [ran, setRan] = useState<ReminderRunResult | null>(null);

  const call = useCallback(async (dryRun: boolean) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/cron/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ dryRun }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return json as ReminderRunResult;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPreview(await call(true));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reminders');
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  const runNow = async () => {
    if (!preview?.remindersDue.length && !preview?.handoffs.length) return;
    if (!window.confirm(`Send ${preview.remindersDue.length} reminder(s) and ${preview.handoffs.length} team hand-off(s) now?`)) return;
    setRunning(true);
    setError('');
    try {
      setRan(await call(false));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

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
              Runs every weekday at about 10am ET; stops as soon as the client acts.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={load} disabled={loading}>Refresh</Button>
            <Button variant="primary" size="sm" onClick={runNow} isLoading={running} disabled={running || loading || (!preview?.remindersDue.length && !preview?.handoffs.length)}>
              <Send className="w-4 h-4 mr-2" /> Send due now
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}
        {ran && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            Sent {ran.emailsSent} email{ran.emailsSent === 1 ? '' : 's'} ({ran.remindersDue.length} reminder{ran.remindersDue.length === 1 ? '' : 's'}, {ran.handoffs.length} hand-off{ran.handoffs.length === 1 ? '' : 's'}).
            {!ran.weekday && ' It’s the weekend, so client emails will go out on the next business day.'}
            {ran.errors.length > 0 && ` Errors: ${ran.errors.join('; ')}`}
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
                {preview.remindersDue.length === 0 && preview.handoffs.length === 0 ? (
                  <p className="text-sm text-gray-500">Nothing due right now.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {preview.remindersDue.map((r, i) => (
                      <div key={`r${i}`} className="py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                        <span className="font-semibold text-gray-900 w-32">{r.order}</span>
                        <span className="text-gray-700 flex-1">{KIND_LABEL[r.kind]}</span>
                        <Badge variant={r.reminder >= 3 ? 'warning' : 'info'} size="sm">{r.kind === 'message' ? 'Message reminder' : ordinal(r.reminder)}</Badge>
                        <span className="text-gray-500 text-xs sm:w-64 truncate">{r.recipients.length ? r.recipients.join(', ') : 'No recipients (reminders turned off)'}</span>
                      </div>
                    ))}
                    {preview.handoffs.map((h, i) => (
                      <div key={`h${i}`} className="py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                        <span className="font-semibold text-gray-900 w-32">{h.order}</span>
                        <span className="text-gray-700 flex-1">{KIND_LABEL[h.kind]}</span>
                        <Badge variant="error" size="sm">Hand-off to team</Badge>
                        <span className="text-gray-500 text-xs sm:w-64">Admins get an email + bell alert</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-gray-900">Upcoming</h2></CardHeader>
              <CardBody>
                {preview.upcoming.length === 0 ? (
                  <p className="text-sm text-gray-500">No upcoming reminders.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {[...preview.upcoming].sort((a, b) => a.next.localeCompare(b.next)).map((u, i) => (
                      <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                        <span className="font-semibold text-gray-900 w-32">{u.order}</span>
                        <span className="text-gray-700 flex-1">{KIND_LABEL[u.kind]}</span>
                        <Badge variant="neutral" size="sm">{u.kind === 'message' ? 'Message reminder' : ordinal(u.reminder)}</Badge>
                        <span className="text-gray-500 text-xs sm:w-64">{fmt(u.next)} (next weekday run)</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {preview.paused.length > 0 && (
              <Card>
                <CardHeader><h2 className="text-lg font-semibold text-gray-900">Paused — the client is waiting on us</h2></CardHeader>
                <CardBody>
                  <p className="text-sm text-gray-500 mb-3">The client sent a message after we asked. Reminders resume once we reply.</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.paused.map((p, i) => (
                      <span key={i} className="text-sm rounded-full border border-gray-200 px-3 py-1 text-gray-700">
                        {p.order} · {KIND_LABEL[p.kind]}
                      </span>
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
              Clients can turn reminders off in their <Link href="/portal/notifications" className="underline">Notification Preferences</Link>.
            </p>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
