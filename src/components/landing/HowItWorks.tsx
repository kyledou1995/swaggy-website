'use client';

import { ClipboardList, Lightbulb, CheckSquare, Truck } from 'lucide-react';

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

  return (
    <section
      id="how-it-works"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Four simple steps from idea to your inbox.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Line - visible on lg screens */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

          {/* Steps */}
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Circle Background */}
                <div className="mb-6 flex justify-center lg:justify-start">
                  <div className="relative w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                    <Icon className="text-emerald-600" size={40} />
                    {/* Step Number Badge */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
