'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/useInView';

/** Number that counts up from its previous value when it changes. */
export function CountUp({ value, duration = 800 }: { value: number; duration?: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const start = from.current;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, t - t0) / duration);
      const v = Math.round(start + (value - start) * (1 - Math.pow(1 - p, 3)));
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  return <span className="tabular-nums">{reduced ? value : shown}</span>;
}

/** Shimmering placeholder block. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/** Style for staggered fade-up entrances: <div className="animate-fade-up" style={stagger(i)}> */
export function stagger(index: number, step = 70, base = 0): React.CSSProperties {
  return { animationDelay: `${base + index * step}ms` };
}
