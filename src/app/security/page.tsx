import type { Metadata } from 'next';
import { CreditCard, Database, KeyRound, Lock, Server, UserCheck } from 'lucide-react';
import PageShell from '@/components/landing/PageShell';

export const metadata: Metadata = {
  title: 'Security — Merchin',
  description: 'How Merchin protects your account, your designs, and your payments.',
};

const pillars = [
  {
    icon: Lock,
    title: 'Encrypted everywhere',
    body: 'All traffic to merchin.co is served over HTTPS (TLS). Data stored in our database and file storage is encrypted at rest by our infrastructure providers.',
  },
  {
    icon: Database,
    title: 'Strict data isolation',
    body: 'Row-level security policies are enforced inside the database on every table. Your organization can only ever read its own orders, files, and messages.',
  },
  {
    icon: CreditCard,
    title: 'We never touch card numbers',
    body: 'Payments are processed by Stripe, a PCI DSS Level 1 certified provider. Card and bank details go directly to Stripe and are never stored on Merchin servers.',
  },
  {
    icon: KeyRound,
    title: 'Secure authentication',
    body: 'Passwords are hashed and never stored in plain text. Accounts require email verification, and password resets use single-use, time-limited links.',
  },
  {
    icon: UserCheck,
    title: 'Role-based access',
    body: 'Owners control who joins their organization and whether each person is an owner, manager, or read-only viewer.',
  },
  {
    icon: Server,
    title: 'Trusted infrastructure',
    body: 'Merchin runs on Vercel and Supabase, providers that maintain independent security certifications and operate on major cloud platforms.',
  },
];

export default function SecurityPage() {
  return (
    <PageShell
      eyebrow="Security"
      title="Your designs and data, protected"
      subtitle="Unreleased products and supplier pricing are sensitive. Here's how we keep them safe."
    >
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map(({ icon: Icon, title, body }) => (
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

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 space-y-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Protecting your intellectual property</h2>
          <p className="text-gray-700 leading-relaxed">
            Your logos, artwork, and product designs are only shared with the manufacturers working on
            your order, and only to the extent needed to produce it. We never reuse your designs for
            other customers. If you need a signed NDA before sharing a new product, just ask.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Reporting a vulnerability</h2>
          <p className="text-gray-700 leading-relaxed">
            If you believe you've found a security issue in Merchin, please email{' '}
            <a href="mailto:security@merchin.co" className="text-emerald-600 font-medium hover:text-emerald-700">
              security@merchin.co
            </a>{' '}
            with details and steps to reproduce. We'll acknowledge your report promptly and keep you
            updated while we investigate. Please don't access other customers' data or disrupt the
            service while testing.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
