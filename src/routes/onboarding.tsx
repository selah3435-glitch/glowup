import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Check, Clock3, Scissors, Sparkles, Store, UsersRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { saveSalonContext, loadSalonContext } from '../lib/demo-salon'
import { pushToCloud, salonDeskUrl, setCloudIdentityMeta } from '../lib/cloud-sync'
import { ensureSalonSyncKey, loadOpsSettings, saveOpsSettings } from '../lib/ops-settings'
import { trackPlatformEvent } from '../lib/platform-client'
import { useIdentity } from '../lib/identity-context'
import { planFromTeamSize, PRICING_PLANS, type PlanId } from '../lib/pricing'
import { isOnboarded, loadPilotSession, markOnboarded, savePilotSession } from '../lib/pilot-session'
import { BrandLogo } from '../components/BrandLogo'

export const Route = createFileRoute('/onboarding')({ component: Onboarding })

const services = ['Haircuts & styling', 'Color services', 'Nails', 'Skin & facials', 'Lashes & brows', 'Massage & body']

function initialPlanFromUrl(): PlanId {
  if (typeof window === 'undefined') return 'floor'
  const p = new URLSearchParams(window.location.search).get('plan')
  if (p === 'solo' || p === 'floor' || p === 'brand') return p
  try {
    const stored = window.localStorage.getItem('glowup_selected_plan_v1')
    if (stored === 'solo' || stored === 'floor' || stored === 'brand') return stored
  } catch {
    /* ignore */
  }
  return 'floor'
}

