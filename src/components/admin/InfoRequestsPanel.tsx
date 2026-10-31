'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FileText, HelpCircle, ImageIcon, MessageSquareText, CheckCircle2, XCircle, Paperclip } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase';
import { notifyOrgMembers } from '@/lib/notifications';
import {
  INFO_REQUEST_TYPE_LABELS,
  fileNameFromUrl,
  isImageUrl,
  isMissingTableError,
  type InfoRequest,
  type InfoRequestType,
} from '@/lib/info-requests';
import type { Order } from '@/types';

const TYPE_ICONS: Record<InfoRequestType, React.ElementType> = {
  photo: ImageIcon,
  file: FileText,
  text: MessageSquareText,
};

const STATUS_BADGE: Record<InfoRequest['status'], { variant: 'warning' | 'success' | 'info' | 'neutral'; label: string }> = {
  open: { variant: 'warning', label: 'Waiting on client' },
  submitted: { variant: 'success', label: 'Client responded' },
  resolved: { variant: 'neutral', label: 'Resolved' },
  cancelled: { variant: 'neutral', label: 'Cancelled' },
};

const TEMPLATES: { label: string; type: InfoRequestType; message: string }[] = [
  { label: 'Inspiration photos', type: 'photo', message: 'Could you upload a few inspiration photos showing the look and feel you want?' },
  { label: 'Logo file', type: 'file', message: 'Please upload your logo in high resolution (vector .ai, .eps, .svg or .pdf preferred).' },
  { label: 'Artwork / dieline', type: 'file', message: 'Please upload the final artwork or packaging dieline for this order.' },
  { label: 'Clarify details', type: 'text', message: '' },
];

