import { createFileRoute, Link } from '@tanstack/react-router'
import { BrandLogo } from '../components/BrandLogo'
import { marketingHead } from '../lib/marketing-meta'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
  head: () =>
    marketingHead({
      title: 'Privacy Policy — GlowUP.',
      description:
        'How GlowUP. collects account, salon, and Glo chat data, and the choices you have. GlowUP Beauty Solutions.',
      path: '/privacy',
    }),
})

function PrivacyPage() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <BrandLogo href="/" compact />
        <Link to="/">Home</Link>
      </header>
      <article className="legal-body">
        <p className="legal-kicker">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: August 5, 2026</p>

        <p>
          GlowUP. (“we”, “us”) provides a multi-tenant salon operating system including booking, CRM, and Glo AI
          features at glowupbeautysolutions.com. This policy explains what we collect, how we use it, and your choices.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account data</strong> — name, email, and credentials when you sign up (Netlify Identity).
          </li>
          <li>
            <strong>Salon data</strong> — business name, services, appointments, clients, and related ops data you enter
            in the product (stored in browser storage and, when signed in, synced via platform APIs).
          </li>
          <li>
            <strong>Usage &amp; communications</strong> — Glo chat messages used to book or capture leads; platform
            events (e.g. sign-up stage, gap audit) for product ops.
          </li>
          <li>
            <strong>Payments</strong> — billing is processed by Stripe; we do not store full card numbers on our
            servers.
          </li>
          <li>
            <strong>Analytics cookies</strong> — if you accept analytics cookies, we may use Google Analytics 4 and/or
            Meta Pixel to measure traffic and marketing performance.
          </li>
        </ul>

        <h2>How we use information</h2>
        <ul>
          <li>Provide and improve the Salon OS (booking, CRM, AI front desk).</li>
          <li>Pilot you, pilot onboarding, and customer support.</li>
          <li>Process subscriptions via Stripe Checkout.</li>
          <li>Understand site usage when you consent to analytics.</li>
        </ul>

        <h2>Legal bases (where applicable)</h2>
        <p>
          Contract performance (providing the service you request), legitimate interests (product improvement and
          security), and consent (non-essential analytics cookies).
        </p>

        <h2>Sharing</h2>
        <p>
          We use processors such as Netlify (hosting/auth), Stripe (payments), xAI (Glo AI chat when configured), and
          optionally Twilio (SMS). We do not sell personal information.
        </p>

        <h2>Retention</h2>
        <p>
          We retain account and salon data while your pilot/subscription is active and as needed for legal or security
          purposes. Browser local data can be cleared by you in the browser.
        </p>

        <h2>Your rights</h2>
        <p>
          Depending on your region (including GDPR/CCPA), you may request access, correction, deletion, or restriction.
          Contact us at the address below. You may also reject analytics cookies via our cookie banner.
        </p>

        <h2>Children</h2>
        <p>GlowUP. is a B2B product not directed to children under 16.</p>

        <h2>Contact</h2>
        <p>
          Privacy questions: <a href="mailto:aaron.jawsai@gmail.com">aaron.jawsai@gmail.com</a>
        </p>

        <p>
          See also our <Link to="/terms">Terms of Service</Link>.
        </p>
      </article>
    </main>
  )
}