function Onboarding() {
  const navigate = useNavigate()
  const { user, ready } = useIdentity()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlanFromUrl)
  const pilot = typeof window !== 'undefined' ? loadPilotSession() : null
  const existing = typeof window !== 'undefined' ? loadSalonContext() : null
  const [form, setForm] = useState({
    name: existing?.name && existing.name !== 'Lumen Collective' ? existing.name : '',
    businessType: 'Salon / multi-stylist',
    teamSize: '2–5 stylists',
    city: existing?.city && existing.city !== 'Los Angeles' ? existing.city : '',
    phone: '',
    services: existing?.services?.length ? existing.services : ['Haircuts & styling', 'Color services'],
    brandTone: existing?.brandTone || 'Soft & romantic',
    externalBookingUrl: existing?.externalBookingUrl || '',
  })
  const [startedTracked, setStartedTracked] = useState(false)
  const planMeta = PRICING_PLANS.find((p) => p.id === selectedPlan)

  // Returning pilots who finished setup go straight to dashboard (unless demo)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const demo = new URLSearchParams(window.location.search).get('demo') === '1'
    if (!demo && isOnboarded()) {
      void navigate({ to: '/dashboard' })
    }
  }, [navigate, ready])

  function toggleService(service: string) {
    setForm((current) => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter((item) => item !== service)
        : [...current.services, service],
    }))
  }

  function trackStartOnce() {
    if (startedTracked) return
    const email = user?.email || pilot?.email || window.localStorage.getItem('glowup_last_email')
    if (!email) return
    setStartedTracked(true)
    void trackPlatformEvent({
      email,
      name: form.name || pilot?.name || ((user as { userMetadata?: { full_name?: string }; user_metadata?: { full_name?: string } } | null)?.userMetadata?.full_name || (user as { user_metadata?: { full_name?: string } } | null)?.user_metadata?.full_name),
      identityUserId: user?.id,
      stage: 'onboarding_started',
      meta: { source: 'onboarding' },
    })
  }

  async function finish(event: FormEvent) {
    event.preventDefault()
    if (step < 3) {
      // Validate step 1 lightly
      if (step === 1) {
        if (form.name.trim().length < 2) {
          setNotice('Add your business name to continue.')
          return
        }
        if (form.city.trim().length < 2) {
          setNotice('Add your city so we can personalize the studio.')
          return
        }
        setNotice('')
      }
      if (step === 2 && form.services.length === 0) {
        setNotice('Pick at least one service.')
        return
      }
      trackStartOnce()
      setStep(step + 1)
      return
    }
    setSaving(true)
    setNotice('')
    const plan = selectedPlan || planFromTeamSize(form.teamSize)
    const salonName = form.name.trim() || 'My Studio'
    const city = form.city.trim() || 'Your city'

    // Always save locally first — never block the pilot
    try {
      saveSalonContext({
        name: salonName,
        brandTone: form.brandTone,
        city,
        services: form.services.length ? form.services : ['Haircuts & styling'],
        externalBookingUrl: form.externalBookingUrl,
        teamSize: form.teamSize,
      })
      window.localStorage.setItem('glowup_selected_plan_v1', plan)
      markOnboarded()
      const email =
        user?.email || pilot?.email || window.localStorage.getItem('glowup_last_email') || ''
      if (email) {
        savePilotSession({
          email,
          name: form.name || pilot?.name || '',
          mode: user ? 'identity' : pilot?.mode || 'guest',
          onboardedAt: new Date().toISOString(),
        })
      }
    } catch {
      /* storage full — still try to enter dashboard */
    }

    try {
      const key = ensureSalonSyncKey()
      const hours = 'Tue–Sat 9:00 AM – 5:00 PM'
      const services = form.services.length ? form.services : ['Haircuts & styling']
      const ownerEmail =
        user?.email || pilot?.email || window.localStorage.getItem('glowup_last_email') || ''
      if (ownerEmail || user?.id) {
        setCloudIdentityMeta({
          identityUserId: user?.id || '',
          email: ownerEmail,
        })
      }
      saveOpsSettings({
        studioName: salonName,
        city,
        hours,
        services,
        syncEnabled: true,
        ownerNotifyEmail: loadOpsSettings().ownerNotifyEmail || ownerEmail,
      })
      saveSalonContext({
        hours,
        externalBookingUrl: salonDeskUrl(key),
      })
      await pushToCloud()
    } catch {
      /* never block onboarding if cloud push fails */
    }

    // Best-effort cloud + analytics — never fail the funnel
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, name: salonName, city, plan }),
      })
      if (!response.ok && response.status !== 401) {
        setNotice('Saved on this device. Cloud sync will catch up when you’re signed in.')
      }
    } catch {
      /* offline ok */
    }

    const email = user?.email || pilot?.email || window.localStorage.getItem('glowup_last_email')
    if (email) {
      void trackPlatformEvent({
        email,
        name:
          salonName ||
          ((user as { userMetadata?: { full_name?: string }; user_metadata?: { full_name?: string } } | null)
            ?.userMetadata?.full_name ||
            (user as { user_metadata?: { full_name?: string } } | null)?.user_metadata?.full_name),
        identityUserId: user?.id,
        stage: 'onboarding_complete',
        meta: {
          salonName,
          businessType: form.businessType,
          teamSize: form.teamSize,
          city,
          plan,
        },
      })
    }

    await new Promise((resolve) => setTimeout(resolve, 400))
    await navigate({ to: '/dashboard' })
    setSaving(false)
  }

  return (
    <main className="onboarding-page rhode-public">
      <header>
        <BrandLogo href="/" compact />
        <span>
          Need a little help? <b>Glo AI</b>
        </span>
      </header>
      <div className="onboarding-shell">
        <aside>
          <div className="onboarding-intro"><div className="eyebrow light"><span /> Let’s make it yours</div><h1>A few details.<br /><em>One beautiful beginning.</em></h1><p>Your setup shapes everything from your booking page to the insights you see each morning.</p></div>
          <div className="setup-steps">
            {[['01', 'Your studio', 'The essentials'], ['02', 'Your services', 'What you create'], ['03', 'Your signature', 'Set the mood']].map(([number, title, copy], index) => (
              <div className={step === index + 1 ? 'active' : step > index + 1 ? 'done' : ''} key={number}><span>{step > index + 1 ? <Check size={15} /> : number}</span><div><strong>{title}</strong><small>{copy}</small></div></div>
            ))}
          </div>
          <div className="onboarding-note"><Sparkles size={18} /><p>“The details are not the details. They make the design.”<span>— Charles Eames</span></p></div>
        </aside>

        <section className="setup-panel">
          <div className="mobile-progress"><span>Step {step} of 3</span><div><i style={{ transform: `scaleX(${step / 3})` }} /></div></div>
          <form onSubmit={finish}>
            {step === 1 && (
              <div className="step-content">
                <span className="step-icon">
                  <Store size={22} />
                </span>
                <p className="step-number">01 — YOUR STUDIO</p>
                <h2>Tell us about your space.</h2>
                <p>We’ll personalize your calendar, CRM, and suggested plan (Solo / Floor / Brand).</p>
                <div className="form-grid">
                  <label className="full">
                    Business name
                    <input
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      placeholder="e.g. Lumen Collective"
                      required
                    />
                  </label>
                  <label>
                    Business type
                    <select
                      value={form.businessType}
                      onChange={(event) => setForm({ ...form, businessType: event.target.value })}
                    >
                      <option>Salon / multi-stylist</option>
                      <option>Multi-location group</option>
                      <option>Spa</option>
                      <option>Independent stylist</option>
                      <option>Beauty studio / suite</option>
                    </select>
                  </label>
                  <label>
                    Team size
                    <select
                      value={form.teamSize}
                      onChange={(event) => {
                        const teamSize = event.target.value
                        setForm({ ...form, teamSize })
                        setSelectedPlan(planFromTeamSize(teamSize))
                      }}
                    >
                      <option>Just me (single chair)</option>
                      <option>2–5 stylists</option>
                      <option>6–10 stylists</option>
                      <option>11+ / multi-location</option>
                    </select>
                  </label>
                  <label>
                    City
                    <input
                      value={form.city}
                      onChange={(event) => setForm({ ...form, city: event.target.value })}
                      placeholder="Los Angeles"
                      required
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                      placeholder="(310) 555-0147"
                    />
                  </label>
                  <label className="full">
                    Plan (continuous OS — change anytime)
                    <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value as PlanId)}>
                      {PRICING_PLANS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.priceLabel}/mo · {p.target}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {planMeta && (
                  <p className="muted-copy" style={{ marginTop: 12 }}>
                    <strong>{planMeta.name}</strong> includes {planMeta.aiAllowance.toLowerCase()}.{' '}
                    {planMeta.scaling}
                  </p>
                )}
              </div>
            )}

            {step === 2 && <div className="step-content"><span className="step-icon"><Scissors size={22} /></span><p className="step-number">02 — YOUR SERVICES</p><h2>What magic do you make?</h2><p>Select everything you offer. You can add pricing, timing, and team members later.</p><div className="choice-grid">{services.map((service) => <button type="button" className={form.services.includes(service) ? 'selected' : ''} onClick={() => toggleService(service)} key={service}><span>{form.services.includes(service) && <Check size={14} />}</span>{service}</button>)}</div><div className="smart-note"><Clock3 size={19} /><div><strong>We’ll help with timing</strong><p>GlowUP includes smart defaults for service duration and cleanup time.</p></div></div></div>}

            {step === 3 && (
              <div className="step-content">
                <span className="step-icon"><Sparkles size={22} /></span>
                <p className="step-number">03 — YOUR SIGNATURE</p>
                <h2>How should your brand feel?</h2>
                <p>Choose a starting mood. Add your external booking link so Glow Agents can CTA correctly.</p>
                <div className="tone-grid">
                  {[['Soft & romantic', 'rose'], ['Clean & editorial', 'ivory'], ['Warm & earthy', 'clay'], ['Bold & modern', 'ink']].map(([tone, color]) => (
                    <button type="button" key={tone} onClick={() => setForm({ ...form, brandTone: tone })} className={`${color} ${form.brandTone === tone ? 'selected' : ''}`}>
                      <i /><span>{tone}</span>{form.brandTone === tone && <Check size={15} />}
                    </button>
                  ))}
                </div>
                <label className="full booking-url-field" style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 18, fontSize: 10, fontWeight: 600 }}>
                  External booking URL (optional)
                  <input
                    type="url"
                    value={form.externalBookingUrl}
                    onChange={(event) => setForm({ ...form, externalBookingUrl: event.target.value })}
                    placeholder="https://your-booking-link.com"
                    style={{ height: 48, padding: '0 14px', border: '1px solid var(--line)', borderRadius: 2, background: 'var(--card)', color: 'var(--ink)' }}
                  />
                </label>
                <div className="launch-preview">
                  <UsersRound size={20} />
                  <div>
                    <strong>You’re almost glowing</strong>
                    <p>Dashboard, Glow Concierge, and Social are ready to preview.</p>
                  </div>
                </div>
                {notice && <div className="form-message">{notice}</div>}
              </div>
            )}

            <div className="setup-actions">{step > 1 ? <button type="button" className="button-back" onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button> : <span />}<button className="button button-dark" disabled={saving}>{saving ? 'Polishing your studio…' : step === 3 ? 'Open my studio' : 'Continue'}<ArrowRight size={17} /></button></div>
          </form>
        </section>
      </div>
    </main>
  )
}
