import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, ChevronRight } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { trackEvent } from '../lib/analytics'
import { breadcrumbJsonLd, FLOOR_PILOT_HREF, marketingHead } from '../lib/marketing-meta'

export const Route = createFileRoute('/for-floors')({
  component: ForFloorsPage,
  head: () =>
    marketingHead({
      title: 'Salon Software for Multi-Stylist Floors | GlowUP.',
      description:
        'Salon booking software and CRM for multi-stylist floors. One live calendar, Glo after hours, deposits. Floor pilot $149 with 30 days on the house.',
      path: '/for-floors',
      jsonLd: breadcrumbJsonLd([
        { name: 'GlowUP.', path: '/' },
        { name: 'Floors', path: '/for-floors' },
      ]),
    }),
})

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
          <a href="/compare/vagaro">Compare</a>
          <a
            className="rd-nav-cta"
            href={FLOOR_PILOT_HREF}
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
            href={FLOOR_PILOT_HREF}
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
          Switching books is concierge: CSV, a Zoom, and 14 days beside the current book.{' '}
          <Link to="/ai-receptionist">Glo is the AI receptionist</Link> on that same calendar.
        </p>
      </section>

      <footer className="rd-footer">
        <BrandLogo href="/" showSlogan />
        <nav className="rd-footer-nav">
          <Link to="/">Home</Link>
          <Link to="/ai-receptionist">AI receptionist</Link>
          <Link to="/for-solo">Solo</Link>
          <a href="/#migrate">Migrate</a>
          <a href="/compare/vagaro">vs Vagaro</a>
          <a href="/compare/gloss-genius">vs Gloss Genius</a>
          <a href="/compare/fresha">vs Fresha</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <span className="rd-footer-copy">© 2026 GlowUP.</span>
      </footer>
    </main>
  )
}
