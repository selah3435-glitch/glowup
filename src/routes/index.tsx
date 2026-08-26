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

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: [
      { title: 'GlowUP. | The AI-Powered Salon Operating System (OS)' },
      {
        name: 'description',
        content:
          'Centralize booking, client CRM, and Glo AI after-hours chat. GlowUP. scales from solo independent stylists to high-volume multi-location salons. Join the open beta.',
      },
    ],
  }),
})

const TRIAL_HREF = '/login?next=%2Fonboarding'

const HERO_BG = '/hero-salon.jpg'

const essentials = [
  {
    cat: 'front desk',
    title: 'Glo AI',
    copy: 'Always-on receptionist that books the live multi-stylist calendar.',
    badge: 'Live',
    live: true,
    img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
  },
  {
    cat: 'book',
    title: 'Live calendar',
    copy: 'One book for every chair — no double-books, no sticky notes.',
    badge: 'Live',
    live: true,
    img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  },
  {
    cat: 'crm',
    title: 'Clients + formulas',
    copy: 'Preferences, visit history, and formulas for the whole floor.',
    badge: 'Live',
    live: true,
    img: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800&q=80',
  },
  {
    cat: 'money',
    title: 'Deposits',
    copy: 'Protect high-ticket services so cancels don’t empty the floor.',
    badge: 'Live',
    live: true,
    img: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80',
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
      setCheckoutMsg(`${r.error} — continuing free beta setup for ${planId}.`)
    } else {
      setCheckoutMsg(`Plan ${planId} saved — continue free beta setup.`)
    }
    // Brief beat so the friendly line is readable before free-setup redirect
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
          <a className="rd-nav-cta" href={TRIAL_HREF} onClick={() => trackEvent('join_beta_click', { location: 'nav' })}>
            Join the beta
          </a>
        </nav>
      </header>

      <section className="rd-hero rd-hero-product" id="home">
        <div className="rd-hero-media" aria-hidden>
          <img src={HERO_BG} alt="" />
          <div className="rd-hero-shade" />
        </div>
        <div className="rd-hero-copy">
          <p className="rd-kicker">For multi-stylist salon owners · Open beta Salon OS</p>
          <h1>
            Stop losing
            <br />
            <em>15–25% of inquiries.</em>
          </h1>
          <p className="rd-lede">
            GlowUP. is the <strong>Salon Operating System</strong> for owners who run floors: live multi-stylist
            calendar, Glo AI after-hours chat booking, CRM, and deposits. Capture more of the demand you already get —
            modeled lifts toward <strong>40%+</strong> inquiry→book — without buying twice the leads.
          </p>
          <div className="rd-cta-row">
            <a
              className="rd-btn-primary"
              href={`${TRIAL_HREF}&plan=floor`}
              onClick={() => trackEvent('join_beta_click', { plan: 'floor', location: 'hero' })}
            >
              Start floor pilot <ChevronRight size={16} />
            </a>
            <button
              type="button"
              className="rd-btn-ghost"
              onClick={() => {
                trackEvent('see_dashboard_click', { location: 'hero' })
                document.getElementById('hero-dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
            >
              See the owner dashboard
            </button>
          </div>
        </div>
        <div className="rd-hero-product-pane">
          <HeroDashboardPreview />
        </div>
      </section>

      <div className="rd-persona" id="persona">
        <a className="rd-persona-card primary" href={`${TRIAL_HREF}&plan=floor`}>
          <span className="rd-persona-tag">Primary buyer</span>
          <strong>I run a multi-stylist floor</strong>
          <p>Live calendar, Glo after-hours, CRM, deposits — one OS as you add chairs or locations.</p>
          <em>Floor / Brand pilot →</em>
        </a>
        <a className="rd-persona-card" href={`${TRIAL_HREF}&plan=solo`}>
          <span className="rd-persona-tag">Also supported</span>
          <strong>I’m solo / booth</strong>
          <p>Same continuous product — start Solo, grow into Floor without a forced re-platform.</p>
          <em>Solo pilot →</em>
        </a>
      </div>

      <div className="rd-strip">
        Open beta · Salon OS · Floor $149 · Brand $299+ · Solo $39 · Glo chat after hours · Voice coming soon
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
            Average salon booking rates sit at <strong>15–25%</strong>. Systems that reply instantly and keep
            the conversation going routinely push conversion into the <strong>40%+</strong> range.
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
            Local search drives the majority of new salon bookings for many owners (often{' '}
            <strong>70–80%</strong>). A stronger Google presence and clear service pages commonly increase new
            client inquiries by around <strong>40%</strong>, while optimized profiles can deliver up to{' '}
            <strong>5×</strong> more appointment requests than incomplete ones.
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
          <a className="rd-btn-primary" href={`${TRIAL_HREF}&plan=floor`}>
            Start floor pilot <ChevronRight size={16} />
          </a>
          <a className="rd-btn-ghost" href="#roi">
            Run ROI calculator
          </a>
        </div>
      </section>

      <section className="rd-migrate" id="migrate">
        <div className="rd-value-head">
          <p className="rd-kicker">migration · switch without panic</p>
          <h2>
            Leave Booksy / GlossGenius / Mindbody-class tools
            <br />
            <em>without losing the book.</em>
          </h2>
          <p>
            The biggest friction for software buyers is data loss. In open beta we run a <strong>guided import</strong>{' '}
            — export clients and history from your current system (CSV / spreadsheet), we map services and stylists
            onto the GlowUP. multi-stylist calendar, and you keep running while the spine settles.
          </p>
        </div>
        <div className="rd-migrate-steps">
          <article>
            <strong>01</strong>
            <h3>Export</h3>
            <p>Clients, services, and open appointments from your current tool.</p>
          </article>
          <article>
            <strong>02</strong>
            <h3>Map</h3>
            <p>We align chairs, stylists, and formulas to the live GlowUP. book.</p>
          </article>
          <article>
            <strong>03</strong>
            <h3>Go live</h3>
            <p>Glo chat + calendar online; you stop paying for a second stack when ready.</p>
          </article>
        </div>
        <a className="rd-btn-primary" href="#audit">
          Request guided migration / gap audit <ChevronRight size={16} />
        </a>
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
            Not a bloated suite — client retention infrastructure: front desk AI, live multi-stylist calendar, CRM,
            deposits. Continuous from booth to brand.
          </p>
        </div>
        <div className="rd-card-grid">
          {essentials.map((c) => (
            <article key={c.title} className="rd-card">
              <div className="rd-card-media">
                <img src={c.img} alt="" />
              </div>
              <div className="rd-card-body">
                <span className="rd-card-cat">{c.cat}</span>
                <h3>{c.title}</h3>
                <p>{c.copy}</p>
                <span className={`rd-card-badge ${c.live ? 'live' : ''}`}>{c.badge}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rd-philosophy" id="product">
        <h2>one Salon OS for every chair</h2>
        <p>
          GlowUP. is built for owners who scale — Glo on the desk, the live multi-stylist book, and CRM you run every
          day. Start Solo if you must. Grow Floor and Brand without a forced re-platform.
        </p>
        <a className="rd-btn-primary" href={`${TRIAL_HREF}&plan=floor`}>
          Open floor pilot <ChevronRight size={16} />
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
          <button
            type="button"
            className="rd-btn-primary"
            onClick={() => document.querySelector<HTMLButtonElement>('.ai-rec-fab')?.click()}
          >
            Open Glo chat <ChevronRight size={16} />
          </button>
          <a className="rd-btn-ghost" href={TRIAL_HREF}>
            Join the beta
          </a>
        </div>
      </section>

      <section className="rd-section" id="proof">
        <div className="rd-section-head">
          <p className="rd-kicker">rhode + you energy · real numbers</p>
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
                <strong>$39+</strong>
                <span>Transparent plans</span>
                <small>AI included</small>
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
          <p>Hybrid OS packaging for multi-stylist owners — not pure per-seat punishment. Solo available.</p>
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

      <section className="rd-final" id="contact">
        <h2>Ready for GlowUP.?</h2>
        <p>
          Beauty Business, Beautifully Done. Join the open beta, open Glo chat, and put after-hours bookings on your
          live calendar.
        </p>
        <div className="rd-cta-row">
          <a className="rd-btn-primary" href={TRIAL_HREF}>
            Join the beta · free setup <ChevronRight size={16} />
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
          <a href="#migrate">Migrate</a>
          <a href="#audit">Gap audit</a>
          <a
            href={TRIAL_HREF}
            onClick={() => trackEvent('join_beta_click', { location: 'footer' })}
          >
            Join the beta
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
