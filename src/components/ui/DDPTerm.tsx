'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * "DDP" with an explanation of the Incoterm on hover (desktop), tap (mobile), or keyboard focus.
 */
export function DDPTerm({ children = 'DDP' }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close the tapped-open tooltip when tapping elsewhere
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block group align-baseline">
      <button
        type="button"
        aria-describedby="ddp-tooltip"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="underline decoration-dotted decoration-gray-400 underline-offset-2 cursor-help"
      >
        {children}
      </button>
      {open && (
        <span
          id="ddp-tooltip"
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-72 max-w-[80vw] rounded-lg bg-gray-900 px-3.5 py-3 text-left text-xs font-normal normal-case tracking-normal leading-relaxed text-gray-100 shadow-xl animate-fade-in"
        >
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900" />
          <span className="block font-semibold text-white mb-1">DDP — Delivered Duty Paid</span>
          An Incoterm meaning the price includes everything needed to get your goods to your door: production,
          export, international freight, insurance, customs clearance, and import duties &amp; taxes. No surprise fees
          on arrival — you just receive your order.
        </span>
      )}
    </span>
  );
}
