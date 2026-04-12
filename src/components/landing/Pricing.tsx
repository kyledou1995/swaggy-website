'use client';

import { Check } from 'lucide-react';

export default function Pricing() {
  const tiers = [
    {
      name: 'Starter',
      range: '1–500 units',
      description: 'Perfect for testing new products',
      features: [
        'Product sourcing & samples',
        'Basic design consultation',
        'Quality inspection',
        'Standard shipping',
        'Email support',
      ],
      cta: 'Get Quote',
    },
    {
      name: 'Growth',
      range: '500–5,000 units',
      description: 'Ideal for scaling brands',
      features: [
        'Everything in Starter',
        'Advanced design services',
        'Expedited production',
        'Priority quality checks',
        'Custom packaging',
        'Dedicated account manager',
        'Phone & email support',
      ],
      cta: 'Get Quote',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      range: '5,000+ units',
      description: 'For large-scale operations',
      features: [
        'Everything in Growth',
        'Custom logistics solutions',
        'Bulk pricing advantages',
        '24/7 support',
        'Multi-SKU management',
        'Strategic supply planning',
        'Custom integrations',
      ],
      cta: 'Contact Sales',
    },
  ];

  return (
    <section
      id="pricing"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Custom quotes based on your order size and requirements.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`rounded-xl border transition-all duration-300 ${
                tier.highlighted
                  ? 'border-emerald-500 bg-white shadow-lg scale-105 md:scale-110'
                  : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-sm'
              }`}
            >
              {/* Badge for highlighted tier */}
              {tier.highlighted && (
                <div className="px-6 py-3 border-b border-gray-100 bg-emerald-50">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    Most Popular
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="p-8">
                {/* Tier Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {tier.name}
                </h3>

                {/* Range */}
                <p className="text-lg font-semibold text-emerald-600 mb-3">
                  {tier.range}
                </p>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-6">
                  {tier.description}
                </p>

                {/* CTA Button */}
                <button
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors mb-8 ${
                    tier.highlighted
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'border-2 border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tier.cta}
                </button>

                {/* Features List */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                    Includes
                  </p>
                  {tier.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <Check size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            All tiers include production consultation. Let's talk about your specific needs.{' '}
            <a href="mailto:hello@swaggy.co" className="text-emerald-600 font-medium hover:text-emerald-700">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
