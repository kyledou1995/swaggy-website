'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useReducedMotion } from '@/lib/useInView';

export interface CelebrationProps {
  open: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  /** Auto-dismiss after this many ms (0 = stay until closed). */
  autoCloseMs?: number;
}

const COLORS = ['#10B981', '#059669', '#6EE7B7', '#171717', '#A7F3D0'];

/** Animated check mark that draws itself, then bursts green confetti. Fires on mount. */
export function SuccessCheck() {
  const reduced = useReducedMotion();
  const burstRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => {
      const host = burstRef.current;
      if (!host) return;
      for (let i = 0; i < 28; i++) {
        const c = document.createElement('span');
        c.style.cssText = `position:absolute;left:50%;top:50%;width:8px;height:12px;border-radius:2px;background:${COLORS[i % COLORS.length]};pointer-events:none`;
        host.appendChild(c);
        const a = Math.random() * Math.PI * 2;
        const d = 70 + Math.random() * 90;
        const anim = c.animate(
          [
            { opacity: 1, transform: 'translate(-50%,-50%) rotate(0deg)' },
            {
              opacity: 0,
              transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 40}px)) rotate(${Math.random() * 540}deg)`,
            },
          ],
          { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }
        );
        anim.onfinish = () => c.remove();
      }
    }, 750);
    return () => clearTimeout(t);
  }, [reduced]);

  return (
    <div ref={burstRef} className="relative mx-auto w-[84px] h-[84px]">
      <svg viewBox="0 0 84 84" className="w-[84px] h-[84px]" style={reduced ? undefined : { animation: 'merchin-pop-in .4s .85s cubic-bezier(.2,1.6,.4,1) both' }}>
        <circle
          cx="42"
          cy="42"
          r="37"
          fill="#ECFDF5"
          stroke="#10B981"
          strokeWidth="5"
          strokeLinecap="round"
          transform="rotate(-90 42 42)"
          style={{ strokeDasharray: 240, strokeDashoffset: reduced ? 0 : 240, animation: reduced ? undefined : 'merchin-draw .6s cubic-bezier(.6,0,.2,1) forwards' }}
        />
        <path
          d="M27 43l10 10 20-22"
          fill="none"
          stroke="#10B981"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ strokeDasharray: 60, strokeDashoffset: reduced ? 0 : 60, animation: reduced ? undefined : 'merchin-draw .35s .55s ease-out forwards' }}
        />
      </svg>
    </div>
  );
}

/** Milestone overlay: a check mark draws itself, then green confetti bursts. */
export function Celebration({ open, title, message, onClose, autoCloseMs = 4500 }: CelebrationProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const t = autoCloseMs ? setTimeout(onClose, autoCloseMs) : undefined;
    return () => {
      window.removeEventListener('keydown', onKey);
      if (t) clearTimeout(t);
    };
  }, [open, onClose, autoCloseMs]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px] px-4 animate-[merchin-fade-up_.25s_ease-out_both]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl px-6 pt-10 pb-7 text-center animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
          <X className="w-4 h-4" />
        </button>
        <SuccessCheck />
        <h2 id="celebration-title" className="text-xl font-bold text-gray-900 mt-5 tracking-tight animate-fade-up" style={{ animationDelay: '0.7s' }}>
          {title}
        </h2>
        {message && (
          <p className="text-sm text-gray-600 mt-2 leading-relaxed animate-fade-up" style={{ animationDelay: '0.8s' }}>
            {message}
          </p>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors animate-fade-up"
          style={{ animationDelay: '0.9s' }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
