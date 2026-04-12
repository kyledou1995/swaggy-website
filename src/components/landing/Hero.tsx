'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            Trusted by 50+ ecommerce brands
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Your products. Sourced, designed, and delivered.
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

        {/* Optional: Metrics or Social Proof */}
        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
            <p className="text-sm text-gray-600">Brands trusting us</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">10M+</div>
            <p className="text-sm text-gray-600">Units shipped</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-2">98%</div>
            <p className="text-sm text-gray-600">Quality approval</p>
          </div>
        </div>
      </div>
    </section>
  );
}
