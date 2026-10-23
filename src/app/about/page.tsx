import type { Metadata } from 'next';
import { Eye, Handshake, ShieldCheck, Zap } from 'lucide-react';
import PageShell, { CTABanner } from '@/components/landing/PageShell';

export const metadata: Metadata = {
  title: 'About Us — Merchin',
  description: 'Merchin is the sourcing team ecommerce brands plug in instead of building their own.',
};

const values = [
  {
    icon: Eye,
    title: 'Radical transparency',
    body: 'You see every quote, sample, inspection, and shipment in one portal. No black boxes, no chasing suppliers on WhatsApp.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality before speed',
    body: 'Nothing goes to full production until you approve the sample, and nothing ships until it passes inspection.',
  },
  {
    icon: Handshake,
    title: 'One accountable partner',
    body: 'One team owns your order from first sketch to final delivery. If something goes wrong, you know exactly who fixes it.',
  },
  {
    icon: Zap,
    title: 'Built for founders',
    body: 'Clear pricing, landed costs quoted up front, and a process designed for brands without a dedicated ops team.',
  },
];

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About Us"
      title="The sourcing team you don't have to hire"
      subtitle="Merchin handles product sourcing, design, quality control, and shipping so ecommerce brands can spend their time selling."
    >
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 text-lg text-gray-700 leading-relaxed">
        <h2 className="text-2xl font-bold text-gray-900">Why we started Merchin</h2>
        <p>
          Getting a product made overseas usually means juggling a dozen factory contacts, decoding
          quotes that leave out shipping and duties, and hoping the bulk order looks like the
          sample. Most growing brands don't have the time or the team to manage all of that, and
          the cost of getting it wrong is a warehouse full of inventory you can't sell.
        </p>
        <p>
          We built Merchin to be the operations team those brands are missing. You tell us what
          you want to make. We find and vet the manufacturers, develop samples, manage production,
          inspect every batch, and deliver duty-paid to your door, with every step tracked in one
          portal.
        </p>
        <p>
          Our team works across product development, factory relationships, and international
          logistics, so you get a single partner instead of a patchwork of agents, freight
          forwarders, and customs brokers.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">What we believe</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {values.map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-6 rounded-xl border border-gray-200 bg-white">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                <Icon className="text-emerald-600" size={22} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <CTABanner />
    </PageShell>
  );
}
