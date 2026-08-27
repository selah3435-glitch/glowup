import assert from 'node:assert/strict'
import test from 'node:test'
import { extractPublicPrices, isOwnSalon } from './competitor-prices.ts'

test('extractPublicPrices keeps service $ amounts', () => {
  const html = `
    <html><body>
      <p>Balayage from $250</p>
      <p>Women's cut $85</p>
      <p>Copyright 2024</p>
    </body></html>
  `
  const prices = extractPublicPrices(html)
  assert.ok(prices.some((p) => /250/.test(p)))
  assert.ok(prices.some((p) => /85/.test(p)))
})

test('extractPublicPrices skips tiny non-service dollars', () => {
  const html = '<p>Save $5 today</p><p>Shipping $3</p>'
  assert.deepEqual(extractPublicPrices(html), [])
})

test('extractPublicPrices returns empty when no dollars', () => {
  assert.deepEqual(extractPublicPrices('<p>Call for pricing</p>'), [])
})

test('isOwnSalon matches stripped names', () => {
  assert.equal(isOwnSalon('Lumen Collective Salon', 'Lumen Collective'), true)
  assert.equal(isOwnSalon('Noor Hair Bar', 'Lumen Collective'), false)
})
