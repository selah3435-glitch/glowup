import { createFileRoute, Link } from '@tanstack/react-router'
import { BrandLogo } from '../components/BrandLogo'
import { marketingHead } from '../lib/marketing-meta'

export const Route = createFileRoute('/terms')({
  component: TermsPage,
  head: () =>
    marketingHead({
      title: 'Terms of Service — GlowUP.',
      description:
        'Terms for the GlowUP. salon operating system, including the Floor pilot, Glo chat, and open beta limits.',
      path: '/terms',
    }),
})

function TermsPage() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <BrandLogo href="/" compact />
        <Link to="/">Home</Link>
      </header>
      <article className="legal-body">
        <p className="legal-kicker">Legal</p>
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: August 5, 2026</p>

        <p>
          These Terms govern access to GlowUP., the salon operating system at glowupbeautysolutions.com (the
          “Service”), operated as an open beta multi-tenant product.
        </p>

        <h2>1. Acceptance</h2>
        <p>
          By creating an account, starting a pilot, or using the Service, you agree to these Terms and our{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>

        <h2>2. The Service (open beta)</h2>
        <p>
          GlowUP. provides booking/calendar, CRM-related tools, Glo AI chat (when configured), and related ops features.
          Features may change during beta. Phone voice for Glo may be unavailable until separately provisioned.
        </p>

        <h2>3. Accounts</h2>
        <p>
          You must provide accurate information and keep credentials secure. You are responsible for activity under your
          account and for salon data you import or enter.
        </p>

        <h2>4. Plans &amp; billing</h2>
        <p>
          Paid plans (e.g. Solo, Floor) may be purchased via Stripe Checkout. Trials, pricing, and allowances are
          described on the site and may change. Brand plans may require a custom quote. Fees are non-refundable except
          where required by law or stated at purchase.
        </p>

        <h2>5. Acceptable use</h2>
        <ul>
          <li>No unlawful, abusive, or infringing content.</li>
          <li>No attempts to disrupt, reverse engineer, or overload the Service.</li>
          <li>No using Glo or the platform to spam, mislead clients, or violate communications laws (TCPA, etc.).</li>
        </ul>

        <h2>6. Your data</h2>
        <p>
          You retain ownership of salon and client data you provide. You grant us a limited license to process that data
          solely to operate the Service. Migration from other tools is offered as a guided process during beta and is not
          guaranteed for every competitor export format.
        </p>

        <h2>7. AI features</h2>
        <p>
          Glo and other AI features may produce incorrect or incomplete outputs. You are responsible for reviewing
          bookings, messages, and recommendations before relying on them with clients.
        </p>

        <h2>8. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” DURING OPEN BETA WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, GlowUP. and its operators are not liable for indirect, incidental,
          special, or consequential damages, or lost profits/revenue, arising from use of the Service. Aggregate
          liability is limited to fees paid by you to us in the three months before the claim (or $100 if none).
        </p>

        <h2>10. Termination</h2>
        <p>
          We may suspend or terminate access for breach or risk to the platform. You may stop using the Service at any
          time. Provisions that should survive will survive termination.
        </p>

        <h2>11. Contact</h2>
        <p>
          Questions: <a href="mailto:aaron.jawsai@gmail.com">aaron.jawsai@gmail.com</a>
        </p>
      </article>
    </main>
  )
}
