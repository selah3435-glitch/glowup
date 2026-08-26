import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, ChevronRight } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { trackEvent } from '../lib/analytics'

export const Route = createFileRoute('/for-floors')({
  component: ForFloorsPage,
  head: () => ({
    meta: [
      { title: 'Multi-Location Salon Management Software & CRM | GlowUP.' },
      {
        name: 'description',
        content:
          'Manage multiple floors, staff schedules, and branches from one unified calendar spine. Glo AI after-hours chat, CRM, deposits — scale your salon enterprise with GlowUP.',
      },
    ],
  }),
})

const TRIAL = '/login?next=%2Fonboarding&plan=floor'

const points = [
  'One live multi-stylist calendar spine — no double-books across chairs',
  'Glo AI chat (beta) books after hours onto the real floor book',
  'Client retention infrastructure: formulas, history, deposits, ops',
  'Floor $149 · Brand $299+/location — continuous OS as you add locations',
  'Guided migration from Booksy / GlossGenius / Mindbody-class tools',
]

function ForFloorsPage() {
  return (
    <main className="marketing-page rhode-look segment-page">
      <header className="rd-nav">
        <div className="rd-nav-brand">
          <BrandLogo href="/" showSlogan={false} />
          <span className="rd-beta-chip">Open beta</span>
        </div>
        <nav className="rd-nav-links" aria-label="Primary">
          <Link to="/">Home</Link>
          <Link to="/for-solo">Solo / booth</Link>
          <a
            className="rd-nav-cta"
            href={TRIAL}
            onClick={() => trackEvent('join_beta_click', { plan: 'floor', location: 'for_floors_nav' })}
          >
            Start Floor pilot
          </a>
        </nav>
      </header>

      <section className="segment-hero">
        <p className="rd-kicker">Multi-stylist · multi-location · Salon OS</p>
        <h1>
          One calendar spine.
          <br />
          <em>Every chair. Every branch.</em>
        </h1>
        <p className="rd-lede">
          GlowUP. is multi-location salon management software and CRM built for owners — staff schedules, live book,
          and Glo after-hours AI on a single operating system. Not a solo app you’ll outgrow.
        </p>
        <div className="rd-cta-row">
          <a
            className="rd-btn-primary"
            href={TRIAL}
            onClick={() => trackEvent('join_beta_click', { plan: 'floor', location: 'for_floors_hero' })}
          >
            Start Floor pilot <ChevronRight size={16} />
          </a>
          <a className="rd-btn-ghost" href="/#roi">
            Run ROI calculator
          </a>
        </div>
      </section>

      <section className="segment-body">
        <ul className="segment-list">
          {points.map((p) => (
            <li key={p}>
              <Check size={16} /> {p}
            </li>
          ))}
        </ul>
        <p className="segment-note">
          Solo or booth first? Start on{' '}
          <Link to="/for-solo">GlowUP. for independent stylists</Link> — same OS when you scale.
        </p>
      </section>

      <footer className="rd-footer">
        <BrandLogo href="/" showSlogan />
        <nav className="rd-footer-nav">
          <Link to="/">Home</Link>
          <Link to="/for-solo">Solo</Link>
          <a href="/#migrate">Migrate</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <span className="rd-footer-copy">© 2026 GlowUP.</span>
      </footer>
    </main>
  )
}
