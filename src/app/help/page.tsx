import type { Metadata } from 'next';
import { ChevronDown } from 'lucide-react';
import PageShell from '@/components/landing/PageShell';

export const metadata: Metadata = {
  title: 'Help Center — Merchin',
  description: 'Answers to common questions about ordering, quotes, samples, payments, and shipping with Merchin.',
};

const sections: { title: string; faqs: { q: string; a: React.ReactNode }[] }[] = [
  {
    title: 'Getting started',
    faqs: [
      {
        q: 'How do I place my first order?',
        a: 'Create a free account, then click "New Order" in your portal. The order form walks you through product type, quantity, materials, colors, logo placement, packaging, and timeline. You can attach inspiration images and logo files along the way. Once you submit, our team reviews the request and starts sourcing.',
      },
      {
        q: 'Is there a minimum order quantity?',
        a: 'Minimums depend on the product and manufacturing method. Many products can start in the low hundreds of units. Tell us your target quantity and we\'ll find suppliers that fit, or let you know what the realistic minimum is.',
      },
      {
        q: 'Can I invite my team?',
        a: 'Yes. Go to Team in your portal to invite colleagues as an Owner, Manager, or Viewer. Everyone in your organization sees the same orders and can be notified about updates.',
      },
    ],
  },
  {
    title: 'Quotes & pricing',
    faqs: [
      {
        q: 'How long does it take to get a quote?',
        a: 'Most quotes are ready within a few business days of submitting a complete order request. Highly custom products may take longer while we work with manufacturers on feasibility.',
      },
      {
        q: 'What does a quote include?',
        a: 'Each quote shows a per-unit price, production time, and shipping time for both DDP air and DDP ocean freight. DDP (Delivered Duty Paid) means the price includes production, freight, customs clearance, and import duties to your delivery address.',
      },
      {
        q: 'Should I choose air or ocean shipping?',
        a: 'Air freight is faster but costs more per unit. Ocean freight takes longer but is usually much cheaper, especially for heavier or larger orders. You choose when you accept the quote.',
      },
    ],
  },
  {
    title: 'Payments',
    faqs: [
      {
        q: 'When do I pay?',
        a: 'After you accept a quote, a 30% deposit is due to start production. The remaining balance is due once your order is manufactured, inspected, and packed, before it ships. If your order includes paid samples, the sample fee is collected before samples are produced.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept major credit and debit cards and US bank transfers (ACH), processed securely by Stripe. Merchin never stores your card or bank details.',
      },
      {
        q: 'Where can I find my invoices?',
        a: 'Open any order in your portal to download deposit, balance, or full-order invoices.',
      },
    ],
  },
  {
    title: 'Samples & production',
    faqs: [
      {
        q: 'Will I see a sample before full production?',
        a: 'Yes. We send sample photos for review, and you can request physical samples as well. Full production only starts after you approve the sample.',
      },
      {
        q: 'What if the sample isn\'t right?',
        a: 'Request changes directly on the order. We\'ll work with the manufacturer on a revised sample until it matches what you need.',
      },
      {
        q: 'How do you check quality?',
        a: 'Every order goes through a quality check after manufacturing and before packing. Issues are fixed with the factory before anything ships.',
      },
    ],
  },
  {
    title: 'Shipping & delivery',
    faqs: [
      {
        q: 'How do I track my order?',
        a: 'Your portal shows the live status of every order, from sourcing through delivery, along with a full history of updates. Tracking details are added once your shipment is in transit.',
      },
      {
        q: 'Can I ship to more than one address?',
        a: 'Yes. Save multiple delivery addresses (warehouses, 3PLs, offices) in your portal settings and choose where each order goes.',
      },
      {
        q: 'Do I have to deal with customs?',
        a: 'No. All shipments are DDP, so we handle customs clearance and import duties.',
      },
    ],
  },
  {
    title: 'Changes & cancellations',
    faqs: [
      {
        q: 'Can I cancel an order?',
        a: 'You can cancel from the order page. If no deposit has been paid, the order is simply cancelled. If a deposit has been paid, our team reviews the request; refunds depend on how far production has progressed and any costs already committed with the manufacturer.',
      },
      {
        q: 'Can I change my order after submitting it?',
        a: 'Message us on the order thread as early as possible. Changes before sampling are usually easy; changes after sample approval may affect price and timeline.',
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <PageShell
      eyebrow="Help Center"
      title="How can we help?"
      subtitle="Answers to the questions we hear most. Can't find what you need? We're one email away."
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap gap-2 mb-12 justify-center">
          {sections.map((s) => (
            <a
              key={s.title}
              href={`#${s.title.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
            >
              {s.title}
            </a>
          ))}
        </nav>

        {sections.map((section) => (
          <section
            key={section.title}
            id={section.title.toLowerCase().replace(/[^a-z]+/g, '-')}
            className="mb-12 scroll-mt-24"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {section.faqs.map((faq) => (
                <details key={faq.q} className="group py-4">
                  <summary className="flex justify-between items-center cursor-pointer list-none font-medium text-gray-900">
                    {faq.q}
                    <ChevronDown
                      size={18}
                      className="text-gray-400 shrink-0 ml-4 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 text-gray-600 leading-relaxed text-sm">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <div className="rounded-2xl bg-emerald-50 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h2>
          <p className="text-gray-600 mb-5">Our team usually replies within one business day.</p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </PageShell>
  );
}
