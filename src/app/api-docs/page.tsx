import type { Metadata } from 'next';
import { Code2, RefreshCw, ShoppingBag, Webhook } from 'lucide-react';
import PageShell from '@/components/landing/PageShell';

export const metadata: Metadata = {
  title: 'API Docs — Merchin',
  description: 'The Merchin API is in early access. Request access to integrate orders, tracking, and webhooks.',
};

const planned = [
  {
    icon: ShoppingBag,
    title: 'Orders',
    body: 'Create order requests, attach specifications and artwork, and list orders across your organization.',
  },
  {
    icon: RefreshCw,
    title: 'Status & tracking',
    body: 'Read the full status history, quotes, and shipment tracking for any order.',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    body: 'Get notified when an order changes status, a quote is ready, or a shipment is delivered.',
  },
];

const sample = `GET /v1/orders/MRC-1042
Authorization: Bearer mk_live_...

{
  "order_number": "MRC-1042",
  "status": "in_transit",
  "product_type": "Apparel",
  "quantity": 1200,
  "shipping": "ocean",
  "updated_at": "2026-10-20T14:32:00Z"
}`;

export default function ApiDocsPage() {
  return (
    <PageShell
      eyebrow="Developers"
      title="Merchin API"
      subtitle="Connect your store, ERP, or internal tools to your Merchin orders. The API is currently in early access."
    >
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-12 text-sm text-amber-900">
          <strong>Early access:</strong> the public API isn't generally available yet. Endpoints below
          are a preview and may change. Enterprise customers can request access today.
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {planned.map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                <Icon className="text-emerald-600" size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Code2 size={20} className="text-emerald-600" /> Preview request
        </h2>
        <pre className="rounded-xl bg-gray-900 text-gray-100 text-sm p-6 overflow-x-auto mb-12">
          <code>{sample}</code>
        </pre>

        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request API access</h2>
          <p className="text-gray-600 mb-6">
            Tell us what you'd like to integrate and we'll reach out with credentials and documentation.
          </p>
          <a
            href="mailto:hello@merchin.co?subject=API%20access%20request"
            className="inline-block px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Request Access
          </a>
        </div>
      </section>
    </PageShell>
  );
}
