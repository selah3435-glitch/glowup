import assert from 'node:assert/strict'
import test from 'node:test'
import { guestKey, returningPctFromVisits } from './proof-metrics.ts'

test('guestKey prefers last 10 phone digits', () => {
  assert.equal(guestKey('(561) 614-2649', 'Ada'), '5616142649')
})

test('guestKey falls back to name', () => {
  assert.equal(guestKey('', '  Maya Chen '), 'maya chen')
})

test('returningPct is null with 0 or 1 guest', () => {
  assert.equal(returningPctFromVisits([]), null)
  assert.equal(
    returningPctFromVisits([
      { clientPhone: '1111111111', clientName: 'A', status: 'confirmed' },
    ]),
    null,
  )
})

test('returningPct is a real ratio', () => {
  const visits = [
    { clientPhone: '1111111111', status: 'completed' },
    { clientPhone: '1111111111', status: 'confirmed' },
    { clientPhone: '2222222222', status: 'confirmed' },
  ]
  // 1 of 2 guests has 2+ visits → 50
  assert.equal(returningPctFromVisits(visits), 50)
})

test('ignores cancelled', () => {
  const visits = [
    { clientPhone: '1111111111', status: 'cancelled' },
    { clientPhone: '2222222222', status: 'confirmed' },
  ]
  assert.equal(returningPctFromVisits(visits), null)
})
