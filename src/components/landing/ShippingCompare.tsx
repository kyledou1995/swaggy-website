'use client';

import { useEffect, useRef, useState } from 'react';
import { Plane, Ship } from 'lucide-react';
import { useReducedMotion } from '@/lib/useInView';

type Mode = 'air' | 'ocean';
// Illustrative example for 1,000 units — not a live quote.
const DATA: Record<Mode, { production: number; transit: number; unit: number }> = {
  air: { production: 25, transit: 7, unit: 8.4 },
  ocean: { production: 25, transit: 35, unit: 5.75 },
};
const QTY = 1000;

function Bar({ label, value, max, display }: { label: string; value: number; max: number; display: string }) {
  return (
    <div className="grid grid-cols-[100px_1fr_84px] sm:grid-cols-[130px_1fr_90px] gap-3.5 items-center text-sm my-3.5">
      <span className="text-gray-700">{label}</span>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-[width] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="text-right font-semibold text-gray-900 tabular-nums">{display}</span>
    </div>
  );
}

export default function ShippingCompare() {
  const [mode, setMode] = useState<Mode>('air');
  const [animatedUnit, setUnit] = useState(DATA.air.unit);
  const unitRef = useRef(animatedUnit);
  const reduced = useReducedMotion();
  const unit = reduced ? DATA[mode].unit : animatedUnit;

  // Animate the price between modes
  useEffect(() => {
    const from = unitRef.current;
    const to = DATA[mode].unit;
    if (reduced) {
      unitRef.current = to;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 600);
      const v = from + (to - from) * (1 - Math.pow(1 - p, 3));
      unitRef.current = v;
      setUnit(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, reduced]);

  const d = DATA[mode];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">Air or ocean? You choose.</h2>
        <p className="text-lg text-gray-600">
          Every quote shows both options with landed cost, so you can trade speed for savings.
        </p>

        <div role="tablist" aria-label="Shipping method" className="relative inline-flex bg-white border border-gray-200 rounded-xl p-1 mt-8 mb-7">
          <span
            className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-gray-900 rounded-lg transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ transform: mode === 'air' ? 'none' : 'translateX(100%)' }}
          />
          {(['air', 'ocean'] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`relative z-10 flex items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-colors ${
                mode === m ? 'text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {m === 'air' ? <Plane size={16} /> : <Ship size={16} />}
              DDP {m === 'air' ? 'Air' : 'Ocean'}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 text-left">
          <Bar label="Production" value={d.production} max={60} display={`${d.production} days`} />
          <Bar label="Transit" value={d.transit} max={60} display={`${d.transit} days`} />
          <Bar label="Unit cost" value={unit} max={10} display={`$${unit.toFixed(2)}`} />
          <div className="flex justify-between items-baseline border-t border-gray-100 mt-5 pt-5">
            <span className="text-sm text-gray-500">{QTY.toLocaleString()} units · landed, duties included</span>
            <span className="text-3xl font-extrabold tracking-tight text-gray-900 tabular-nums">
              ${Math.round(unit * QTY).toLocaleString()}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">Example only. Actual pricing and timelines depend on your product and quantity.</p>
      </div>
    </section>
  );
}
