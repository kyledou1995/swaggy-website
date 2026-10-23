import type { Metadata } from 'next';
import { Globe2, Rocket, Users } from 'lucide-react';
import PageShell from '@/components/landing/PageShell';

export const metadata: Metadata = {
  title: 'Careers — Merchin',
  description: 'Help ecommerce brands get great products made. Join the Merchin team.',
};

const perks = [
  {
    icon: Rocket,
    title: 'Early-stage impact',
    body: "We're a small team. The work you do directly shapes how brands get their products made.",
  },
  {
    icon: Globe2,
    title: 'Global by default',
    body: 'Our work spans product design, overseas manufacturing, and international logistics.',
  },
  {
    icon: Users,
    title: 'Customer-obsessed',
    body: 'We measure success by whether our customers hit their launch dates with products they love.',
  },
];

export default function CareersPage() {
  return (
    <PageShell
      eyebrow="Careers"
      title="Build the supply chain brands wish they had"
      subtitle="We're looking for operators, sourcing specialists, and builders who like solving real-world problems."
    >
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {perks.map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                <Icon className="text-emerald-600" size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Open positions</h2>
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-900 font-medium mb-2">No open roles right now.</p>
          <p className="text-gray-600 mb-6">
            We're always happy to hear from great people in sourcing, product development, logistics,
            and engineering. Send us a note and your resume or LinkedIn.
          </p>
          <a
            href="mailto:careers@merchin.co?subject=Introduction"
            className="inline-block px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Introduce Yourself
          </a>
        </div>
      </section>
    </PageShell>
  );
}
