'use client';

import { useEffect, useRef, useState } from 'react';
import { Plane, Ship } from 'lucide-react';
import { useReducedMotion } from '@/lib/useInView';

interface ShipmentTrackerProps {
  method: 'air' | 'ocean' | null | undefined;
  /** When the order went in transit (ISO). */
  departedAt?: string | null;
  /** Expected transit time in days, from the accepted quote. */
  transitDays?: number | null;
  destination?: string;
}

const ROUTE = 'M60 90 C 300 10, 700 10, 940 90';
const DAY = 24 * 60 * 60 * 1000;

const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Compact animated route for in-transit orders, driven by real dates where available. */
export function ShipmentTracker({ method, departedAt, transitDays, destination = 'Your delivery address' }: ShipmentTrackerProps) {
  const reduced = useReducedMotion();
  const routeRef = useRef<SVGPathElement>(null);
  const doneRef = useRef<SVGPathElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const [now] = useState(() => Date.now());

  const start = departedAt ? new Date(departedAt) : null;
  const eta = start && transitDays ? new Date(start.getTime() + transitDays * DAY) : null;
  const elapsedDays = start ? Math.max(0, Math.floor((now - start.getTime()) / DAY)) : null;
  // Progress along the route; cap at 95% until it's actually marked delivered.
  const target =
    start && transitDays ? Math.min(0.95, Math.max(0.05, (now - start.getTime()) / (transitDays * DAY))) : 0.5;

  useEffect(() => {
    const route = routeRef.current;
    const done = doneRef.current;
    const icon = iconRef.current;
    if (!route || !done || !icon) return;
    const L = route.getTotalLength();
    done.style.strokeDasharray = `${L}`;
    const place = (p: number) => {
      const pt = route.getPointAtLength(L * p);
      icon.style.left = `${pt.x / 10}%`;
      icon.style.top = `${(pt.y / 130) * 100}%`;
      done.style.strokeDashoffset = `${L * (1 - p)}`;
    };
    if (reduced) {
      place(target);
      return;
    }
    place(0);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, t - t0) / 2000);
      place(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);

  const Icon = method === 'air' ? Plane : Ship;
  const label = method === 'air' ? 'DDP Air' : method === 'ocean' ? 'DDP Ocean' : 'In transit';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900">On the way · {label}</p>
        {elapsedDays !== null && transitDays ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
            Day {Math.min(elapsedDays + 1, transitDays)} of ~{transitDays}
          </span>
        ) : null}
      </div>
      <div className="relative h-[120px] sm:h-[130px]">
        <svg viewBox="0 0 1000 130" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
          <path ref={routeRef} d={ROUTE} fill="none" stroke="#e5e5e5" strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path ref={doneRef} d={ROUTE} fill="none" stroke="#10b981" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center w-24" style={{ left: '6%', top: '84%' }}>
          <span className="block w-3 h-3 mx-auto mb-1.5 rounded-full bg-emerald-500 border-[3px] border-emerald-500" />
          <p className="text-[11px] font-semibold text-gray-900">Departed</p>
          {start && <p className="text-[11px] text-gray-500">{fmt(start)}</p>}
        </div>
        <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center w-28" style={{ left: '94%', top: '84%' }}>
          <span className="block w-3 h-3 mx-auto mb-1.5 rounded-full bg-white border-[3px] border-gray-300" />
          <p className="text-[11px] font-semibold text-gray-900 truncate">{destination}</p>
          {eta && <p className="text-[11px] text-gray-500">ETA {fmt(eta)}</p>}
        </div>
        <div
          ref={iconRef}
          className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shadow-[0_6px_18px_rgba(16,185,129,0.3)] animate-merchin-float"
          style={{ left: '6%', top: '69%' }}
          aria-hidden="true"
        >
          <Icon className="w-4 h-4 text-emerald-600" strokeWidth={2} />
        </div>
      </div>
      {eta && (
        <p className="sr-only">
          Shipped {start ? fmt(start) : ''}, estimated arrival {fmt(eta)}.
        </p>
      )}
    </div>
  );
}
