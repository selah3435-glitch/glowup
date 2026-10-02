/**
 * Prerender marketing HTML into dist/client so Git/Netlify static
 * publishes are not a 404 and vs pages are crawlable without JS.
 * `vite build` emits client assets + dist/server; only dist/client is published.
 */
import { pathToFileURL } from 'node:url'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const serverPath = join(root, 'dist/server/server.js')
const clientDir = join(root, 'dist/client')
const origin = 'https://glowupbeautysolutions.com'

const PAGES = [
  {
    path: '/',
    file: 'index.html',
    mustInclude: [
      'GlowUP',
      'What is GlowUP',
      'hero-answer',
      'native AI receptionist',
      'FAQPage',
      'application/ld+json',
      'Floor is $149/mo for a multi-stylist location, with 30 days on the house, then the card.',
    ],
    mustNotInclude: [],
  },
  {
    path: '/for-floors',
    file: 'for-floors/index.html',
    mustInclude: ['One calendar spine', 'Every chair. Every branch.'],
    mustNotInclude: ['rd-hero-product', 'FAQPage', 'What is GlowUP'],
  },
  {
    path: '/for-solo',
    file: 'for-solo/index.html',
    mustInclude: ['when the floor grows', 'Independent stylists'],
    mustNotInclude: ['rd-hero-product', 'FAQPage', 'What is GlowUP'],
  },
  {
    path: '/compare/vagaro',
    file: 'compare/vagaro/index.html',
    mustInclude: ['GlowUP. vs Vagaro', 'compare-answer', 'Who should pick GlowUP.', 'FAQPage'],
    mustNotInclude: ['rd-hero-product', 'What is GlowUP'],
  },
  {
    path: '/compare/gloss-genius',
    file: 'compare/gloss-genius/index.html',
    mustInclude: ['GlowUP. vs Gloss Genius', 'compare-answer', 'Who should pick GlowUP.', 'FAQPage'],
    mustNotInclude: ['rd-hero-product', 'What is GlowUP'],
  },
  {
    path: '/compare/fresha',
    file: 'compare/fresha/index.html',
    mustInclude: ['GlowUP. vs Fresha', 'compare-answer', 'Who should pick GlowUP.', 'FAQPage'],
    mustNotInclude: ['rd-hero-product', 'What is GlowUP'],
  },
  {
    path: '/privacy',
    file: 'privacy/index.html',
    mustInclude: ['Privacy Policy', 'Information we collect'],
    mustNotInclude: ['rd-hero-product'],
  },
  {
    path: '/terms',
    file: 'terms/index.html',
    mustInclude: ['Terms of Service', 'GlowUP.'],
    mustNotInclude: ['rd-hero-product'],
  },
]

if (!existsSync(serverPath)) {
  console.error('Missing dist/server/server.js — run vite build first')
  process.exit(1)
}

const mod = await import(pathToFileURL(serverPath).href)
const entry = mod.default ?? mod

if (typeof entry?.fetch !== 'function') {
  console.error('No fetch export on server entry', Object.keys(mod))
  process.exit(1)
}

async function prerender(page) {
  const res = await entry.fetch(new Request(`${origin}${page.path}`))
  const html = await res.text()
  console.log(page.path, 'status', res.status, 'html length', html.length)

  if (res.status !== 200 || !html || html.length < 100) {
    throw new Error(`Prerender failed for ${page.path} (status ${res.status})`)
  }

  for (const needle of page.mustInclude) {
    if (!html.includes(needle)) {
      throw new Error(`Prerender HTML for ${page.path} missing “${needle}”`)
    }
  }
  for (const needle of page.mustNotInclude) {
    if (html.includes(needle)) {
      throw new Error(`Prerender HTML for ${page.path} looks like the homepage (“${needle}”)`)
    }
  }

  const outPath = join(clientDir, page.file)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html, 'utf8')
  console.log('Wrote', outPath)
}

for (const page of PAGES) {
  await prerender(page)
}
