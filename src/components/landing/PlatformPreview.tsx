'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useReducedMotion } from '@/lib/useInView';

const STAGES = [
  { pill: 'Sourcing', width: 8 },
  { pill: 'Quote ready', width: 24 },
  { pill: 'Sample approved', width: 45 },
  { pill: 'In production', width: 66 },
  { pill: 'Shipped', width: 85 },
  { pill: 'Delivered', width: 100 },
];
const LABELS = ['Sourcing', 'Quote', 'Sample', 'Production', 'Shipped', 'Delivered'];

function Toast({ show, children, className }: { show: boolean; children: React.ReactNode; className: string }) {
  return (
    <div
      className={`absolute right-0 sm:-right-5 z-10 flex items-center gap-2.5 bg-gray-900 text-white text-sm px-3.5 py-2.5 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
        show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2.5 scale-95'
      } ${className}`}
    >
      <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
        <Check size={12} strokeWidth={3} />
      </span>
      {children}
    </div>
  );
}

export default function PlatformPreview() {
  const [step, setStep] = useState(0);
  const reduced = useReducedMotion();
  const i = reduced ? STAGES.length - 1 : step;

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setStep((v) => (v + 1) % STAGES.length), 1800);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <section id="platform" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Your command center</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-5 leading-[1.1]">
            Watch your order move. In real time.
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            Every quote, sample, inspection, and shipment shows up in your portal the moment it happens. No chasing
            suppliers on WhatsApp.
          </p>
          <Link
            href="/features"
            className="inline-block px-6 py-3 border-2 border-gray-300 text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            See all features
          </Link>
        </div>

        <div className="relative h-[400px]" aria-hidden="true">
          <Toast show={i === 2 || i === 3} className="top-0">
            Sample approved by your team
          </Toast>

          <div className="absolute inset-x-0 top-12 bg-white border border-gray-200 rounded-2xl p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.18)] animate-merchin-float">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900">Order #MRC-1042</p>
                <p className="text-xs text-gray-500 mt-0.5">Custom tote bags · 1,000 units</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 whitespace-nowrap">
                {STAGES[i].pill}
              </span>
            </div>

            <div className="h-2 bg-gray-100 rounded-full mt-5 mb-3.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-[width] duration-1000 ease-[cubic-bezier(.2,.8,.2,1)]"
                style={{ width: `${STAGES[i].width}%` }}
              />
            </div>
            <div className="grid grid-cols-6 gap-1 text-[10.5px]">
              {LABELS.map((l, k) => (
                <span key={l} className={`transition-colors ${k <= i ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  {l}
                </span>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-semibold text-gray-900">DDP Ocean</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Landed cost</span><span className="font-semibold text-gray-900">$5.75 / unit</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ETA</span><span className="font-semibold text-gray-900">Jun 15</span></div>
            </div>
          </div>

          <Toast show={i === 4 || i === 5} className="bottom-2">
            Passed quality inspection · 0 defects
          </Toast>
        </div>
      </div>
    </section>
  );
}
