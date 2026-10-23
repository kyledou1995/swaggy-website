import type { Metadata } from 'next';
import PageShell, { Prose } from '@/components/landing/PageShell';

export const metadata: Metadata = {
  title: 'Privacy Policy — Merchin',
  description: 'How Merchin collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <PageShell eyebrow="Legal" title="Privacy Policy" subtitle="Last updated: October 23, 2026">
      <Prose>
        <p>
          This Privacy Policy explains how Merchin Inc. ("Merchin," "we," "us") collects, uses, and
          shares information when you visit merchin.co or use the Merchin platform and services
          (together, the "Services").
        </p>

        <h2>1. Information we collect</h2>
        <h3>Information you provide</h3>
        <ul>
          <li><strong>Account information:</strong> name, email address, company name, password, and role.</li>
          <li><strong>Business information:</strong> business and delivery addresses, and details about your team members you invite.</li>
          <li><strong>Order information:</strong> product specifications, quantities, target pricing, timelines, notes, and files you upload such as artwork, logos, inspiration images, and packaging dielines.</li>
          <li><strong>Communications:</strong> messages you send us through the platform, by email, or through our contact form.</li>
        </ul>
        <h3>Payment information</h3>
        <p>
          Payments are processed by Stripe. Card and bank account details are submitted directly to
          Stripe and are not stored on our servers. We receive limited information from Stripe such
          as payment status, amount, and a transaction reference.
        </p>
        <h3>Information collected automatically</h3>
        <p>
          When you use the Services, our hosting and infrastructure providers automatically record
          technical information such as IP address, browser type, device information, pages
          requested, and timestamps, for security and to operate the Services.
        </p>

        <h2>2. How we use information</h2>
        <ul>
          <li>To provide the Services: sourcing, sampling, manufacturing, quality control, shipping, and customer support.</li>
          <li>To create and manage your account and your organization's access.</li>
          <li>To process payments and generate invoices.</li>
          <li>To send service communications such as order updates, quotes, and notifications according to your preferences.</li>
          <li>To secure the Services, prevent fraud, and enforce our Terms.</li>
          <li>To improve and develop the Services.</li>
          <li>To comply with legal obligations, including customs, tax, and accounting requirements.</li>
        </ul>
        <p>We do not sell your personal information.</p>

        <h2>3. How we share information</h2>
        <ul>
          <li><strong>Manufacturers and logistics partners:</strong> we share order specifications, artwork, and delivery details with the factories, inspectors, freight forwarders, and customs brokers needed to fulfill your order.</li>
          <li><strong>Service providers:</strong> companies that host and operate the Services on our behalf, including Vercel (hosting), Supabase (database, authentication, and file storage), and Stripe (payments).</li>
          <li><strong>Legal and safety:</strong> when required by law or to protect the rights, property, or safety of Merchin, our customers, or others.</li>
          <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of assets, subject to this Policy.</li>
        </ul>

        <h2>4. Data retention</h2>
        <p>
          We keep account and order information for as long as your account is active and as needed
          to provide the Services, then for the period required for legal, tax, accounting, and
          dispute-resolution purposes.
        </p>

        <h2>5. Security</h2>
        <p>
          We use industry-standard safeguards including encryption in transit, encryption at rest
          provided by our infrastructure providers, and database-level access controls. No method
          of transmission or storage is completely secure, but we work to protect your information.
          See our <a href="/security">Security page</a> for details.
        </p>

        <h2>6. International transfers</h2>
        <p>
          Because we source and ship products internationally, your order information may be
          processed in countries other than your own, including where manufacturers are located.
          We take steps to protect your information wherever it is processed.
        </p>

        <h2>7. Your choices and rights</h2>
        <ul>
          <li>You can update your account and notification preferences in your portal settings.</li>
          <li>You may request access to, correction of, or deletion of your personal information by emailing us.</li>
          <li>Depending on where you live (for example, California or the EU/UK), you may have additional rights under applicable law. We will respond to requests as required.</li>
        </ul>

        <h2>8. Children</h2>
        <p>
          The Services are intended for businesses and are not directed to children under 16. We do
          not knowingly collect information from children.
        </p>

        <h2>9. Changes to this policy</h2>
        <p>
          We may update this Policy from time to time. If we make material changes, we will notify
          you by email or through the Services. The "Last updated" date shows when it was last revised.
        </p>

        <h2>10. Contact us</h2>
        <p>
          Questions about this Policy or your information? Email{' '}
          <a href="mailto:support@merchin.co">support@merchin.co</a>.
        </p>
      </Prose>
    </PageShell>
  );
}
