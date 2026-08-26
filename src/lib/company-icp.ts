/**
 * Company-sale ICP for GlowUP. (salons we sell the OS to).
 * Score only public words / known chair counts. Never invent occupancy, budget, or engagement rates.
 */

export type IcpCategory = 'tech' | 'size' | 'trigger' | 'money'

export type IcpHit = {
  category: IcpCategory
  label: string
  points: number
}

export const COMPANY_ICP_LINE =
  'Salons with operational friction who already show budget and tech-readiness to upgrade — not a guest rebook.'

export const COMPANY_ICP_GUIDE: { category: IcpCategory; title: string; items: string[] }[] = [
  {
    category: 'tech',
    title: 'Tech infrastructure',
    items: [
      'Legacy / desktop salon software',
      'Pen-and-paper, phone-only, or DM-to-book',
      'Split stack (booking + SMS + books in different tools)',
      'Public Instagram or TikTok (online enough to run software)',
    ],
  },
  {
    category: 'size',
    title: 'Business size & model',
    items: [
      'Multi-chair or booth / suite rental',
      '2+ locations',
      'Team in the 5–20 stylist range (only if they say it)',
      'Boutique / high-end / color-bar branding',
    ],
  },
  {
    category: 'trigger',
    title: 'Behavioral triggers',
    items: [
      'Under new ownership',
      'Hiring stylists',
      'Public complaints about phones / hard to book',
      'Owners asking for software in comments or groups',
    ],
  },
  {
    category: 'money',
    title: 'Financial health (facts only)',
    items: [
      'They said waitlist / booked out — we do not invent utilization',
      'Memberships or packages on the listing',
      'Established year on the listing (open 1+ year)',
    ],
  },
]

type Rule = {
  category: IcpCategory
  label: string
  points: number
  test: (blob: string) => boolean
}

const RULES: Rule[] = [
  {
    category: 'tech',
    label: 'Manual / phone / DM book',
    points: 3,
    test: (b) =>
      /pen and paper|paper book|appointment book|walk[- ]?ins only|call to book|call (us )?to (book|schedule)|phone only|no online book|instagram only|dm to book|text to book|book via (ig|instagram|dm)/i.test(
        b,
      ),
  },
  {
    category: 'tech',
    label: 'Legacy / desktop salon software',
    points: 3,
    test: (b) =>
      /millennium|shortcuts salon|salon iris|on-premise|desktop software|legacy (salon )?software|not cloud/i.test(b),
  },
  {
    category: 'tech',
    label: 'Fragmented stack',
    points: 2,
    test: (b) => {
      const tools = b.match(
        /vagaro|fresha|gloss ?genius|styleseat|booksy|zenoti|mindbody|square(up)?|quickbooks|mailchimp|boulevard|mangomint/gi,
      )
      return (tools ? new Set(tools.map((t) => t.toLowerCase())).size : 0) >= 2
    },
  },
  {
    category: 'tech',
    label: 'Public Instagram / TikTok',
    points: 1,
    test: (b) => /instagram\.com|tiktok\.com|\big\b|tiktok/i.test(b),
  },
  {
    category: 'size',
    label: 'Booth / suite / chair rental',
    points: 3,
    test: (b) => /booth rent|suite rent|chair rental|rental studio|suite mate|independent suite/i.test(b),
  },
  {
    category: 'size',
    label: 'Multi-location floor',
    points: 4,
    test: (b) => /multi[- ]location|\d+\s*(locations?|branches|studios)|our locations/i.test(b),
  },
  {
    category: 'size',
    label: 'Boutique / high-end branding',
    points: 2,
    test: (b) => /boutique|luxury salon|editorial|high[- ]end|color bar|colour bar/i.test(b),
  },
  {
    category: 'trigger',
    label: 'Under new ownership',
    points: 4,
    test: (b) => /under new ownership|new owner|recently (took over|acquired|purchased)/i.test(b),
  },
  {
    category: 'trigger',
    label: 'Hiring stylists',
    points: 3,
    test: (b) => /now hiring|we'?re hiring|hiring stylists?|join our team|stylist wanted|booth renter wanted/i.test(b),
  },
  {
    category: 'trigger',
    label: 'Booking / phone complaints',
    points: 3,
    test: (b) =>
      /can'?t get through|never (answers|picks up)|hard to book|couldn'?t book|on hold|phone (rings|hold)|no one (picks|answers)/i.test(
        b,
      ),
  },
  {
    category: 'trigger',
    label: 'Shopping salon software',
    points: 4,
    test: (b) =>
      /looking for (a )?(booking|salon) (software|system|app)|recommend (vagaro|fresha|gloss)|switching from|replace (vagaro|fresha|square)/i.test(
        b,
      ),
  },
  {
    category: 'money',
    label: 'They said waitlist / booked out',
    points: 2,
    test: (b) => /fully booked|booked (out|solid)|wait[- ]?list/i.test(b),
  },
  {
    category: 'money',
    label: 'Memberships or packages',
    points: 2,
    test: (b) => /memberships?|loyalty program|service packages?|package deals?/i.test(b),
  },
]

function establishedYear(blob: string): number | null {
  const m = blob.match(/(?:since|est\.?|established)\s*(19\d{2}|20\d{2})/i)
  if (!m) return null
  const year = Number(m[1])
  return year >= 1900 && year <= new Date().getFullYear() ? year : null
}

function chairCount(raw?: string | number): number | null {
  if (raw == null || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

export function scoreCompanyIcp(input: { text?: string; chairs?: string | number }): {
  points: number
  hits: IcpHit[]
  signals: string[]
} {
  const blob = (input.text || '').replace(/\s+/g, ' ').trim()
  const hits: IcpHit[] = []

  for (const rule of RULES) {
    if (rule.test(blob)) hits.push({ category: rule.category, label: rule.label, points: rule.points })
  }

  const chairs = chairCount(input.chairs)
  if (chairs != null) {
    if (chairs >= 2) {
      hits.push({
        category: 'size',
        label: chairs >= 5 && chairs <= 20 ? `${chairs} chairs (floor / growing team)` : `${chairs} chairs`,
        points: chairs >= 5 && chairs <= 20 ? 3 : chairs >= 4 ? 2 : 1,
      })
    }
  } else if (/(?:team of |our team of |staff of )([5-9]|1[0-9]|20)\b/i.test(blob)) {
    hits.push({ category: 'size', label: 'Team size 5–20 in their copy', points: 3 })
  }

  const year = establishedYear(blob)
  if (year != null && new Date().getFullYear() - year >= 1) {
    hits.push({ category: 'money', label: `Established ${year} (1+ year on the listing)`, points: 1 })
  }

  const seen = new Set<string>()
  const unique = hits.filter((h) => {
    if (seen.has(h.label)) return false
    seen.add(h.label)
    return true
  })

  const points = unique.reduce((sum, h) => sum + h.points, 0)
  return {
    points,
    hits: unique,
    signals: unique.map((h) => h.label),
  }
}

export function icpBand(points: number): 'hot' | 'warm' | 'nurture' {
  if (points >= 8) return 'hot'
  if (points >= 4) return 'warm'
  return 'nurture'
}
