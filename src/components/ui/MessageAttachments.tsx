'use client';

import React, { useRef, useState } from 'react';
import { fileUrl } from '@/lib/file-url';
import { FileText, Paperclip, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { fileNameFromUrl, isImageUrl } from '@/lib/info-requests';
import { useLightbox } from './ImageLightbox';

export const MAX_ATTACHMENT_MB = 25;
const MAX_ATTACHMENTS = 10;

interface PendingFile {
  file: File;
  preview: string | null;
}

/** State + upload helper for message attachments. */
export function useMessageAttachments() {
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState('');

  const add = (list: FileList | File[] | null) => {
    if (!list) return;
    setError('');
    const next: PendingFile[] = [];
    for (const f of Array.from(list)) {
      if (f.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
        setError(`${f.name} is larger than ${MAX_ATTACHMENT_MB} MB.`);
        continue;
      }
      next.push({ file: f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null });
    }
    setFiles((prev) => [...prev, ...next].slice(0, MAX_ATTACHMENTS));
  };

  const remove = (index: number) =>
    setFiles((prev) => {
      const f = prev[index];
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((_, i) => i !== index);
    });

  const clear = () =>
    setFiles((prev) => {
      prev.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      return [];
    });

  /** Uploads every pending file and returns their public URLs (throws on failure). */
  const uploadAll = async (userId: string, orderId: string): Promise<string[]> => {
    const supabase = createClient();
    const urls: string[] = [];
    for (const { file } of files) {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
      const safe = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 40) || 'file';
      const path = `${userId}/messages/${orderId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('order-inspiration')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw new Error(`Upload failed for ${file.name}: ${upErr.message}`);
      urls.push(supabase.storage.from('order-inspiration').getPublicUrl(path).data.publicUrl);
    }
    return urls;
  };

  return { files, error, setError, add, remove, clear, uploadAll };
}

/** Paperclip button that opens the file picker. */
export function AttachButton({
  onFiles,
  disabled,
  className = '',
  label,
}: {
  onFiles: (files: FileList | null) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={disabled}
        aria-label="Attach files"
        title="Attach files"
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 ${className}`}
      >
        <Paperclip className="w-4 h-4" />
        {label && <span>{label}</span>}
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </>
  );
}

/** Pending (not yet sent) attachments with remove buttons. */
export function PendingAttachments({
  files,
  onRemove,
}: {
  files: { file: File; preview: string | null }[];
  onRemove: (index: number) => void;
}) {
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((f, i) => (
        <div key={i} className="relative">
          {f.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.preview} alt={f.file.name} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
          ) : (
            <div className="h-16 max-w-[160px] rounded-lg border border-gray-200 bg-white flex items-center gap-1.5 px-2.5">
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-700 truncate">{f.file.name}</span>
            </div>
          )}
          <button
            type="button"
            aria-label={`Remove ${f.file.name}`}
            onClick={() => onRemove(i)}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Attachments on a sent message: image thumbnails + file links. */
export function AttachmentList({ urls, dark = false }: { urls?: string[] | null; dark?: boolean }) {
  const list = (urls || []).filter(Boolean);
  const images = list.filter((u) => /^https?:\/\//.test(u) && isImageUrl(u));
  const { openAt, viewer } = useLightbox(images);
  if (!list.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {viewer}
      {list.map((url) => {
        const isLink = /^https?:\/\//.test(url);
        if (isLink && isImageUrl(url)) {
          return (
            <button key={url} type="button" onClick={() => openAt(url)} aria-label="View image" className="block cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(url)} alt="Attachment" className="w-24 h-24 object-cover rounded-lg border border-black/10 hover:opacity-90" />
            </button>
          );
        }
        const name = isLink ? fileNameFromUrl(url) : url;
        const chip = `flex items-center gap-1.5 max-w-[220px] px-2.5 py-1.5 rounded-lg text-xs ${
          dark ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
        }`;
        return isLink ? (
          <a key={url} href={fileUrl(url)} target="_blank" rel="noopener noreferrer" className={chip}>
            <Paperclip className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{name}</span>
          </a>
        ) : (
          <span key={url} className={chip}>
            <Paperclip className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{name}</span>
          </span>
        );
      })}
    </div>
  );
}
