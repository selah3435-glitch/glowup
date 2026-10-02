import { createFileRoute } from '@tanstack/react-router'
import {
  Check,
  ChevronRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { AiReceptionist } from '../components/AiReceptionist'
import { HeroDashboardPreview } from '../components/HeroDashboardPreview'
import { RoiCalculator } from '../components/RoiCalculator'
import { GapAuditForm } from '../components/GapAuditForm'
import { brandMailto, pilotCheckoutMessage, startCheckout } from '../lib/billing-client'
import { trackEvent } from '../lib/analytics'
import { computeProofMetrics, type ProofMetrics } from '../lib/proof-metrics'
import {
  AI_OVERAGE_NOTE,
  ANNUAL_DISCOUNT,
  PRICING_COMPARE,
  PRICING_PLANS,
  setSelectedPlanId,
  type PlanId,
} from '../lib/pricing'
import { GLOWUP_FAQ, GLOWUP_FAQ_JSON_LD } from '../lib/glowup-schema'

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: [
      { title: 'GlowUP. | The AI-Powered Salon Operating System (OS)' },
      {
        name: 'description',
        content:
          'GlowUP. is the salon operating system. Glo, the native AI receptionist, books the live multi-stylist calendar after hours. CRM, deposits, and growth on one OS. Open beta.',
      },
      {
        'script:ld+json': GLOWUP_FAQ_JSON_LD,
      },
    ],
  }),
})

const TRIAL_HREF = '/login?next=%2Fonboarding'
const FLOOR_PILOT_HREF = '/login?next=%2Fonboarding&plan=floor'

const HERO_BG = '/hero-salon.jpg'

const essentials = [
  {
    cat: 'front desk',
    title: 'Glo AI',
    copy: 'Always-on receptionist that books the live multi-stylist calendar.',
    badge: 'Live',
    live: true,
  },
  {
    cat: 'book',
    title: 'Live calendar',
    copy: 'One book for every chair — no double-books, no sticky notes.',
    badge: 'Live',
    live: true,
  },
  {
    cat: 'crm',
    title: 'Clients + formulas',
    copy: 'Preferences, visit history, and formulas for the whole floor.',
    badge: 'Live',
    live: true,
  },
  {
    cat: 'money',
    title: 'Deposits',
    copy: 'Protect high-ticket services so cancels don’t empty the floor.',
    badge: 'Live',
    live: true,
  },
]

const stories = [
  {
    title: 'After hours, still booked',
    copy: 'Glo answers while color processes — holds land on the real multi-stylist book, not a voicemail graveyard.',
    img: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1000&q=80',
    cta: 'Meet Glo',
    href: '#glo',
  },
  {
    title: 'One OS as you grow',
    copy: 'Add chairs or a second location on the same calendar spine, CRM, and Glo — no forced re-platform when the floor grows.',
    img: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=1000&q=80',
    cta: 'See pricing',
    href: '#pricing',
    reverse: true,
  },
]

const floorNotes = [
  {
    title: 'After hours',
    copy: 'Glo answers while color processes. Holds land on the live multi-stylist book — not a voicemail graveyard.',
  },
  {
    title: 'One OS as you grow',
    copy: 'Add chairs or a second location on the same calendar, CRM, and Glo. No forced re-platform when the floor grows.',
  },
  {
    title: 'Desk matches the book',
    copy: 'Deposits, formulas, and after-hours holds sit on one OS — so ops matches what clients see at the chair.',
  },
]

