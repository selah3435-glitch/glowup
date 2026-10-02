import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const sitemap = readFileSync(new URL('../../public/sitemap.xml', import.meta.url), 'utf8')
const compareSource = readFileSync(new URL('./compare-salons.ts', import.meta.url), 'utf8')
const metaSource = readFileSync(new URL('./marketing-meta.ts', import.meta.url), 'utf8')

function compareSlugs() {
  const block = compareSource.match(/export const COMPARE_SLUGS = \[([\s\S]*?)\] as const/)
  assert.ok(block, 'COMPARE_SLUGS block missing')
  return [...block[1].matchAll(/'([^']+)'/g)].map((hit) => hit[1])
}

test('sitemap lists every comparison and the AI receptionist page', () => {
  const slugs = compareSlugs()
  assert.ok(slugs.length >= 6)
  for (const slug of slugs) {
    assert.match(sitemap, new RegExp(`https://glowupbeautysolutions.com/compare/${slug}</loc>`))
  }
  assert.match(sitemap, /https:\/\/glowupbeautysolutions\.com\/ai-receptionist<\/loc>/)
  assert.doesNotMatch(sitemap, /\/dashboard/)
  assert.doesNotMatch(sitemap, /\/login/)
})

test('public head helper points shares at the live domain and landscape image', () => {
  const schema = readFileSync(new URL('./glowup-schema.ts', import.meta.url), 'utf8')
  assert.match(schema, /https:\/\/glowupbeautysolutions\.com/)
  assert.match(metaSource, /GLOWUP_SITE/)
  assert.match(metaSource, /hero-salon\.jpg/)
  assert.match(metaSource, /index, follow/)
  assert.match(metaSource, /rel: 'canonical'/)
})
