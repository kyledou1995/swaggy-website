'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useInView, useReducedMotion } from '@/lib/useInView';

const WORDS = ['Sourced', 'Designed', 'Inspected', 'Delivered'];

const STATS = [
  { to: 50, suffix: '+', label: 'Brands trusting us' },
  { to: 10, suffix: 'M+', label: 'Units shipped' },
  { to: 98, suffix: '%', label: 'Quality approval' },
];

function CountUp({ to, suffix, start }: { to: number; suffix: string; start: boolean }) {
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!start || reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, t - t0) / 1400);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, to, reduced]);
  return (
    <>
      {reduced && start ? to : value}
      {suffix}
    </>
  );
}

export default function Hero() {
  const [index, setIndex] = useState(0);
  const { ref: statsRef, inView } = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-merchin-ping" />
          <span className="text-sm font-medium text-emerald-700">Trusted by 50+ ecommerce brands</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.05]">
          Your products.
          <br />
          <span className="sr-only">Sourced, designed, inspected, and delivered.</span>
          <span aria-hidden="true" className="relative inline-block h-[1.1em] min-w-[5.6em] overflow-hidden align-bottom">
            {WORDS.map((word, i) => {
              const state = i === index ? 'on' : i === (index - 1 + WORDS.length) % WORDS.length ? 'off' : 'wait';
              return (
                <span
                  key={word}
                  className={`absolute inset-x-0 top-0 text-center transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
                    state === 'on'
                      ? 'translate-y-0 opacity-100'
                      : state === 'off'
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-full opacity-0'
                  }`}
                >
                  {word}
                  <span className="text-emerald-500">.</span>
                </span>
              );
            })}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-600 mb-12 leading-relaxed">
          Stop managing supply chains. We handle sourcing, design, quality checks, and shipping so you can focus on selling.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Start Your Order
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-3 border-2 border-gray-300 text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            See How It Works
          </Link>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-gray-900 mb-2 tabular-nums">
                <CountUp to={s.to} suffix={s.suffix} start={inView} />
              </div>
              <p className="text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
