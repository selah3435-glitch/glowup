/**
 * GET /api/health — uptime monitors hit this.
 * Returns ok + build signals (no secrets).
 */

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'GET only' }),
    }
  }

  const body = {
    ok: true,
    service: 'glowup',
    ts: new Date().toISOString(),
    region: process.env.AWS_REGION || process.env.CONTEXT || 'unknown',
    hasXaiKey: Boolean(process.env.XAI_API_KEY),
    hasAlertWebhook: Boolean(process.env.OPS_ALERT_WEBHOOK),
    chat: '/api/glo/chat',
    platform: '/api/platform',
    ops: '/api/ops',
    sms: '/api/sms',
    email: '/api/email',
    copywriter: '/api/agents/copywriter',
    hasStripe: Boolean(process.env.STRIPE_SECRET_KEY),
    hasSerper: Boolean(process.env.SERPER_API_KEY || process.env.SERPER_KEY),
    hasScrapingBee: Boolean(process.env.SCRAPINGBEE_API_KEY),
    hasFirecrawl: Boolean(process.env.FIRECRAWL_API_KEY),
    hasApify: Boolean(process.env.APIFY_API_TOKEN),
    hasZernio: Boolean(process.env.ZERNIO_API_KEY),
    hasTwilio: Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        (process.env.TWILIO_FROM || process.env.TWILIO_PHONE_NUMBER) &&
        ((process.env.TWILIO_API_KEY_SID && process.env.TWILIO_API_KEY_SECRET) || process.env.TWILIO_AUTH_TOKEN),
    ),
    hasResend: Boolean(process.env.RESEND_API_KEY),
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  }
}
