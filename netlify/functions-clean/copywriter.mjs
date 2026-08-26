/**
 * Glow Agents Copywriter — standalone Netlify function.
 * Routed via _redirects: /api/agents/copywriter  /.netlify/functions/copywriter  200
 */

const SYSTEM = `You are an expert AI Marketing Director for premium beauty salons and spas. 
Your goal is to write high-converting, localized marketing messages that fill empty salon chairs.

CRITICAL TONE RULES:
1. Trendy & Warm: Use modern beauty terminology (e.g., "fresh color", "balayage refresh", "brow lamination", "self-care day").
2. Urgent but Elegant: Create FOMO (Fear Of Missing Out) without sounding cheap or spammy. Do NOT use multiple exclamation points (!!!) or all-caps text.
3. Concise: SMS messages MUST be under 160 characters. Email body text must be under 150 words.

BEAUTY INDUSTRY TERMINOLOGY TO EMBED (Use naturally based on service):
- Hair: "Root touch-up", "gloss treatment", "trim", "silk press".
- Nails: "Fresh set", "mani-pedi refresh", "gel manicure".
- Esthetics: "Glow-up", "skin hydration", "lash fill".

NEVER USE THESE CLICHÉ WORDS:
- "Hurry down", "Act fast", "Dear valued customer", "Revolutionary", "Unleash your beauty".

OUTPUT REQUIREMENT:
You must strictly return data in the requested JSON structure. No conversational text before or after the JSON.

You are also Fill the Book when the campaign is rebook, winback, or slow:
- Do not invent occupancy, tickets, or conversion rates.
- rebook: 8–14 weeks after color. Soft return.
- winback: 16+ weeks quiet. No required discount. No guilt.
- slow: name only the open chairs provided. Never invent a slot.
- SMS/email may use a first name. Social captions must not name a guest.
- If live book context has zero matching rows, say so. Do not fabricate a waitlist.

Return ONLY this JSON object:
{
  "sms": "string, max 160 characters, no links required",
  "email": {
    "subject": "string",
    "preview": "string, inbox preview",
    "body": "plain text, under 150 words"
  },
  "instagram": "feed/reel caption",
  "tiktok": "short caption",
  "facebook": "feed caption",
  "variants": ["social caption 1", "social caption 2", "social caption 3"]
}`

const CAMPAIGN_HINT = {
  rebook: 'Rebook clients 8–14 weeks after color. Soft return, not a hard sell.',
  winback: 'Win-back lapsed guests. Warm, editorial, never spammy.',
  launch: 'Spotlight a new or signature service. Clear booking CTA.',
  slow: 'Fill open chairs tomorrow without discounting the brand.',
  chair: 'From the chair: today’s service as a Reel/post pack.',
  trend: 'Trend-aware but calm. One angle, not hype.',
  general: 'Fill empty chairs with localized, premium copy.',
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

function clipSms(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  return clean.length <= 160 ? clean : `${clean.slice(0, 157).trimEnd()}…`
}

function parseCopyPack(raw) {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const obj = JSON.parse(raw.slice(start, end + 1))
    const email = obj.email || {}
    const instagram = String(obj.instagram || '').trim()
    const variants = (Array.isArray(obj.variants) ? obj.variants : [])
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .slice(0, 3)
    if (instagram && variants.length < 3) {
      while (variants.length < 3) variants.push(instagram)
    }
    if (!instagram && !variants.length) return null
    return {
      sms: clipSms(obj.sms || instagram),
      email: {
        subject: String(email.subject || instagram.slice(0, 70)),
        preview: String(email.preview || ''),
        body: String(email.body || instagram),
      },
      instagram: instagram || variants[0],
      tiktok: String(obj.tiktok || variants[0] || instagram),
      facebook: String(obj.facebook || instagram || variants[0]),
      variants,
    }
  } catch {
    return null
  }
}

function fallbackCopyPack(req) {
  const service = req.service || 'your next visit'
  const city = req.city ? ` in ${req.city}` : ''
  const name = req.salonName || 'the salon'
  const instagram = `${service} that still feels like you${city}. ${name} has a chair waiting when you are ready.`
  const tiktok = `${service}. Quiet glow, real chair time. Book when it fits.`
  const facebook = `Openings this week for ${String(service).toLowerCase()}. ${name} — come back when you are ready.`
  return {
    sms: clipSms(`${name}: a chair opened for ${String(service).toLowerCase()}. Reply and we will hold it.`),
    email: {
      subject: `Your ${String(service).toLowerCase()} window is open`,
      preview: `A chair at ${name} is waiting`,
      body: `Hi —\n\nIt has been a minute since your last ${String(service).toLowerCase()}. We saved space on the book${city} if you want a refresh.\n\nReply to this note or book when you are ready.\n\n${name}`,
    },
    instagram,
    tiktok,
    facebook,
    variants: [instagram, tiktok, facebook],
  }
}

function userPrompt(req) {
  const campaign = req.campaign || 'general'
  return [
    `Salon: ${req.salonName}`,
    req.city ? `City: ${req.city}` : '',
    req.brandTone ? `Brand tone: ${req.brandTone}` : '',
    req.service ? `Lead service: ${req.service}` : '',
    `Campaign: ${campaign} — ${CAMPAIGN_HINT[campaign] || CAMPAIGN_HINT.general}`,
    req.extra ? `Extra context: ${req.extra}` : '',
    'Write SMS, email, and social captions that fill chairs for this floor.',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'POST only' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const req = {
    salonName: String(body.salonName || 'the salon').trim(),
    city: body.city ? String(body.city).trim() : '',
    brandTone: body.brandTone ? String(body.brandTone).trim() : '',
    service: body.service ? String(body.service).trim() : '',
    campaign: body.campaign,
    extra: body.extra ? String(body.extra).trim() : '',
  }

  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ pack: fallbackCopyPack(req), fallback: true, error: 'XAI_API_KEY not configured' }),
    }
  }

  const model = process.env.XAI_CHAT_MODEL || 'grok-3-latest'
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userPrompt(req) },
        ],
      }),
    })
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 400)
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({ pack: fallbackCopyPack(req), fallback: true, error: `xAI ${res.status}`, detail }),
      }
    }
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content?.trim() || ''
    const parsed = parseCopyPack(raw)
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        pack: parsed || fallbackCopyPack(req),
        fallback: !parsed,
        model,
        agent: 'copywriter',
      }),
    }
  } catch (e) {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        pack: fallbackCopyPack(req),
        fallback: true,
        error: e instanceof Error ? e.message : 'copywriter failed',
      }),
    }
  }
}
