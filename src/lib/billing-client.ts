/** Client → Stripe Checkout for Solo/Floor */

import { BRAND_CONTACT_EMAIL, type PlanId } from './pricing'

export type CheckoutResult = {
  ok: boolean
  url?: string
  /** User-facing message only (never env/config internals) */
  error?: string
  brandContact?: string
  /** True when card checkout is unavailable — client should continue free setup */
  fallback?: boolean
  /** True for pilot / missing billing config (soft UX, not a Stripe API failure) */
  pilot?: boolean
}

/** Config / deploy gaps — never surface raw env names to end users */
const PILOT_ERROR_RE =
  /STRIPE_SECRET|not configured|Add STRIPE|Checkout API is offline|non-JSON|function not deployed|network|Failed to fetch|Load failed|checkout unavailable/i

function isPilotOrConfigError(text: string | undefined): boolean {
  if (!text) return true
  return PILOT_ERROR_RE.test(text)
}

/** Shorten real Stripe / API errors for UI (keep meaning, drop noise) */
function shortenStripeError(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= 120) return t
  return `${t.slice(0, 117)}…`
}

export function pilotCheckoutMessage(plan: PlanId): string {
  return `Card checkout opens soon — continuing free beta setup for ${plan}.`
}

export async function startCheckout(plan: PlanId, email?: string): Promise<CheckoutResult> {
  if (plan === 'brand') {
    return {
      ok: false,
      brandContact: BRAND_CONTACT_EMAIL,
      error: 'Brand is custom — contact sales',
    }
  }
  try {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        email,
        origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      }),
    })
    const raw = await res.text()
    let data: {
      ok?: boolean
      url?: string
      error?: string
      fallback?: boolean
      pilot?: boolean
      brandContact?: string
      message?: string
    } = {}
    try {
      data = JSON.parse(raw) as typeof data
    } catch {
      // SPA / Netlify HTML 404 when create-checkout function is missing
      return {
        ok: false,
        fallback: true,
        pilot: true,
      }
    }
    if (data.url) return { ok: true, url: data.url }

    const rawErr = data.error || data.message
    const pilot =
      data.pilot === true ||
      (data.fallback !== false && isPilotOrConfigError(rawErr))

    if (pilot) {
      return {
        ok: false,
        fallback: true,
        pilot: true,
        brandContact: data.brandContact,
      }
    }

    // Real Stripe / billing failure with key present — surface shortened error
    return {
      ok: false,
      error: rawErr ? shortenStripeError(rawErr) : 'Checkout unavailable',
      fallback: data.fallback ?? true,
      brandContact: data.brandContact,
    }
  } catch {
    return {
      ok: false,
      fallback: true,
      pilot: true,
    }
  }
}

export function brandMailto(): string {
  return `mailto:${BRAND_CONTACT_EMAIL}?subject=${encodeURIComponent('GlowUP Brand plan')}&body=${encodeURIComponent(
    'Hi — interested in GlowUP Brand (multi-location). Our locations / chairs:\n\n',
  )}`
}
