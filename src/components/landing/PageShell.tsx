import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

interface PageShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function PageShell({ eyebrow, title, subtitle, children }: PageShellProps) {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <header className="pt-32 pb-12 sm:pb-16 border-b border-gray-100 bg-gradient-to-b from-emerald-50/60 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {eyebrow && (
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">
              {eyebrow}
            </p>
          )}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            {title}
          </h1>
          {subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      </header>
      <div className="py-16">{children}</div>
      <Footer />
    </main>
  );
}

/** Long-form text wrapper (legal pages, blog posts). */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-700 leading-relaxed
        [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-12 [&_h2]:mb-4
        [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-3
        [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
        [&_li]:mb-2 [&_a]:text-emerald-600 [&_a]:font-medium hover:[&_a]:text-emerald-700
        [&_strong]:text-gray-900"
    >
      {children}
    </div>
  );
}

export function CTABanner({
  title = 'Ready to stop managing your supply chain?',
  body = 'Tell us what you need and get a quote within a few business days.',
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
      <div className="rounded-2xl bg-gray-900 px-8 py-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{title}</h2>
        <p className="text-gray-300 mb-8">{body}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/auth/signup"
            className="px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Get Started
          </a>
          <a
            href="/contact"
            className="px-6 py-3 border border-gray-600 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Talk to Us
          </a>
        </div>
      </div>
    </section>
  );
}
