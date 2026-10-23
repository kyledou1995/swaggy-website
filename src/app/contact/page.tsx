import type { Metadata } from 'next';
import { Briefcase, LifeBuoy, Mail, ShieldCheck } from 'lucide-react';
import PageShell from '@/components/landing/PageShell';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact — Merchin',
  description: 'Get in touch with the Merchin team about sourcing, quotes, or your existing orders.',
};

const channels = [
  { icon: Mail, title: 'Sales & new projects', email: 'hello@merchin.co', note: 'Quotes, pricing, and new product ideas' },
  { icon: LifeBuoy, title: 'Customer support', email: 'support@merchin.co', note: 'Help with an existing order or your account' },
  { icon: Briefcase, title: 'Careers', email: 'careers@merchin.co', note: 'Introduce yourself to the team' },
  { icon: ShieldCheck, title: 'Security', email: 'security@merchin.co', note: 'Report a vulnerability' },
];

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Let's talk"
      subtitle="Have a product in mind or a question about an order? We usually reply within one business day."
    >
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {channels.map(({ icon: Icon, title, email, note }) => (
            <a
              key={email}
              href={`mailto:${email}`}
              className="flex gap-4 p-5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 shrink-0 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Icon className="text-emerald-600" size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-emerald-600">{email}</p>
                <p className="text-sm text-gray-500 mt-1">{note}</p>
              </div>
            </a>
          ))}
          <p className="text-sm text-gray-500 pt-2">
            Already a customer? The fastest way to reach us about an order is the message thread on
            that order in your portal.
          </p>
        </div>
        <div className="lg:col-span-3">
          <ContactForm />
        </div>
      </section>
    </PageShell>
  );
}
