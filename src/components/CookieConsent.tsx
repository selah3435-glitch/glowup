import { useEffect, useState } from 'react'
import {
  getConsent,
  hasAnalyticsConfigured,
  initAnalytics,
  setConsent,
  type ConsentState,
} from '../lib/analytics'

/** GDPR/CCPA-style cookie banner — only shows if analytics IDs are configured */

export function CookieConsent() {
  const [consent, setLocal] = useState<ConsentState>('unknown')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const c = getConsent()
    setLocal(c)
    setReady(true)
    if (c === 'accepted') initAnalytics()
  }, [])

  if (!ready || !hasAnalyticsConfigured()) return null
  if (consent !== 'unknown') return null

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <p>
        We use cookies for analytics (Google Analytics / Meta Pixel) to understand product interest and improve
        GlowUP. Essential site functions work without them.{' '}
        <a href="/privacy">Privacy Policy</a>
      </p>
      <div className="cookie-banner-actions">
        <button
          type="button"
          className="cookie-btn secondary"
          onClick={() => {
            setConsent('rejected')
            setLocal('rejected')
          }}
        >
          Reject non-essential
        </button>
        <button
          type="button"
          className="cookie-btn primary"
          onClick={() => {
            setConsent('accepted')
            setLocal('accepted')
          }}
        >
          Accept analytics
        </button>
      </div>
    </div>
  )
}