export function InfoRequestsPanel({
  order,
  adminUserId,
  refreshKey = 0,
  onStatusChange,
}: {
  order: Order;
  adminUserId?: string | null;
  /** Bump to reload (e.g. after a request is created elsewhere on the page). */
  refreshKey?: number;
  /** Called when sending a request puts the order into "Action Required". */
  onStatusChange?: (status: Order['status']) => void;
}) {
  const [requests, setRequests] = useState<InfoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [type, setType] = useState<InfoRequestType>('photo');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('order_info_requests')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });
    if (error) {
      if (isMissingTableError(error.message)) setSetupNeeded(true);
      else console.error('Info requests load failed:', error.message);
    } else {
      setRequests((data as InfoRequest[]) || []);
    }
    setLoading(false);
  }, [order.id]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const sendRequest = async () => {
    if (!message.trim()) {
      setFeedback({ type: 'error', text: 'Describe what you need from the client.' });
      return;
    }
    setSending(true);
    setFeedback(null);
    const supabase = createClient();
    const { error } = await supabase.from('order_info_requests').insert({
      order_id: order.id,
      requested_by: adminUserId || null,
      request_type: type,
      message: message.trim(),
      status: 'open',
      previous_status: order.status === 'action_required' ? null : order.status,
    });
    if (error) {
      setSending(false);
      setFeedback({ type: 'error', text: isMissingTableError(error.message) ? 'Database setup needed (see below).' : error.message });
      if (isMissingTableError(error.message)) setSetupNeeded(true);
      return;
    }

    // Put the order on hold until the client responds
    if (order.status !== 'action_required') {
      await supabase.from('orders').update({ status: 'action_required', updated_at: new Date().toISOString() }).eq('id', order.id);
      onStatusChange?.('action_required');
    }

    await supabase.from('order_updates').insert([{
      order_id: order.id,
      status: 'action_required',
      message: `Information requested: ${message.trim()}`,
      created_by: adminUserId || null,
    }]);

    if (order.client_id) {
      await notifyOrgMembers({
        orderId: order.id,
        clientId: order.client_id,
        type: 'order_status',
        title: `Information needed — Order #${order.order_number || order.id.slice(0, 8)}`,
        body: message.trim(),
        supabaseClient: supabase,
        email: { event: 'info_requested', message: message.trim() },
      });
    }

    setMessage('');
    setSending(false);
    setFeedback({ type: 'success', text: 'Request sent and order set to Action Required. The client has been notified by email and in their portal.' });
    load();
  };

  const setStatus = async (req: InfoRequest, status: InfoRequest['status']) => {
    const supabase = createClient();
    await supabase.from('order_info_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', req.id);
    load();
  };

  const openCount = requests.filter((r) => r.status === 'open').length;
  const newResponses = requests.filter((r) => r.status === 'submitted').length;

  return (
    <Card>
      <div id="info-requests" className="scroll-mt-24" />
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-gray-500" />
            Information Requests
          </h2>
          <div className="flex gap-2">
            {newResponses > 0 && <Badge variant="success">{newResponses} new response{newResponses === 1 ? '' : 's'}</Badge>}
            {openCount > 0 && <Badge variant="warning">{openCount} waiting</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        {setupNeeded ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Information requests need a one-time database setup. Run the SQL in
            <code className="mx-1 px-1 bg-amber-100 rounded">supabase/migrations/2026-11-01_order_info_requests.sql</code>
            in Supabase → SQL Editor, then refresh.
          </div>
        ) : (
          <>
            {/* New request */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Ask the client for something specific. The order moves to <b>Action Required</b> until they respond; they&apos;ll get an email and a card on their order page where they can upload files or reply. Once they respond, the order returns to its previous status.</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => {
                      setType(t.type);
                      if (t.message) setMessage(t.message);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-700 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(Object.keys(INFO_REQUEST_TYPE_LABELS) as InfoRequestType[]).map((t) => {
                  const Icon = TYPE_ICONS[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
                        type === t ? 'border-green-500 bg-green-50 text-green-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {INFO_REQUEST_TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="e.g. Please upload 2–3 inspiration photos of the tote style you like."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {feedback && (
                <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>{feedback.text}</p>
              )}
              <Button variant="primary" size="sm" onClick={sendRequest} isLoading={sending} disabled={sending}>
                Send request to client
              </Button>
            </div>

            {/* History */}
            {loading ? (
              <p className="text-sm text-gray-500">Loading requests…</p>
            ) : requests.length > 0 ? (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                {requests.map((r) => {
                  const Icon = TYPE_ICONS[r.request_type] || HelpCircle;
                  const badge = STATUS_BADGE[r.status];
                  return (
                    <div key={r.id} className={`rounded-lg border p-4 ${r.status === 'submitted' ? 'border-green-300 bg-green-50/40' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">{r.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {INFO_REQUEST_TYPE_LABELS[r.request_type]} · requested {new Date(r.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                      </div>

                      {(r.response_text || r.response_files?.length > 0) && (
                        <div className="mt-3 pl-6 space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Client response{r.responded_at ? ` · ${new Date(r.responded_at).toLocaleString()}` : ''}
                          </p>
                          {r.response_text && <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{r.response_text}</p>}
                          {r.response_files?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {r.response_files.map((url) =>
                                isImageUrl(url) ? (
                                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt="Client upload" className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:opacity-90" />
                                  </a>
                                ) : (
                                  <a
                                    key={url}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                                  >
                                    <Paperclip className="w-4 h-4" />
                                    <span className="max-w-[180px] truncate">{fileNameFromUrl(url)}</span>
                                  </a>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {(r.status === 'open' || r.status === 'submitted') && (
                        <div className="mt-3 pl-6 flex gap-3 text-xs">
                          {r.status === 'submitted' && (
                            <button onClick={() => setStatus(r, 'resolved')} className="flex items-center gap-1 text-green-700 hover:text-green-800 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark resolved
                            </button>
                          )}
                          {r.status === 'submitted' && (
                            <button onClick={() => setStatus(r, 'open')} className="text-gray-600 hover:text-gray-800 font-medium">
                              Ask again
                            </button>
                          )}
                          {r.status === 'open' && (
                            <button onClick={() => setStatus(r, 'cancelled')} className="flex items-center gap-1 text-gray-500 hover:text-red-600 font-medium">
                              <XCircle className="w-3.5 h-3.5" /> Cancel request
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </CardBody>
    </Card>
  );
}
