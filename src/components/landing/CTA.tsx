'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setEmail('');
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-2xl mx-auto text-center">
        {/* Headline */}
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Ready to streamline your supply chain?
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 mb-12">
          Join 50+ ecommerce brands that trust Swaggy for sourcing and fulfillment.
        </p>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            className="px-8 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            Get Started
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Success Message */}
        {isSubmitted && (
          <p className="text-sm text-emerald-600 font-medium">
            Check your inbox for next steps!
          </p>
        )}

        {/* Additional Info */}
        <p className="text-xs text-gray-600">
          No credit card required. Get a quote in 24 hours.
        </p>
      </div>
    </section>
  );
}
