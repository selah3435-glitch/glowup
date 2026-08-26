/**
 * Consent-gated GA4 + Meta Pixel.
 * Set VITE_GA4_MEASUREMENT_ID (G-XXXX) and/or VITE_META_PIXEL_ID in Netlify build env.
 * Scripts only load after cookie consent (or if both IDs empty, tracking is a no-op).
 */

export type AnalyticsEvent =
  | 'sign_up_click'
  | 'book_demo_click'
  | 'start_checkout'
  | 'gap_audit_submit'
  | 'join_beta_click'
  | 'see_dashboard_click'
  | 'open_glo_chat'

const CONSENT_KEY = 'glowup_cookie_consent_v1'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

export function getGaId(): string {
  return (import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined)?.trim() || ''
}

export function getMetaPixelId(): string {
  return (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim() || ''
}

export function hasAnalyticsConfigured(): boolean {
  return Boolean(getGaId() || getMetaPixelId())
}

export type ConsentState = 'unknown' | 'accepted' | 'rejected'

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return 'unknown'
  try {
    const v = window.localStorage.getItem(CONSENT_KEY)
    if (v === 'accepted' || v === 'rejected') return v
  } catch {
    /* ignore */
  }
  return 'unknown'
}

export function setConsent(state: 'accepted' | 'rejected') {
  try {
    window.localStorage.setItem(CONSENT_KEY, state)
  } catch {
    /* ignore */
  }
  if (state === 'accepted') {
    initAnalytics()
  }
}

let inited = false

export function initAnalytics() {
  if (typeof window === 'undefined' || inited) return
  if (getConsent() !== 'accepted') return

  const ga = getGaId()
  const pixel = getMetaPixelId()
  if (!ga && !pixel) return
  inited = true

  if (ga) {
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
    window.gtag('js', new Date())
    window.gtag('config', ga, { anonymize_ip: true })
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`
    document.head.appendChild(s)
  }

  if (pixel) {
    // Meta Pixel bootstrap (queue until fbevents.js loads)
    type FbqFn = ((...args: unknown[]) => void) & {
      queue?: unknown[]
      loaded?: boolean
      version?: string
      push?: (...args: unknown[]) => void
    }
    if (!window.fbq) {
      const n: FbqFn = function (...args: unknown[]) {
        ;(n.queue = n.queue || []).push(args)
      }
      n.queue = []
      n.loaded = true
      n.version = '2.0'
      n.push = n
      window.fbq = n
      const t = document.createElement('script')
      t.async = true
      t.src = 'https://connect.facebook.net/en_US/fbevents.js'
      document.head.appendChild(t)
    }
    window.fbq?.('init', pixel)
    window.fbq?.('track', 'PageView')
  }
}

export function trackEvent(name: AnalyticsEvent, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return
  if (getConsent() !== 'accepted') return

  try {
    window.gtag?.('event', name, params || {})
  } catch {
    /* ignore */
  }
  try {
    // Map key CTAs to standard Meta events where sensible
    if (name === 'sign_up_click' || name === 'join_beta_click') {
      window.fbq?.('track', 'Lead', params || {})
    } else if (name === 'start_checkout') {
      window.fbq?.('track', 'InitiateCheckout', params || {})
    } else {
      window.fbq?.('trackCustom', name, params || {})
    }
  } catch {
    /* ignore */
  }
}
