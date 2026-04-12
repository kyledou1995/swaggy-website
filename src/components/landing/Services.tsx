'use client';

import { Zap, Palette, Shield, MapPin } from 'lucide-react';

export default function Services() {
  const services = [
    {
      title: 'Product Sourcing',
      description:
        'We find the best manufacturers for ODM and OEM production. No guesswork.',
      icon: Zap,
    },
    {
      title: 'Product Design',
      description:
        'From concept to samples. We bring your brand vision to life with expert design.',
      icon: Palette,
    },
    {
      title: 'Quality Control',
      description:
        'Every batch inspected and tested. We guarantee quality before it ships.',
      icon: Shield,
    },
    {
      title: 'Logistics & Shipping',
      description:
        'Door-to-door delivery. We handle all warehousing, fulfillment, and customs.',
      icon: MapPin,
    },
  ];

  return (
    <section
      id="services"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Services
          </h2>
          <p className="text-lg text-gray-600">
            End-to-end supply chain solutions tailored for your brand.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="bg-white p-8 rounded-lg border border-gray-200 hover:border-emerald-200 hover:shadow-sm transition-all duration-300 group"
              >
                {/* Icon */}
                <div className="mb-4 inline-block p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  <Icon className="text-emerald-600" size={24} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
