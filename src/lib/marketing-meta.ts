/**
 * Shared document head for public marketing routes.
 * Canonical, Open Graph, and Twitter tags use the live domain.
 */
import { GLOWUP_SITE } from './glowup-schema'

export const FLOOR_PILOT_HREF = '/login?next=%2Fonboarding&plan=floor'

/** 1280×720 salon still — landscape share image, not the square logo. */
export const MARKETING_OG_IMAGE = `${GLOWUP_SITE}/hero-salon.jpg`

export function absoluteUrl(path: string) {
  if (path === '/' || path === '') return `${GLOWUP_SITE}/`
  return `${GLOWUP_SITE}${path.startsWith('/') ? path : `/${path}`}`
}

type JsonLd = Record<string, unknown>

export function marketingHead(opts: {
  title: string
  description: string
  path: string
  jsonLd?: JsonLd | JsonLd[]
}) {
  const url = absoluteUrl(opts.path)
  const meta: Array<Record<string, unknown>> = [
    { title: opts.title },
    { name: 'description', content: opts.description },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: opts.title },
    { property: 'og:description', content: opts.description },
    { property: 'og:url', content: url },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'GlowUP.' },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:image', content: MARKETING_OG_IMAGE },
    { property: 'og:image:width', content: '1280' },
    { property: 'og:image:height', content: '720' },
    { property: 'og:image:alt', content: 'GlowUP. salon operating system' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: opts.title },
    { name: 'twitter:description', content: opts.description },
    { name: 'twitter:image', content: MARKETING_OG_IMAGE },
  ]
  const blocks = opts.jsonLd ? (Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd]) : []
  for (const block of blocks) {
    meta.push({ 'script:ld+json': block })
  }
  return {
    meta,
    links: [{ rel: 'canonical', href: url }],
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqJsonLd(items: ReadonlyArray<{ q: string; a: string }>, id: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': id,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}
