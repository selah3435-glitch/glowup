# Task 1: Returning % helper (pure)

**Files:**
- Modify: `src/lib/proof-metrics.ts`
- Create: `src/lib/proof-metrics.test.ts`

**Interfaces:**
- Consumes: appointment-like `{ clientPhone?: string; clientName?: string; status?: string }`
- Produces:
  - `export function guestKey(phone: string | undefined, name: string | undefined): string`
  - `export function returningPctFromVisits(visits: { clientPhone?: string; clientName?: string; status?: string }[]): number | null`
  - `null` when distinct guests with status `confirmed` or `completed` is `< 2`
  - otherwise `Math.round((guestsWithTwoOrMore / guestsWithOneOrMore) * 100)`

- [ ] **Step 1: Write the failing test**

Create `src/lib/proof-metrics.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `E:\GlowUP-build\glowkiss-main`):

```powershell
node --experimental-strip-types --test src/lib/proof-metrics.test.ts
```

Expected: FAIL (exports missing). If Node rejects `--experimental-strip-types`, use `npx --yes tsx --test src/lib/proof-metrics.test.ts`.

- [ ] **Step 3: Write minimal implementation**

In `src/lib/proof-metrics.ts`, add **above** `computeProofMetrics`:

```ts
export function guestKey(phone: string | undefined, name: string | undefined): string {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  if (digits.length >= 7) return digits
  return String(name || '').trim().toLowerCase()
}

export function returningPctFromVisits(
  visits: { clientPhone?: string; clientName?: string; status?: string }[],
): number | null {
  const counts = new Map<string, number>()
  for (const v of visits) {
    if (v.status !== 'confirmed' && v.status !== 'completed') continue
    const key = guestKey(v.clientPhone, v.clientName)
    if (!key) continue
    counts.set(key, (counts.get(k) || 0) + 1)
  }
  if (counts.size < 2) return null
  let repeats = 0
  for (const n of counts.values()) if (n >= 2) repeats += 1
  return Math.round((repeats / counts.size) * 100)
}
```

WAIT — the Map set line must use `key` not `k`: `counts.set(key, (counts.get(key) || 0) + 1)`

- [ ] **Step 4: Run the tests and make sure they pass**

Same command as Step 2. Expected: PASS (5 tests).

- [ ] **Step 5: Commit** — SKIP. This repo has no git. Do not run git commit.

Do not invent occupancy. Do not add dollar/revenue fields. Do not change dashboard in this task.
