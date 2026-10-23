import type { Metadata } from 'next';
import PageShell, { Prose } from '@/components/landing/PageShell';

export const metadata: Metadata = {
  title: 'Cookie Policy — Merchin',
  description: 'How Merchin uses cookies and similar storage technologies.',
};

export default function CookiesPage() {
  return (
    <PageShell eyebrow="Legal" title="Cookie Policy" subtitle="Last updated: October 23, 2026">
      <Prose>
        <p>
          This Cookie Policy explains how Merchin Inc. ("Merchin") uses cookies and similar
          technologies, such as browser local storage, on merchin.co and the Merchin platform.
        </p>

        <h2>What are cookies and local storage?</h2>
        <p>
          Cookies are small text files a website stores in your browser. Local storage is a similar
          browser feature that lets a site save information on your device. Both help websites
          remember who you are and how you use them.
        </p>

        <h2>What we use</h2>
        <p>
          We keep this simple. Merchin only uses <strong>strictly necessary</strong> storage that is
          required for the Services to work:
        </p>
        <ul>
          <li>
            <strong>Authentication session:</strong> when you log in, a session token is stored in
            your browser's local storage so you stay signed in as you move between pages. It is
            removed when you log out.
          </li>
          <li>
            <strong>Security and infrastructure:</strong> our hosting and payment providers may set
            cookies needed to deliver pages securely, prevent fraud, and process payments. For
            example, Stripe sets cookies on its checkout pages to detect fraud.
          </li>
        </ul>

        <h2>What we don't use</h2>
        <p>
          We do not currently use advertising cookies, cross-site tracking, or third-party
          analytics cookies. If that changes, we will update this policy and ask for your consent
          where required.
        </p>

        <h2>Managing cookies</h2>
        <p>
          You can clear or block cookies and local storage in your browser settings. Because the
          storage we use is strictly necessary, blocking it will prevent you from logging in to
          the Merchin portal.
        </p>

        <h2>Third-party services</h2>
        <p>
          When you pay through Stripe Checkout, Stripe's own cookie and privacy policies apply on
          its pages. See{' '}
          <a href="https://stripe.com/cookie-settings" target="_blank" rel="noopener noreferrer">
            Stripe's cookie settings
          </a>{' '}
          for details.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? Email <a href="mailto:support@merchin.co">support@merchin.co</a>. See also our{' '}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </Prose>
    </PageShell>
  );
}
