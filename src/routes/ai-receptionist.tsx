import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, ChevronRight } from 'lucide-react'
import { BrandLogo } from '../components/BrandLogo'
import { trackEvent } from '../lib/analytics'
import { GLOWUP_SITE } from '../lib/glowup-schema'
import { breadcrumbJsonLd, faqJsonLd, FLOOR_PILOT_HREF, marketingHead } from '../lib/marketing-meta'

const PAGE_FAQ = [
  {
    q: 'What is an AI receptionist for a salon?',
    a: 'An AI receptionist answers when the floor cannot: after hours, during color, when the phone is down. On GlowUP., that receptionist is Glo. Chat Glo books a hold on the live multi-stylist calendar. It is not a voicemail and not a widget bolted onto another book.',
  },
  {
    q: 'Does Glo book a real chair or take a message?',
    a: 'Glo books the live calendar — real chairs on the floor book. Chat is in open beta. Phone voice is not live yet. Do not start a pilot if you need a phone agent this week.',
  },
  {
    q: 'How much does the AI receptionist cost?',
    a: 'Glo is included on paid plans. The Floor pilot is $149/mo for one multi-stylist location, with 30 days on the house, then the card. About 1,000 Glo conversations are included. It is not a second $49–200 bot on top of Vagaro.',
  },
  {
    q: 'Will this replace my front desk?',
    a: 'No. Glo covers the hours the desk is down and lands the hold on the same book the floor already runs. Staff still own the day. Content drafts still wait for an owner.',
  },
  {
    q: 'Can I keep my current booking software while I try it?',
    a: 'Yes. Migration is concierge: CSV export, a Zoom to map chairs, and 14 days with the current book (often Vagaro) still live. Cut over when the GlowUP. floor book is ready.',
  },
] as const

export const Route = createFileRoute('/ai-receptionist')({
  component: AiReceptionistPage,
  head: () =>
    marketingHead({
      title: 'AI Receptionist for Salons | Glo by GlowUP.',
      description:
        'Glo is the AI receptionist for multi-stylist salons. It books the live calendar after hours. Floor pilot $149, 30 days on the house. Chat is live; phone voice is coming.',
      path: '/ai-receptionist',
      jsonLd: [
        breadcrumbJsonLd([
          { name: 'GlowUP.', path: '/' },
          { name: 'AI receptionist', path: '/ai-receptionist' },
        ]),
        faqJsonLd(PAGE_FAQ, `${GLOWUP_SITE}/ai-receptionist#faq`),
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Glo by GlowUP.',
          applicationCategory: 'BusinessApplication',
          applicationSubCategory: 'AI receptionist for salons',
          operatingSystem: 'Web',
          url: `${GLOWUP_SITE}/ai-receptionist`,
          description:
            'AI receptionist that books the live multi-stylist salon calendar. Included on the GlowUP. Floor plan.',
          offers: {
            '@type': 'Offer',
            price: '149',
            priceCurrency: 'USD',
            url: `${GLOWUP_SITE}/#pricing`,
            description: 'Floor plan, $149/month, 30 days on the house, Glo chat included.',
          },
        },
      ],
    }),
})

const points = [
  'Answers after 7pm and while color is processing',
  'Books a hold on the live multi-stylist calendar',
  'Deposits sit on the same appointment the inquiry hit',
  'Included on Floor — not a separate receptionist invoice',
  'Chat is live in open beta; phone voice is coming',
]

function AiReceptionistPage() {
  return (
    <main className="marketing-page rhode-look segment-page">
      <header className="rd-nav">
        <div className="rd-nav-brand">
          <BrandLogo href="/" showSlogan={false} />
          <span className="rd-beta-chip">Open beta</span>
        </div>
        <nav className="rd-nav-links" aria-label="Primary">
          <Link to="/">Home</Link>
          <Link to="/for-floors">Floors</Link>
          <a href="/compare/vagaro">vs Vagaro</a>
          <a
            className="rd-nav-cta"
            href={FLOOR_PILOT_HREF}
            onClick={() => trackEvent('join_beta_click', { plan: 'floor', location: 'ai_receptionist_nav' })}
          >
            Start Floor pilot
          </a>
        </nav>
      </header>

      <section className="segment-hero">
        <p className="rd-kicker">AI receptionist for salons · Glo</p>
        <h1>
          The desk that books
          <br />
          <em>after the floor closes.</em>
        </h1>
        <p className="rd-lede">
          GlowUP. is salon software for multi-stylist floors. Glo is the AI receptionist on that software: chat books
          the live calendar when nobody is at the desk. Phone voice is coming. The Floor pilot is $149 with 30 days on
          the house.
        </p>
        <div className="rd-cta-row">
          <a
            className="rd-btn-primary"
            href={FLOOR_PILOT_HREF}
            onClick={() => trackEvent('join_beta_click', { plan: 'floor', location: 'ai_receptionist_hero' })}
          >
            Start Floor pilot <ChevronRight size={16} />
          </a>
          <Link className="rd-btn-ghost" to="/for-floors">
            Built for floors
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
          Already on a booker? Compare{' '}
          <a href="/compare/vagaro">Vagaro</a>, <a href="/compare/fresha">Fresha</a>,{' '}
          <a href="/compare/gloss-genius">Gloss Genius</a>, <a href="/compare/booksy">Booksy</a>,{' '}
          <a href="/compare/boulevard">Boulevard</a>, or <a href="/compare/mangomint">Mangomint</a>. Switch cost is
          handled: CSV, Zoom, 14 days in parallel.
        </p>
      </section>

      <section className="compare-faq" id="faq">
        <p className="rd-kicker">FAQ</p>
        <h2>AI receptionist, without the pitch deck</h2>
        {PAGE_FAQ.map((item) => (
          <article key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </article>
        ))}
      </section>

      <section className="rd-final">
        <h2>
          Five Floor pilots.
          <br />
          <em>Same city or same niche.</em>
        </h2>
        <p>Multi-stylist only. $149 with 30 days on the house. Native desk, live book, deposits.</p>
        <a
          className="rd-btn-primary"
          href={FLOOR_PILOT_HREF}
          onClick={() => trackEvent('join_beta_click', { plan: 'floor', location: 'ai_receptionist_final' })}
        >
          Start Floor pilot <ChevronRight size={16} />
        </a>
      </section>

      <footer className="rd-footer">
        <BrandLogo href="/" showSlogan />
        <nav className="rd-footer-nav">
          <Link to="/">Home</Link>
          <Link to="/for-floors">Floors</Link>
          <a href="/#pricing">Pricing</a>
          <a href="/compare/vagaro">vs Vagaro</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <span className="rd-footer-copy">© 2026 GlowUP. · Open beta</span>
      </footer>
    </main>
  )
}
