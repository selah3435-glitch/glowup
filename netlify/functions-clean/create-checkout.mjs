/**
 * POST /api/billing/checkout
 * { plan: 'solo'|'floor', email?, successUrl?, cancelUrl? }
 * Creates Stripe Checkout Session (subscription + 14-day trial).
 * Brand plan is not checkout — contact sales.
 */

const PLANS = {
  solo: {
    name: 'GlowUP Solo',
    description: '1 calendar · CRM · Glo AI front desk (150 conversations/mo)',
    unit_amount: 3900,
  },
  floor: {
    name: 'GlowUP Floor',
    description: 'Multi-stylist calendar · full CRM · Glo AI (1000 conversations/mo)',
    unit_amount: 14900,
  },
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

function json(status, body) {
  return { statusCode: status, headers: cors(), body: JSON.stringify(body) }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' }
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' })

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  const plan = body.plan === 'solo' || body.plan === 'floor' ? body.plan : null
  if (!plan) {
    return json(400, {
      error: 'plan must be solo or floor',
      brandContact: 'aaron.jawsai@gmail.com',
      hint: 'Brand plan is custom — email sales',
    })
  }

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    // Pilot mode: never expose env var names to the browser; client shows soft UX
    return json(200, {
      ok: false,
      fallback: true,
      pilot: true,
    })
  }

  const catalog = PLANS[plan]
  const origin =
    body.origin ||
    event.headers.origin ||
    event.headers.Origin ||
    'https://glowupbeautysolutions.com'
  const successUrl =
    body.successUrl ||
    `${origin}/dashboard?checkout=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = body.cancelUrl || `${origin}/#pricing`

  const params = new URLSearchParams()
  params.set('mode', 'subscription')
  params.set('success_url', successUrl)
  params.set('cancel_url', cancelUrl)
  params.set('client_reference_id', String(body.email || plan).slice(0, 200))
  params.set('metadata[plan]', plan)
  params.set('metadata[product]', 'glowup')
  params.set('subscription_data[trial_period_days]', '14')
  params.set('subscription_data[metadata][plan]', plan)
  params.set('line_items[0][quantity]', '1')
  params.set('line_items[0][price_data][currency]', 'usd')
  params.set('line_items[0][price_data][unit_amount]', String(catalog.unit_amount))
  params.set('line_items[0][price_data][recurring][interval]', 'month')
  params.set('line_items[0][price_data][product_data][name]', catalog.name)
  params.set('line_items[0][price_data][product_data][description]', catalog.description)
  // SaaS / software subscription tax code (required when Managed Payments is on)
  params.set('line_items[0][price_data][product_data][tax_code]', 'txcd_10103001')
  // Prefer classic Checkout for GlowUP SaaS subscriptions (avoid Managed Payments product constraints)
  params.set('managed_payments[enabled]', 'false')
  if (body.email) params.set('customer_email', String(body.email).trim())
  // Do NOT set payment_method_types — dynamic payment methods (Stripe best practice)

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    const data = await res.json()
    if (!res.ok) {
      return json(200, {
        error: data.error?.message || `Stripe ${res.status}`,
        fallback: true,
      })
    }
    return json(200, {
      ok: true,
      url: data.url,
      sessionId: data.id,
      plan,
      trialDays: 14,
    })
  } catch (e) {
    return json(200, {
      error: e instanceof Error ? e.message : 'checkout failed',
      fallback: true,
    })
  }
}
