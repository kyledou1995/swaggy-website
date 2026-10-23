'use client';

import { ClipboardList, Lightbulb, CheckSquare, Truck } from 'lucide-react';
import { useInView } from '@/lib/useInView';

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Tell Us What You Need',
      description: 'Submit your order requirements: quantity, style, materials, and timeline.',
      icon: ClipboardList,
    },
    {
      number: 2,
      title: 'We Source & Design',
      description: 'We find the best suppliers and create samples tailored to your brand.',
      icon: Lightbulb,
    },
    {
      number: 3,
      title: 'Review & Approve',
      description: 'You approve samples before we start full production. Quality guaranteed.',
      icon: CheckSquare,
    },
    {
      number: 4,
      title: 'We Handle the Rest',
      description: 'Manufacturing, quality control, and shipping to your door.',
      icon: Truck,
    },
  ];

  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600">Four simple steps. Zero headaches.</p>
        </div>

        {/* Steps Grid */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative">
          {/* Connecting line that draws in on scroll (desktop) */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-[3px] rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-[width] duration-[1800ms] ease-[cubic-bezier(.4,0,.2,1)]"
              style={{ width: inView ? '100%' : '0%' }}
            />
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className={`relative text-center transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: inView ? `${150 + index * 420}ms` : '0ms' }}
              >
                <div className="mb-6 flex justify-center">
                  <div
                    className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center border-[3px] transition-colors duration-500 ${
                      inView ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-gray-200'
                    }`}
                    style={{ transitionDelay: inView ? `${300 + index * 420}ms` : '0ms' }}
                  >
                    <Icon className="text-emerald-600" size={34} />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-[16rem] mx-auto">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
