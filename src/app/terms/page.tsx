import type { Metadata } from 'next';
import PageShell, { Prose } from '@/components/landing/PageShell';

export const metadata: Metadata = {
  title: 'Terms of Service — Merchin',
  description: 'The terms that govern your use of the Merchin platform and services.',
};

export default function TermsPage() {
  return (
    <PageShell eyebrow="Legal" title="Terms of Service" subtitle="Last updated: October 23, 2026">
      <Prose>
        <p>
          These Terms of Service ("Terms") govern your access to and use of merchin.co and the
          Merchin platform and services (the "Services") provided by Merchin Inc. ("Merchin," "we,"
          "us"). By creating an account or using the Services, you agree to these Terms on behalf of
          yourself and the business you represent ("you").
        </p>

        <h2>1. The Services</h2>
        <p>
          Merchin provides product sourcing, design, sampling, production management, quality
          control, and logistics services for businesses, along with an online portal to request,
          track, and pay for orders. The Services are intended for business use only.
        </p>

        <h2>2. Accounts</h2>
        <ul>
          <li>You must provide accurate information and keep your login credentials secure.</li>
          <li>You are responsible for all activity under your account and your organization, including actions by team members you invite.</li>
          <li>Notify us promptly at <a href="mailto:security@merchin.co">security@merchin.co</a> if you suspect unauthorized access.</li>
        </ul>

        <h2>3. Orders and quotes</h2>
        <ul>
          <li>Submitting an order request does not create a binding order. An order is confirmed when you accept a quote and pay the required deposit.</li>
          <li>Quotes are valid for the period stated on the quote, or 14 days if none is stated, and may change if specifications, quantities, or delivery details change.</li>
          <li>Unless stated otherwise, quotes are DDP (Delivered Duty Paid) to the delivery address you provide.</li>
          <li>Production and transit times are good-faith estimates and are not guaranteed. Delays caused by manufacturers, carriers, customs, weather, or other events beyond our reasonable control may occur.</li>
        </ul>

        <h2>4. Samples and approval</h2>
        <p>
          Where samples are produced, full production begins only after you approve the sample.
          Your approval establishes the standard for the production run. Reasonable variation in
          color, materials, and dimensions consistent with industry norms is acceptable.
        </p>

        <h2>5. Payment</h2>
        <ul>
          <li>A deposit (typically 30% of the order total) is due upon quote acceptance. Sample fees, if any, are due before samples are produced.</li>
          <li>The remaining balance is due before your order ships.</li>
          <li>Payments are processed by Stripe and are subject to Stripe's terms. Prices are in US dollars.</li>
          <li>We may pause work or hold shipment on orders with unpaid amounts.</li>
        </ul>

        <h2>6. Cancellations and refunds</h2>
        <p>
          You may cancel an order before a deposit is paid at no cost. After a deposit is paid,
          cancellation requests are reviewed case by case; any refund will be reduced by costs
          already incurred or committed, such as materials, sampling, production, and freight.
          Custom products are generally non-refundable once production has begun, except where
          they fail to conform to the approved sample.
        </p>

        <h2>7. Defects and claims</h2>
        <p>
          Please inspect your delivery and report any defects, shortages, or damage within 14 days
          of delivery with photos and details. If goods materially fail to conform to the approved
          sample or specifications, we will work with you to repair, replace, or credit the
          affected units at our option.
        </p>

        <h2>8. Your content and intellectual property</h2>
        <ul>
          <li>You retain all rights to the logos, artwork, designs, and other materials you provide ("Your Content").</li>
          <li>You grant Merchin and its manufacturing and logistics partners a limited license to use Your Content solely to provide the Services for your orders.</li>
          <li>You represent that you have the rights to use Your Content and that producing your products will not infringe anyone else's rights.</li>
          <li>Merchin owns the platform, software, and branding of the Services.</li>
        </ul>

        <h2>9. Acceptable use</h2>
        <p>
          You may not use the Services to produce counterfeit, infringing, illegal, or hazardous
          products; to misrepresent goods for customs purposes; or to interfere with the security or
          operation of the platform.
        </p>

        <h2>10. Product compliance</h2>
        <p>
          You are responsible for ensuring your products meet the legal, safety, labeling, and
          regulatory requirements of the markets where you sell them. We can help coordinate
          testing and certifications on request.
        </p>

        <h2>11. Disclaimers</h2>
        <p>
          Except as expressly stated in these Terms, the Services are provided "as is" and we
          disclaim all implied warranties, including merchantability and fitness for a particular
          purpose, to the extent permitted by law.
        </p>

        <h2>12. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Merchin will not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or for lost profits or revenue.
          Our total liability for any claim relating to an order will not exceed the amount you
          paid us for that order.
        </p>

        <h2>13. Indemnification</h2>
        <p>
          You agree to indemnify Merchin against claims arising from Your Content, your products'
          compliance with applicable law, or your breach of these Terms.
        </p>

        <h2>14. Termination</h2>
        <p>
          You may close your account at any time. We may suspend or terminate access for breach of
          these Terms. Sections that by their nature should survive termination will survive,
          including payment obligations, intellectual property, and limitation of liability.
        </p>

        <h2>15. Changes</h2>
        <p>
          We may update these Terms from time to time. If changes are material, we will notify you
          by email or through the Services. Continued use after changes take effect means you
          accept the updated Terms.
        </p>

        <h2>16. Governing law</h2>
        <p>
          These Terms are governed by the laws of the state in which Merchin Inc. is incorporated,
          without regard to conflict-of-law rules.
        </p>

        <h2>17. Contact</h2>
        <p>
          Questions about these Terms? Email <a href="mailto:support@merchin.co">support@merchin.co</a>.
        </p>
      </Prose>
    </PageShell>
  );
}
