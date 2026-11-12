'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { fileUrl } from '@/lib/file-url';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { fileNameFromUrl } from '@/lib/info-requests';

/** Adds Supabase's ?download param so the browser saves the file instead of opening it. */
function downloadUrl(url: string) {
  if (!/\/storage\/v1\/object\/public\//.test(url)) return url;
  return `${fileUrl(url)}${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(fileNameFromUrl(url))}`;
}

/** Full-screen in-app image viewer. Esc / backdrop closes, arrow keys switch images. */
export function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const count = images.length;
  const prev = useCallback(() => onIndexChange((index - 1 + count) % count), [index, count, onIndexChange]);
  const next = useCallback(() => onIndexChange((index + 1) % count), [index, count, onIndexChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && count > 1) prev();
      else if (e.key === 'ArrowRight' && count > 1) next();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, prev, next, count]);

  // Basic swipe support on touch devices
  const [touchX, setTouchX] = useState<number | null>(null);

  if (typeof document === 'undefined') return null;
  const url = images[index];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-[100] bg-black/90 flex flex-col animate-fade-in"
      onClick={onClose}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
        setTouchX(null);
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm truncate min-w-0">
          {fileNameFromUrl(url)}
          {count > 1 && <span className="text-white/60 ml-2">{index + 1} / {count}</span>}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={downloadUrl(url)}
            download
            aria-label="Download image"
            title="Download"
            className="p-2 rounded-full hover:bg-white/10"
          >
            <Download className="w-5 h-5" />
          </a>
          <button type="button" onClick={onClose} aria-label="Close" title="Close (Esc)" className="p-2 rounded-full hover:bg-white/10">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="relative flex-1 flex items-center justify-center px-4 pb-6 min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={url}
          src={fileUrl(url)}
          alt={fileNameFromUrl(url)}
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
          draggable={false}
        />
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

/** Hook: clickable thumbnails that open in the lightbox. */
export function useLightbox(images: string[]) {
  const [open, setOpen] = useState<number | null>(null);
  const viewer =
    open !== null && images.length > 0 ? (
      <ImageLightbox images={images} index={Math.min(open, images.length - 1)} onClose={() => setOpen(null)} onIndexChange={setOpen} />
    ) : null;
  return { openAt: (url: string) => setOpen(Math.max(0, images.indexOf(url))), viewer };
}
