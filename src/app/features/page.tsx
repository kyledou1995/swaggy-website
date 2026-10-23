import type { Metadata } from 'next';
import {
  BadgeCheck,
  Bell,
  ClipboardList,
  CreditCard,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Package,
  Plane,
  Ship,
  Truck,
  Users,
} from 'lucide-react';
import PageShell, { CTABanner } from '@/components/landing/PageShell';

export const metadata: Metadata = {
  title: 'Features — Merchin',
  description: 'Everything in the Merchin portal: guided ordering, quotes, samples, payments, tracking, and team access.',
};

const features = [
  {
    icon: ClipboardList,
    title: 'Guided order builder',
    body: 'A step-by-step form captures product type, quantity, materials, colors, logo placement, packaging, and target price, so nothing gets lost in an email thread.',
  },
  {
    icon: ImageIcon,
    title: 'Inspiration & artwork uploads',
    body: 'Attach reference images, logo files, and packaging dielines directly to your order. Our team works from the exact files you send.',
  },
  {
    icon: Package,
    title: 'Ready-made product catalog',
    body: 'Start from pre-configured products with sizes and pricing already set, or request something fully custom.',
  },
  {
    icon: Plane,
    title: 'Air and ocean quotes, side by side',
    body: 'Every quote shows per-unit pricing, production time, and transit time for both DDP air and DDP ocean freight, so you can trade speed for cost.',
  },
  {
    icon: CreditCard,
    title: 'Secure online payments',
    body: 'Pay deposits and sample fees by card or US bank transfer through Stripe. Invoices are generated automatically for your records.',
  },
  {
    icon: BadgeCheck,
    title: 'Sample review & approval',
    body: 'Review sample photos or request physical samples, then approve or request changes before full production begins.',
  },
  {
    icon: LayoutDashboard,
    title: 'Real-time order tracking',
    body: 'Follow each order through sourcing, sampling, manufacturing, quality check, packing, and transit with a full status history.',
  },
  {
    icon: MessageSquare,
    title: 'Per-order messaging',
    body: 'Every order has its own conversation thread with our team, with file attachments, so context always stays with the order.',
  },
  {
    icon: Bell,
    title: 'Notifications you control',
    body: 'Get in-app and email alerts for status changes and new messages, and choose exactly which ones each team member receives.',
  },
  {
    icon: Users,
    title: 'Team accounts & roles',
    body: 'Invite teammates as owners, managers, or viewers. Everyone in your organization sees the same orders without sharing a login.',
  },
  {
    icon: Truck,
    title: 'Multiple delivery addresses',
    body: 'Save warehouse, 3PL, and office addresses at the organization level and choose where each shipment goes.',
  },
  {
    icon: FileText,
    title: 'Invoices on demand',
    body: 'Download deposit, balance, and full-order invoices at any time with order, shipping, and payment details included.',
  },
];

export default function FeaturesPage() {
  return (
    <PageShell
      eyebrow="Platform"
      title="One portal for every order"
      subtitle="From the first request to final delivery, everything about your production lives in one place."
    >
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="p-6 rounded-xl border border-gray-200 bg-white hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                <Icon className="text-emerald-600" size={22} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="rounded-2xl border border-gray-200 p-8 sm:p-10 grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Landed cost, not surprise fees</h2>
            <p className="text-gray-600">
              Quotes are DDP (Delivered Duty Paid): production, freight, customs clearance, and
              duties are included in the per-unit price. What you approve is what you pay.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-emerald-50 p-5 text-center">
              <Plane className="mx-auto text-emerald-600 mb-2" size={28} />
              <p className="font-semibold text-gray-900">DDP Air</p>
              <p className="text-xs text-gray-600 mt-1">Fastest delivery</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-5 text-center">
              <Ship className="mx-auto text-emerald-600 mb-2" size={28} />
              <p className="font-semibold text-gray-900">DDP Ocean</p>
              <p className="text-xs text-gray-600 mt-1">Lowest unit cost</p>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </PageShell>
  );
}
