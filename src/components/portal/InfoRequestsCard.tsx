'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Paperclip, Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { fileNameFromUrl, isImageUrl, type InfoRequest } from '@/lib/info-requests';

const MAX_FILE_MB = 25;

interface Pending {
  file: File;
  preview: string | null;
}

function RequestForm({ req, userId, onDone }: { req: InfoRequest; userId: string; onDone: () => void }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = req.request_type === 'photo' ? 'image/*' : undefined;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: Pending[] = [];
    for (const f of Array.from(list)) {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`${f.name} is larger than ${MAX_FILE_MB} MB.`);
        continue;
      }
      next.push({ file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null });
    }
    setFiles((prev) => [...prev, ...next].slice(0, 20));
  };

  const submit = async () => {
    setError('');
    if (!text.trim() && files.length === 0) {
      setError(req.request_type === 'text' ? 'Please type your answer.' : 'Please add at least one file or a note.');
      return;
    }
    setBusy(true);
    try {
      // Upload files to storage
      const urls: string[] = [];
      for (const { file } of files) {
        const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
        const safe = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 40) || 'file';
        const path = `${userId}/requests/${req.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}.${ext}`;
        const { error: upErr } = await supabase.storage.from('order-inspiration').upload(path, file, { cacheControl: '3600', upsert: false });
        if (upErr) throw new Error(`Upload failed for ${file.name}: ${upErr.message}`);
        urls.push(supabase.storage.from('order-inspiration').getPublicUrl(path).data.publicUrl);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/info-requests/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ requestId: req.id, text: text.trim(), files: urls }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Could not submit your response.');
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {req.request_type !== 'text' && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragging ? 'border-amber-500 bg-amber-100/60' : 'border-amber-300 bg-white hover:bg-amber-50'
            }`}
          >
            <Upload className="w-6 h-6 mx-auto text-amber-600 mb-2" />
            <p className="text-sm font-medium text-gray-900">
              {req.request_type === 'photo' ? 'Tap to add photos' : 'Tap to add files'} <span className="hidden sm:inline">or drag them here</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Up to {MAX_FILE_MB} MB each</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={accept}
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative">
                  {f.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.preview} alt={f.file.name} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border border-gray-200 bg-white flex flex-col items-center justify-center p-1">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] text-gray-500 truncate w-full text-center mt-1">{f.file.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${f.file.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, k) => k !== i))}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={req.request_type === 'text' ? 4 : 2}
        placeholder={req.request_type === 'text' ? 'Type your answer…' : 'Add a note (optional)'}
        className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button variant="primary" onClick={submit} isLoading={busy} disabled={busy} className="w-full sm:w-auto">
        {busy ? 'Submitting…' : 'Submit response'}
      </Button>
    </div>
  );
}

/** Client-facing: open information requests on an order, with upload + reply. */
export function InfoRequestsCard({
  orderId,
  userId,
  onSubmitted,
}: {
  orderId: string;
  userId: string;
  /** Called after a response is submitted (e.g. to refresh order status). */
  onSubmitted?: () => void;
}) {
  const [requests, setRequests] = useState<InfoRequest[]>([]);
  const [justSent, setJustSent] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('order_info_requests')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    if (!error) setRequests((data as InfoRequest[]) || []);
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const open = requests.filter((r) => r.status === 'open');
  const answered = requests.filter((r) => r.status === 'submitted' || r.status === 'resolved');

  if (open.length === 0 && !justSent && answered.length === 0) return null;

  return (
    <div className="space-y-4">
      {open.map((r) => (
        <div key={r.id} id="info-request" className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5 animate-fade-up scroll-mt-24">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-amber-900">Action required: we need more information</p>
              <p className="text-sm text-amber-900/80 mt-1 whitespace-pre-wrap break-words">{r.message}</p>
              <p className="text-xs text-amber-700 mt-1">Your order is on hold until you respond.</p>
            </div>
          </div>
          <RequestForm
            req={r}
            userId={userId}
            onDone={() => {
              setJustSent(true);
              load();
              onSubmitted?.();
            }}
          />
        </div>
      ))}

      {justSent && open.length === 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3 animate-fade-up">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">
            Thanks — we received your response. Our team will review it and keep your order moving.
          </p>
        </div>
      )}

      {answered.length > 0 && (
        <details className="rounded-xl border border-gray-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">
            Information you&apos;ve provided ({answered.length})
          </summary>
          <div className="mt-3 space-y-4">
            {answered.map((r) => (
              <div key={r.id} className="text-sm border-t border-gray-100 pt-3 first:border-0 first:pt-0">
                <p className="text-gray-500">
                  <span className="font-medium text-gray-700">We asked:</span> {r.message}
                </p>
                {r.response_text && <p className="text-gray-900 mt-1 whitespace-pre-wrap break-words">{r.response_text}</p>}
                {r.response_files?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {r.response_files.map((url) =>
                      isImageUrl(url) ? (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="Uploaded" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        </a>
                      ) : (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 rounded border border-gray-200 text-xs text-gray-700 hover:bg-gray-50">
                          <Paperclip className="w-3 h-3" />
                          <span className="max-w-[140px] truncate">{fileNameFromUrl(url)}</span>
                        </a>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
