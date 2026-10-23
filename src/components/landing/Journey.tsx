'use client';

import { useEffect, useRef, useState } from 'react';
import { Factory, BadgeCheck, ShieldCheck, Ship, Home } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/useInView';

const ROUTE = 'M80 215 C 185 215, 185 85, 290 85 S 395 215, 500 215 S 605 85, 710 85 S 815 215, 920 215';
const STOPS = [
  { x: 80, y: 215, icon: Factory, label: 'Sourcing', sub: 'Vetted factory', status: 'Sourcing suppliers' },
  { x: 290, y: 85, icon: BadgeCheck, label: 'Sampling', sub: 'You approve', status: 'Sample approved' },
  { x: 500, y: 215, icon: ShieldCheck, label: 'Quality check', sub: 'Every batch', status: 'Passed inspection' },
  { x: 710, y: 85, icon: Ship, label: 'Freight', sub: 'Air or ocean', status: 'In transit · DDP Ocean' },
  { x: 920, y: 215, icon: Home, label: 'Delivered', sub: 'Duties paid', status: 'Delivered to your warehouse' },
];
const DURATION = 9000;
const PAUSE = 1600;

export default function Journey() {
  const routeRef = useRef<SVGPathElement>(null);
  const doneRef = useRef<SVGPathElement>(null);
  const pkgRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const route = routeRef.current;
    const done = doneRef.current;
    const pkg = pkgRef.current;
    if (!route || !done || !pkg) return;

    const L = route.getTotalLength();
    // Where along the path each stop sits (0–1)
    const fractions = STOPS.map(({ x }) => {
      let best = 0;
      let bestDist = Infinity;
      for (let l = 0; l <= L; l += 2) {
        const d = Math.abs(route.getPointAtLength(l).x - x);
        if (d < bestDist) {
          bestDist = d;
          best = l;
        }
      }
      return best / L;
    });
    done.style.strokeDasharray = `${L}`;

    const place = (p: number) => {
      const pt = route.getPointAtLength(L * p);
      pkg.style.left = `${pt.x / 10}%`;
      pkg.style.top = `${pt.y / 3}%`;
      done.style.strokeDashoffset = `${L * (1 - p)}`;
      let last = 0;
      fractions.forEach((f, i) => {
        if (p >= f - 0.001) last = i;
      });
      setActive(last);
    };

    if (prefersReducedMotion()) {
      place(1);
      return;
    }

    let raf = 0;
    let visible = true;
    const t0 = performance.now();
    const obs = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    obs.observe(route);
    const frame = (t: number) => {
      if (visible) place(Math.min(1, ((t - t0) % (DURATION + PAUSE)) / DURATION));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, []);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            From factory floor to your front door
          </h2>
          <p className="text-lg text-gray-600">One partner for every step. You watch it happen.</p>
        </div>

        <div className="relative h-[300px] sm:h-[320px] mt-20 sm:mt-14 mx-5 sm:mx-0">
          {/* Live status card */}
          <div className="absolute -top-16 sm:-top-8 left-0 right-0 sm:left-auto sm:min-w-[260px] flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-merchin-ping shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-gray-900">{STOPS[active].status}</p>
              <p className="text-xs text-gray-500">Order MRC-1042 · Custom tote bags</p>
            </div>
          </div>

          <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
            <path ref={routeRef} d={ROUTE} fill="none" stroke="#e5e5e5" strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path ref={doneRef} d={ROUTE} fill="none" stroke="#10b981" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {STOPS.map((stop, i) => {
            const Icon = stop.icon;
            const lit = i <= active;
            return (
              <div
                key={stop.label}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-center w-[92px] sm:w-[130px]"
                style={{ left: `${stop.x / 10}%`, top: `${stop.y / 3}%` }}
              >
                <div
                  className={`mx-auto w-10 h-10 sm:w-[52px] sm:h-[52px] rounded-[11px] sm:rounded-[14px] border-2 flex items-center justify-center transition-all duration-300 ${
                    lit ? 'bg-emerald-50 border-emerald-500 scale-105 shadow-[0_8px_24px_rgba(16,185,129,0.25)]' : 'bg-white border-gray-200'
                  }`}
                >
                  <Icon className={`w-[19px] h-[19px] sm:w-6 sm:h-6 transition-colors ${lit ? 'text-emerald-600' : 'text-gray-400'}`} strokeWidth={1.8} />
                </div>
                <p className="text-[11.5px] sm:text-[13px] font-semibold text-gray-900 mt-1.5 sm:mt-2.5">{stop.label}</p>
                <p className="hidden sm:block text-[11.5px] text-gray-500">{stop.sub}</p>
              </div>
            );
          })}

          {/* Package */}
          <div
            ref={pkgRef}
            className="absolute w-[18px] h-[18px] -ml-[9px] -mt-[9px] rounded-[5px] bg-emerald-500 shadow-[0_0_0_7px_rgba(16,185,129,0.18)] z-20 pointer-events-none"
            style={{ left: '8%', top: '71.7%' }}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
