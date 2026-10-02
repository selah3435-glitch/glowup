import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, ChevronRight } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { trackEvent } from '../lib/analytics'
import { breadcrumbJsonLd, marketingHead } from '../lib/marketing-meta'

export const Route = createFileRoute('/for-solo')({
  component: ForSoloPage,
  head: () =>
    marketingHead({
      title: 'Salon Software for Independent Stylists | GlowUP.',
      description:
        'GlowUP. Solo is $39/mo for one stylist: live calendar, deposits, and Glo chat. The same OS becomes Floor when you add chairs. Open beta. Multi-stylist floors are the launch.',
      path: '/for-solo',
      jsonLd: breadcrumbJsonLd([
        { name: 'GlowUP.', path: '/' },
        { name: 'Solo', path: '/for-solo' },
      ]),
    }),
})

const TRIAL = '/login?next=%2Fonboarding&plan=solo'

const points = [
  'Live calendar that grows with you — no tool switch when you hire chair two',
  'Glo AI chat books after hours (beta) onto your real book',
  'Deposits and client history so cancels don’t empty your week',
  'Solo $39/mo with AI included — open beta free setup',
]

function ForSoloPage() {
  return (
    <main className="marketing-page rhode-look segment-page">
      <header className="rd-nav">
        <div className="rd-nav-brand">
          <BrandLogo href="/" showSlogan={false} />
          <span className="rd-beta-chip">Open beta</span>
        </div>
        <nav className="rd-nav-links" aria-label="Primary">
          <Link to="/">Home</Link>
          <Link to="/for-floors">Multi-stylist floors</Link>
          <a href="/compare/vagaro">Compare</a>
          <a className="rd-nav-cta" href={TRIAL} onClick={() => trackEvent('join_beta_click', { plan: 'solo', location: 'for_solo_nav' })}>
            Start Solo pilot
          </a>
        </nav>
      </header>

      <section className="segment-hero">
        <p className="rd-kicker">Independent stylists · booth renters · open beta</p>
        <h1>
          Salon software that stays with you
          <br />
          <em>when the floor grows.</em>
        </h1>
        <p className="rd-lede">
          Take control of booking, deposits, and clients on GlowUP. Solo — then add chairs on the same continuous
          Salon OS. No re-platform when you hire.
        </p>
        <div className="rd-cta-row">
          <a
            className="rd-btn-primary"
            href={TRIAL}
            onClick={() => trackEvent('join_beta_click', { plan: 'solo', location: 'for_solo_hero' })}
          >
            Start Solo pilot <ChevronRight size={16} />
          </a>
          <Link className="rd-btn-ghost" to="/for-floors">
            I run a multi-stylist floor
          </Link>
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
          Prefer owner-grade multi-chair ops? See{' '}
          <Link to="/for-floors">multi-location &amp; multi-stylist GlowUP.</Link>
        </p>
      </section>

      <footer className="rd-footer">
        <BrandLogo href="/" showSlogan />
        <nav className="rd-footer-nav">
          <Link to="/">Home</Link>
          <Link to="/for-floors">Floors</Link>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <span className="rd-footer-copy">© 2026 GlowUP.</span>
      </footer>
    </main>
  )
}