function Home() {
  const [checkoutBusy, setCheckoutBusy] = useState<PlanId | null>(null)
  const [checkoutMsg, setCheckoutMsg] = useState('')
  const [proof, setProof] = useState<ProofMetrics | null>(null)

  useEffect(() => {
    try {
      setProof(computeProofMetrics())
    } catch {
      setProof(null)
    }
  }, [])

  async function onSelectPlan(planId: PlanId) {
    setSelectedPlanId(planId)
    setCheckoutMsg('')
    trackEvent('start_checkout', { plan: planId })
    // Brand is custom sales — mailto only; never Stripe checkout
    if (planId === 'brand') {
      window.location.href = brandMailto()
      return
    }
    setCheckoutBusy(planId)
    const r = await startCheckout(planId)
    setCheckoutBusy(null)
    if (r.url) {
      window.location.href = r.url
      return
    }
    // Card checkout unavailable (pilot) or Stripe API error → still free beta setup
    if (r.pilot || (r.fallback && !r.error)) {
      setCheckoutMsg(pilotCheckoutMessage(planId))
    } else if (r.error) {
      setCheckoutMsg(`${r.error} — continuing onboarding for ${planId}.`)
    } else {
      setCheckoutMsg(`Plan ${planId} saved — continue onboarding.`)
    }
    // Brief beat so the line is readable before the onboarding redirect
    await new Promise((resolve) => setTimeout(resolve, 900))
    window.location.href = `${TRIAL_HREF}&plan=${planId}`
  }

  return (
    <main className="marketing-page rhode-look">
      <header className="rd-nav">
        <div className="rd-nav-brand">
          <BrandLogo href="/" showSlogan={false} />
          <span className="rd-beta-chip">Open beta</span>
        </div>
        <nav className="rd-nav-links" aria-label="Primary">
          <a href="#roi">ROI</a>
          <a href="/for-floors">Floors</a>
          <a href="/for-solo">Solo</a>
          <a href="#pricing">Pricing</a>
          <a
            className="rd-nav-cta"
            href={FLOOR_PILOT_HREF}
            onClick={() => trackEvent('join_beta_click', { plan: 'floor', location: 'nav' })}
          >
            Start Floor pilot
          </a>
        </nav>
      </header>

      <section className="rd-hero rd-hero-product" id="home">
        <div className="rd-hero-media" aria-hidden>
          <img src={HERO_BG} alt="" />
          <div className="rd-hero-shade" />
        </div>
        <div className="rd-hero-copy">
          <p className="rd-kicker">Five Floor pilots · Multi-stylist only</p>
          <h1>
            The salon operating system.
            <br />
            <em>Glo books the live floor book.</em>
          </h1>
          <p className="rd-lede hero-answer">
            GlowUP. is salon software for multi-stylist floors. Glo books the live calendar after hours. Floor pilot
            $149 with 30 days on the house.
          </p>
          <div className="rd-cta-row">
            <a
              className="rd-btn-primary"
              href={FLOOR_PILOT_HREF}
              onClick={() => trackEvent('join_beta_click', { plan: 'floor', location: 'hero' })}
            >
              Start Floor pilot <ChevronRight size={16} />
            </a>
            <a
              className="rd-btn-ghost"
              href="#hero-dashboard"
              onClick={() => trackEvent('see_dashboard_click', { location: 'hero' })}
            >
              See the owner dashboard
            </a>
          </div>
        </div>
        <div className="rd-hero-product-pane">
          <HeroDashboardPreview />
        </div>
      </section>

      <div className="rd-persona" id="persona">
        <a className="rd-persona-card primary" href={FLOOR_PILOT_HREF}>
          <span className="rd-persona-tag">Primary buyer</span>
          <strong>I run a multi-stylist floor</strong>
          <p>Native desk, live book, deposits — Glo after hours on the real multi-stylist calendar.</p>
          <em>Start Floor pilot →</em>
        </a>
        <a className="rd-persona-card" href="/for-solo">
          <span className="rd-persona-tag">Not this launch</span>
          <strong>Booth renters stay on Gloss Genius / Booksy</strong>
          <p>This page is for multi-stylist floors. Solo / booth notes live on a quieter page.</p>
          <em>For solo / booth →</em>
        </a>
      </div>

      <div className="rd-strip">
        Five Floor pilots · Floor $149 · 30 days on the house · Glo chat after hours · Voice coming
      </div>

      <RoiCalculator />

      <section className="rd-value" id="value">
        <div className="rd-value-head">
          <p className="rd-kicker">conversion + revenue</p>
          <h2>
            Turn more of the interest you’re already getting
            <br />
            <em>into booked clients.</em>
          </h2>
          <p>
            Industry-modeled ranges, not GlowUP. audited results: typical salon inquiry→book rates sit at{' '}
            <strong>15–25%</strong>. Instant reply plus after-hours holds onto the live book is modeled toward{' '}
            <strong>40%+</strong>.
          </p>
        </div>

        <div className="rd-math">
          <p className="rd-math-label">Example</p>
          <div className="rd-math-grid">
            <div className="rd-math-card">
              <span>150 inquiries / month</span>
              <strong>20% conversion</strong>
              <em>30 appointments</em>
            </div>
            <div className="rd-math-arrow" aria-hidden>
              →
            </div>
            <div className="rd-math-card featured">
              <span>Same 150 inquiries</span>
              <strong>40% conversion</strong>
              <em>60 appointments · +30 clients</em>
            </div>
          </div>
          <p className="rd-math-result">
            At an <strong>$85</strong> average ticket, that’s <strong>$2,550 more per month</strong> (
            <strong>$30,600 a year</strong>) from the leads you’re already receiving.
          </p>
        </div>
      </section>

      <section className="rd-value rd-value-alt" id="seo">
        <div className="rd-value-head">
          <p className="rd-kicker">SEO · visibility</p>
          <h2>
            Get found by the clients already
            <br />
            <em>searching for what you do.</em>
          </h2>
          <p>
            Industry-modeled local-search ranges (not GlowUP. audited): many owners see the majority of new
            bookings start in local search (often <strong>70–80%</strong>). A stronger Google presence and clear
            service pages commonly increase new client inquiries by around <strong>40%</strong>, while optimized
            profiles can deliver up to <strong>5×</strong> more appointment requests than incomplete ones.
          </p>
        </div>
        <div className="rd-seo-stats">
          <div className="rd-seo-stat">
            <strong>70–80%</strong>
            <span>of new bookings often start in local search</span>
          </div>
          <div className="rd-seo-stat">
            <strong>~40%</strong>
            <span>more inquiries with stronger presence &amp; service pages</span>
          </div>
          <div className="rd-seo-stat">
            <strong>up to 5×</strong>
            <span>more requests vs incomplete profiles</span>
          </div>
        </div>
      </section>

      <section className="rd-impact" id="impact">
        <p className="rd-kicker">modeled outcomes · pilot language</p>
        <h2>Harder numbers. Owner language.</h2>
        <ul className="rd-impact-list">
          <li>
            Industry-modeled inquiry→book rates: lift typical <strong>15–25%</strong> toward{' '}
            <strong>40%+</strong> when response is instant and after-hours demand lands on the live book.
          </li>
          <li>
            Same lead volume, more chairs filled — modeled example: +30 appointments/mo at $85 ticket ≈{' '}
            <strong>$2,550/mo</strong> without buying twice the traffic.
          </li>
          <li>
            <strong>Result:</strong> fuller floors and client retention infrastructure owners can run day to day —
            Glo chat beta now; phone voice coming soon.
          </li>
        </ul>
        <p className="rd-pain-foot">
          Figures are modeled ranges for planning, not audited guarantees. Open beta with real floors.
        </p>
        <div className="rd-cta-row" style={{ marginTop: 24 }}>
          <a className="rd-btn-primary" href={FLOOR_PILOT_HREF}>
            Start Floor pilot <ChevronRight size={16} />
          </a>
          <a className="rd-btn-ghost" href="#roi">
            Run ROI calculator
          </a>
        </div>
      </section>

      <section className="rd-migrate" id="migrate">
        <div className="rd-value-head">
          <p className="rd-kicker">migration · concierge</p>
          <h2>
            Switch cost is the opponent.
            <br />
            <em>Not their monthly fee.</em>
          </h2>
          <p>
            Migration is concierge: you export a CSV, we map it with you on Zoom, and Vagaro (or your current book)
            stays live in parallel for 14 days. You do not cut over until the GlowUP. floor book is ready.
          </p>
        </div>
        <div className="rd-migrate-steps">
          <article>
            <strong>01</strong>
            <h3>CSV export</h3>
            <p>Clients, services, and open appointments from Vagaro or your current book.</p>
          </article>
          <article>
            <strong>02</strong>
            <h3>You on Zoom</h3>
            <p>We map chairs, stylists, and formulas onto the GlowUP. live book together.</p>
          </article>
          <article>
            <strong>03</strong>
            <h3>14 days in parallel</h3>
            <p>Vagaro stays live beside GlowUP. Cut over when the floor is ready.</p>
          </article>
        </div>
        <a className="rd-btn-primary" href={FLOOR_PILOT_HREF}>
          Start Floor pilot <ChevronRight size={16} />
        </a>
        <p className="rd-migrate-compare">
          Comparing stacks? GlowUP. vs{' '}
          <a href="/compare/vagaro">Vagaro</a>,{' '}
          <a href="/compare/gloss-genius">Gloss Genius</a>, and{' '}
          <a href="/compare/fresha">Fresha</a>.
        </p>
      </section>

      <section className="rd-section" id="essentials">
        <div className="rd-section-head">
          <p className="rd-kicker">salon OS · product spine</p>
          <h2>
            Operating system
            <br />
            <em>for the floor.</em>
          </h2>
          <p>
            Native desk, live book, deposits. Glo chat books the multi-stylist calendar after hours. This pilot does
            not include POS, payroll, or a marketplace. Phone voice is coming.
          </p>
        </div>
        <ul className="rd-product-notes">
          {essentials.map((c) => (
            <li key={c.title}>
              <span className="rd-kicker">{c.cat}</span>
              <div>
                <h3>{c.title}</h3>
                <p>{c.copy}</p>
              </div>
              <span className={`rd-card-badge ${c.live ? 'live' : ''}`}>{c.badge}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rd-philosophy" id="product">
        <h2>one Salon OS for every chair</h2>
        <p>
          GlowUP. is built for owners who run floors — native Glo desk, the live multi-stylist book, and deposits on
          one OS. Five Floor pilots. $149 with 30 days on the house.
        </p>
        <a className="rd-btn-primary" href={FLOOR_PILOT_HREF}>
          Start Floor pilot <ChevronRight size={16} />
        </a>
      </section>

      {stories.map((s) => (
        <section key={s.title} className={`rd-story ${s.reverse ? 'reverse' : ''}`}>
          <div className="rd-story-media">
            <img src={s.img} alt="" />
          </div>
          <div className="rd-story-copy">
            <p className="rd-kicker">on the floor</p>
            <h3>{s.title}</h3>
            <p>{s.copy}</p>
            <a className="rd-btn-ghost" href={s.href}>
              {s.cta} <ChevronRight size={14} />
            </a>
          </div>
        </section>
      ))}

      <section className="rd-section" id="glo">
        <div className="rd-section-head">
          <p className="rd-kicker">flagship · glo</p>
          <h2>
            Meet Glo.
            <br />
            <em>AI chat front desk.</em>
          </h2>
          <p>
            Native to GlowUP. — not a bolt-on. Glo chat (beta) books the live book. Phone voice coming soon.
          </p>
        </div>
        <div className="rd-cta-row">
          <a className="rd-btn-primary" href={FLOOR_PILOT_HREF}>
            Start Floor pilot <ChevronRight size={16} />
          </a>
          <button
            type="button"
            className="rd-btn-ghost"
            onClick={() => document.querySelector<HTMLButtonElement>('.ai-rec-fab')?.click()}
          >
            Open Glo chat
          </button>
        </div>
      </section>

      <section className="rd-section" id="proof">
        <div className="rd-section-head">
          <p className="rd-kicker">Pilot metrics · this book</p>
          <h2>
            Proof from
            <br />
            <em>this browser’s book.</em>
          </h2>
        </div>
        <div className="rd-proof-grid">
          {proof ? (
            <>
              <div className="rd-proof">
                <strong>{proof.totalAiBooks}</strong>
                <span>AI books</span>
                <small>{proof.afterHoursAiBooks} after-hours</small>
              </div>
              <div className="rd-proof">
                <strong>{proof.depositRate}%</strong>
                <span>Deposit paid rate</span>
                <small>
                  {proof.depositPaid} paid
                </small>
              </div>
              <div className="rd-proof">
                <strong>{proof.leadsCaptured}</strong>
                <span>Leads captured</span>
                <small>{proof.leadsBooked} booked</small>
              </div>
              <div className="rd-proof">
                <strong>{proof.multiStylistDays}</strong>
                <span>Multi-stylist days</span>
                <small>{proof.confirmedAppointments} appointments</small>
              </div>
            </>
          ) : (
            <>
              <div className="rd-proof">
                <strong>24/7</strong>
                <span>Glo front desk</span>
                <small>Books while you process color</small>
              </div>
              <div className="rd-proof">
                <strong>1 OS</strong>
                <span>Solo → multi-loc</span>
                <small>No forced tool switch</small>
              </div>
              <div className="rd-proof">
                <strong>$149</strong>
                <span>Floor pilots</span>
                <small>30 days on the house</small>
              </div>
              <div className="rd-proof">
                <strong>Live</strong>
                <span>Calendar spine</span>
                <small>Multi-stylist real book</small>
              </div>
            </>
          )}
        </div>
      </section>

      <GapAuditForm />

      <section className="rd-section" id="pricing">
        <div className="rd-section-head">
          <p className="rd-kicker">transparent B2B packaging</p>
          <h2>
            Scale with the floor.
            <br />
            <em>AI included.</em>
          </h2>
          <p>Floor is $149 with 30 days on the house. Five Floor pilots — multi-stylist only.</p>
        </div>
        <div className="rd-price-grid">
          {PRICING_PLANS.map((plan) => (
            <article key={plan.id} className={`rd-price-card ${plan.highlighted ? 'featured' : ''}`}>
              {plan.highlighted && <span className="rd-price-badge">Most salons</span>}
              <p className="rd-kicker" style={{ margin: 0 }}>
                {plan.tagline}
              </p>
              <h3>{plan.name}</h3>
              <div className="rd-price-amount">
                {plan.priceLabel}
                <small> {plan.priceNote}</small>
              </div>
              <p className="rd-price-ai">{plan.aiAllowance}</p>
              <ul className="rd-price-list">
                {plan.includes.map((line) => (
                  <li key={line}>
                    <Check size={14} /> {line}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="rd-btn-primary"
                disabled={checkoutBusy === plan.id}
                onClick={() => void onSelectPlan(plan.id)}
              >
                {checkoutBusy === plan.id ? 'Opening…' : plan.cta} <ChevronRight size={14} />
              </button>
            </article>
          ))}
        </div>
        <div className="rd-notes">
          {checkoutMsg && <p style={{ color: 'var(--rd-rose)' }}>{checkoutMsg}</p>}
          <p>{AI_OVERAGE_NOTE}</p>
          <p>{PRICING_COMPARE}</p>
          <p>{ANNUAL_DISCOUNT}</p>
        </div>
      </section>

      <section className="rd-section" id="stories">
        <div className="rd-section-head">
          <p className="rd-kicker">built for the floor</p>
          <h2>
            What the book
            <br />
            <em>actually needs.</em>
          </h2>
        </div>
        <div className="rd-quotes">
          {floorNotes.map((q) => (
            <blockquote key={q.title} className="rd-quote">
              <p>{q.copy}</p>
              <footer>
                <strong>{q.title}</strong>
                <span>GlowUP. open beta</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="rd-section" id="faq">
        <div className="rd-section-head">
          <p className="rd-kicker">owners · questions</p>
          <h2>
            Straight answers
            <br />
            <em>before you start.</em>
          </h2>
          <p>Glo is native to GlowUP. Pricing is public. The book is live.</p>
        </div>
        <div className="rd-faq-list">
          {GLOWUP_FAQ.map((item) => (
            <details key={item.q} className="rd-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rd-final" id="contact">
        <h2>Ready for GlowUP.?</h2>
        <p>
          Five Floor pilots. $149 with 30 days on the house. Native desk, live book, deposits. Chat Glo is live; phone
          voice is coming.
        </p>
        <div className="rd-cta-row">
          <a className="rd-btn-primary" href={FLOOR_PILOT_HREF}>
            Start Floor pilot <ChevronRight size={16} />
          </a>
          <a className="rd-btn-ghost" href="#pricing">
            Compare plans
          </a>
        </div>
      </section>

      <footer className="rd-footer">
        <BrandLogo href="/" showSlogan />
        <nav className="rd-footer-nav">
          <a href="#essentials">Product</a>
          <a href="/for-floors">Multi-stylist</a>
          <a href="/for-solo">Solo / booth</a>
          <a href="#faq">FAQ</a>
          <a href="#migrate">Migrate</a>
          <a href="/compare/vagaro">vs Vagaro</a>
          <a href="/compare/gloss-genius">vs Gloss Genius</a>
          <a href="/compare/fresha">vs Fresha</a>
          <a href="#audit">Gap audit</a>
          <a
            href={FLOOR_PILOT_HREF}
            onClick={() => trackEvent('join_beta_click', { plan: 'floor', location: 'footer' })}
          >
            Start Floor pilot
          </a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <span className="rd-footer-copy">© 2026 GlowUP. · HTTPS secured · Open beta</span>
      </footer>

      <AiReceptionist />
    </main>
  )
}
