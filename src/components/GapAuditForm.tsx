import { useState, type FormEvent } from 'react'
import { ChevronRight } from 'lucide-react'
import { trackEvent } from '../lib/analytics'
import { trackPlatformEvent } from '../lib/platform-client'

const TRIAL_HREF = '/login?next=%2Fonboarding'

/** Micro-conversion: 5-minute salon gap audit lead capture */

export function GapAuditForm() {
  const [email, setEmail] = useState('')
  const [chairs, setChairs] = useState('4')
  const [missed, setMissed] = useState('10')
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const clean = email.trim().toLowerCase()
    if (!clean.includes('@')) {
      setStatus('err')
      return
    }
    setBusy(true)
    setStatus('idle')
    try {
      window.localStorage.setItem(
        'glowup_gap_audit_v1',
        JSON.stringify({ email: clean, chairs, missed, at: new Date().toISOString() }),
      )
      void trackPlatformEvent({
        email: clean,
        stage: 'signed_up',
        meta: { source: 'gap_audit', chairs, missedWeekly: missed },
      })
      trackEvent('gap_audit_submit', { chairs, missed })
      setStatus('ok')
    } catch {
      setStatus('err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rd-audit" id="audit">
      <div className="rd-audit-inner">
        <div className="rd-value-head">
          <p className="rd-kicker">micro-conversion · free</p>
          <h2>
            Free 5-minute
            <br />
            <em>salon gap audit.</em>
          </h2>
          <p>
            Busy owners don’t need a 45-minute demo first. Tell us chairs + weekly missed demand — we’ll frame where
            after-hours AI booking and a live multi-stylist book move the needle.
          </p>
        </div>

        {status === 'ok' ? (
          <div className="rd-audit-done">
            <p>
              <strong>Got it.</strong> You’re on the pilot list for a gap audit. Open free setup now so the calendar
              spine is ready when we follow up.
            </p>
            <a className="rd-btn-primary" href={TRIAL_HREF}>
              Join the beta · free setup <ChevronRight size={16} />
            </a>
          </div>
        ) : (
          <form className="rd-audit-form" onSubmit={(e) => void onSubmit(e)}>
            <label>
              Work email
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@yoursalon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Chairs / stylists on the floor
              <select value={chairs} onChange={(e) => setChairs(e.target.value)}>
                <option value="1">1 (solo)</option>
                <option value="2">2–3</option>
                <option value="4">4–6</option>
                <option value="8">7–10</option>
                <option value="12">11+ / multi-loc</option>
              </select>
            </label>
            <label>
              Missed / after-hours inquiries per week (estimate)
              <select value={missed} onChange={(e) => setMissed(e.target.value)}>
                <option value="3">Under 5</option>
                <option value="8">5–10</option>
                <option value="15">11–20</option>
                <option value="25">20+</option>
              </select>
            </label>
            {status === 'err' && <p className="rd-audit-err">Enter a valid email so we can follow up.</p>}
            <button type="submit" className="rd-btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Request free gap audit'} <ChevronRight size={16} />
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
