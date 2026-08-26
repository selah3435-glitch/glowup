import { SALON_COPYWRITER_PROMPT } from './prompts/copywriter'
import { FILL_THE_BOOK_PROMPT } from './prompts/fill-the-book'
import { CHAIR_CONTENT_PROMPT } from './prompts/chair-content'
import { REPUTATION_PROMPT } from './prompts/reputation'
import { FRONT_DESK_PROMPT } from './prompts/front-desk'
import { BOOK_CLOSER_PROMPT } from './prompts/book-closer'
import { TREND_SCOUT_PROMPT } from './prompts/trend-scout'
import { SHORTS_PROMPT } from './prompts/shorts'
import { RETAIL_SERVICES_PROMPT } from './prompts/retail'
import { COMPETITOR_PROMPT } from './prompts/competitor'
import { LEAD_SCOUT_PROMPT } from './prompts/lead-scout'
import { LOCAL_SEO_PROMPT } from './prompts/seo'
import { COMPANY_LEAD_PROMPT } from './prompts/company-lead'

export type CopyChannel = 'sms' | 'email' | 'instagram' | 'tiktok' | 'facebook'

export type CopyCampaign =
  | 'rebook'
  | 'winback'
  | 'launch'
  | 'slow'
  | 'chair'
  | 'reputation'
  | 'front_desk'
  | 'book_closer'
  | 'trend'
  | 'shorts'
  | 'competitor'
  | 'lead_scout'
  | 'seo'
  | 'company_lead'
  | 'general'

export interface CopywriterRequest {
  salonName: string
  city?: string
  brandTone?: string
  service?: string
  campaign?: CopyCampaign
  extra?: string
}

export interface CopyPack {
  sms: string
  email: { subject: string; preview: string; body: string }
  instagram: string
  tiktok: string
  facebook: string
  variants: string[]
}

export const COPY_JSON_SHAPE = `Return ONLY this JSON object:
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

const FILL_CAMPAIGNS: CopyCampaign[] = ['rebook', 'winback', 'slow']

export function copywriterSystemPrompt(campaign?: CopyCampaign): string {
  const extras: string[] = []
  if (campaign && FILL_CAMPAIGNS.includes(campaign)) extras.push(FILL_THE_BOOK_PROMPT.trim())
  if (campaign === 'chair') extras.push(CHAIR_CONTENT_PROMPT.trim())
  if (campaign === 'reputation') extras.push(REPUTATION_PROMPT.trim())
  if (campaign === 'front_desk') extras.push(FRONT_DESK_PROMPT.trim())
  if (campaign === 'book_closer') extras.push(BOOK_CLOSER_PROMPT.trim())
  if (campaign === 'trend') extras.push(TREND_SCOUT_PROMPT.trim())
  if (campaign === 'shorts') extras.push(SHORTS_PROMPT.trim())
  if (campaign === 'launch') extras.push(RETAIL_SERVICES_PROMPT.trim())
  if (campaign === 'competitor') extras.push(COMPETITOR_PROMPT.trim())
  if (campaign === 'lead_scout') extras.push(LEAD_SCOUT_PROMPT.trim())
  if (campaign === 'seo') extras.push(LOCAL_SEO_PROMPT.trim())
  if (campaign === 'company_lead') extras.push(COMPANY_LEAD_PROMPT.trim())
  const extra = extras.length ? `\n\n${extras.join('\n\n')}` : ''
  return `${SALON_COPYWRITER_PROMPT.trim()}${extra}\n\n${COPY_JSON_SHAPE}`
}

const CAMPAIGN_HINT: Record<CopyCampaign, string> = {
  rebook: 'Rebook clients 8–14 weeks after color. Soft return, not a hard sell.',
  winback: 'Win-back lapsed guests. Warm, editorial, never spammy.',
  launch: 'Spotlight one real menu item. No invented price or scarcity.',
  slow: 'Fill open chairs tomorrow without discounting the brand.',
  chair: 'From the chair: today’s service as a Reel/post pack.',
  reputation: 'Post-visit thank-you and review ask. SMS first. No invented link.',
  front_desk: 'Reply to one comment or DM in the salon voice. Do not invent hours or prices.',
  book_closer: 'Turn a high-intent comment or DM into one booking ask. Use the real booking URL only.',
  trend: 'One grounded weekly angle from menu, season, and the live book. No fake rankings.',
  shorts: 'Three spoken hooks plus a Reel/TikTok caption for one real service.',
  competitor: 'Internal brief + positioning from owner notes only. No invented rival stats.',
  lead_scout: 'Outreach for one ranked CRM or book row. Fact-points, not a fake percent.',
  seo: 'Title, meta, and GBP post from name, city, and menu. No invented rankings.',
  company_lead: 'B2B outreach to a salon about GlowUP the OS. Not a guest rebook.',
  general: 'Fill empty chairs with localized, premium copy.',
}

export function buildCopywriterUserPrompt(req: CopywriterRequest): string {
  const campaign = req.campaign || 'general'
  return [
    `Salon: ${req.salonName}`,
    req.city ? `City: ${req.city}` : '',
    req.brandTone ? `Brand tone: ${req.brandTone}` : '',
    req.service ? `Lead service: ${req.service}` : '',
    `Campaign: ${campaign} — ${CAMPAIGN_HINT[campaign]}`,
    req.extra ? `Extra context: ${req.extra}` : '',
    'Write SMS, email, and social captions that fill chairs for this floor.',
  ]
    .filter(Boolean)
    .join('\n')
}

function clipSms(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= 160 ? clean : clean.slice(0, 157).trimEnd() + '…'
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

export function parseCopyPack(raw: string): CopyPack | null {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const obj = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>
    const email = (obj.email || {}) as Record<string, unknown>
    const variantsRaw = Array.isArray(obj.variants) ? obj.variants : []
    const instagram = asString(obj.instagram)
    const variants = variantsRaw
      .map((v) => asString(v))
      .filter(Boolean)
      .slice(0, 3)
    if (instagram && variants.length < 3) {
      while (variants.length < 3) variants.push(instagram)
    }
    if (!instagram && !variants.length) return null
    return {
      sms: clipSms(asString(obj.sms) || instagram),
      email: {
        subject: asString(email.subject) || instagram.slice(0, 70),
        preview: asString(email.preview),
        body: asString(email.body) || instagram,
      },
      instagram: instagram || variants[0],
      tiktok: asString(obj.tiktok) || variants[0] || instagram,
      facebook: asString(obj.facebook) || instagram || variants[0],
      variants,
    }
  } catch {
    return null
  }
}

export function fallbackCopyPack(req: CopywriterRequest): CopyPack {
  const service = req.service || 'your next visit'
  const city = req.city ? ` in ${req.city}` : ''
  const name = req.salonName
  const instagram = `${service} that still feels like you${city}. ${name} — book when it fits.`
  const tiktok = `${service}. Quiet glow, real chair time. Book when it fits.`
  const facebook = `${service} at ${name}${city}. Reply when you want to come in.`
  return {
    sms: clipSms(`${name}: ready when you are for ${service.toLowerCase()}. Reply to hold a time.`),
    email: {
      subject: `When you want your next ${service.toLowerCase()}`,
      preview: `${name} is here when you are ready`,
      body: `Hi —\n\nIt has been a minute since your last ${service.toLowerCase()}${city}. Reply if you want a time on the book.\n\n${name}`,
    },
    instagram,
    tiktok,
    facebook,
    variants: [instagram, tiktok, facebook],
  }
}
