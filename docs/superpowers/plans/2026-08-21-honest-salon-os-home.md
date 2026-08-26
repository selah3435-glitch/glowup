# Honest salon OS home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Owner home shows only live book/CRM facts; onboarded floors never keep Maya/Jordan demo rows; CALL GLO stays chat-only.

**Architecture:** Extend `computeProofMetrics()` with a pure returning-% helper (null when fewer than 2 guests). Wire `dashboard.index.tsx` cards and the Glow Agents chip to those facts plus `listLeads()` / `listPendingDrafts()`. Keep demo seed only when `isLiveSalonBook()` is false. Do not invent dollars.

**Tech Stack:** Vite + React + TanStack Router; existing localStorage stores (`calendar-store`, `leads-store`, `draft-store`); Node built-in test runner for the pure helper.

## Global Constraints

- No invented occupancy, tickets, conversion, or revenue dollars
- Returning % is `null` (UI em dash) unless at least 2 distinct guests have 1+ confirmed/completed visits
- Guest key = last 10 digits of phone, else trimmed lowercase name
- Marketing `HeroDashboardPreview` mock is out of scope (must stay labeled preview)
- CALL GLO must not `tel:` `+17372324091`
- Skip `git commit` steps unless the founder asks to commit
- Spec: `docs/superpowers/specs/2026-08-21-honest-salon-os-home-design.md`

## File map

- Modify: `src/lib/proof-metrics.ts` — returning helper + fields on `ProofMetrics`
- Create: `src/lib/proof-metrics.test.ts` — Node test for returning helper
- Modify: `src/routes/dashboard.index.tsx` — four cards, welcome chip, banner, drop fake social-gap copy
- Modify: `src/routes/dashboard.tsx` — call `purgeDemoAppointmentsIfOnboarded` on mount
- Modify: `src/components/AiReceptionist.tsx` — only if Call Glo gains a `tel:` (it must not)

---

### Task 1: Returning % helper (pure)

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
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  if (counts.size < 2) return null
  let repeats = 0
  for (const n of counts.values()) if (n >= 2) repeats += 1
  return Math.round((repeats / counts.size) * 100)
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Same command as Step 2. Expected: PASS (4 tests).

- [ ] **Step 5: Commit** (skip unless founder asked)

```powershell
git add src/lib/proof-metrics.ts src/lib/proof-metrics.test.ts
git commit -m "feat: returning percent from live visits only"
```

---

### Task 2: ProofMetrics fields

**Files:**
- Modify: `src/lib/proof-metrics.ts`

**Interfaces:**
- Consumes: `returningPctFromVisits`, `listAppointments(true)`, `listLeads()`
- Produces: `ProofMetrics` also has `returningPct: number | null`, `returningGuestCount: number`, `guestCount: number`

- [ ] **Step 1: Extend the type and compute**

Add to `ProofMetrics`:

```ts
  returningPct: number | null
  returningGuestCount: number
  guestCount: number
```

Inside `computeProofMetrics`, after `confirmed` is built:

```ts
  const returningPct = returningPctFromVisits(confirmed)
  const guestKeys = new Set(
    confirmed.map((a) => guestKey(a.clientPhone, a.clientName)).filter(Boolean),
  )
  let returningGuestCount = 0
  {
    const counts = new Map<string, number>()
    for (const a of confirmed) {
      const k = guestKey(a.clientPhone, a.clientName)
      if (!k) continue
      counts.set(k, (counts.get(k) || 0) + 1)
    }
    for (const n of counts.values()) if (n >= 2) returningGuestCount += 1
  }
```

Return those three fields on the object. Do not add a dollar field.

- [ ] **Step 2: Typecheck**

```powershell
npx tsc --noEmit
```

Expected: no errors from `proof-metrics.ts`.

- [ ] **Step 3: Commit** (skip unless asked)

---

### Task 3: Owner home cards

**Files:**
- Modify: `src/routes/dashboard.index.tsx`

**Interfaces:**
- Consumes: `computeProofMetrics()`, `listPendingDrafts()` from `../lib/draft-store`, existing `todayCount` / `todayMins`
- Produces: four cards — Today’s book, Returning, Glo books, Leads; welcome chip from pending drafts; no `$2,840` / `78%` / `Content ready`

- [ ] **Step 1: Imports and live values**

Add imports:

```tsx
import { computeProofMetrics } from '../lib/proof-metrics'
import { listPendingDrafts } from '../lib/draft-store'
```

Inside `DashboardOverview` after `todayMins`:

```tsx
  const proof = typeof window !== 'undefined' ? computeProofMetrics() : null
  const pendingDrafts = typeof window !== 'undefined' ? listPendingDrafts().length : 0
  const returningLabel =
    proof && proof.returningPct != null ? `${proof.returningPct}%` : '—'
```

- [ ] **Step 2: Welcome chip**

Replace the hardcoded `<small>3 suggestions · 1 needs approval</small>` with:

```tsx
            <small>
              {pendingDrafts > 0
                ? `${pendingDrafts} draft${pendingDrafts === 1 ? '' : 's'} waiting approval`
                : 'No drafts waiting'}
            </small>
```

- [ ] **Step 3: Replace metric-grid**

Keep **Today’s book** article as-is (live count + minutes).

Replace **Today’s revenue** article with **Glo books**:

```tsx
        <article>
          <div>
            <span>Glo books</span>
            <Sparkles size={18} />
          </div>
          <strong>
            {proof ? proof.totalAiBooks : 0} <small>live</small>
          </strong>
          <p>
            {proof && proof.afterHoursAiBooks
              ? `${proof.afterHoursAiBooks} after hours`
              : 'From Glo chat on this book'}
          </p>
        </article>
```

Replace **Clients returning** `78%` / `+4.1%` / donut `78` with `returningLabel`. If `returningPct == null`, do not show a fake delta; subline: `Need 2+ guests on the book`. If set, subline: `${proof.returningGuestCount} of ${proof.guestCount} guests`.

Replace **Content ready** with **Leads**:

```tsx
        <article>
          <div>
            <span>Leads</span>
            <UserRound size={18} />
          </div>
          <strong>
            {proof ? proof.leadsCaptured : 0} <small>live</small>
          </strong>
          <p>
            {proof && proof.leadsBooked
              ? `${proof.leadsBooked} booked`
              : 'From Glo and the desk'}
          </p>
        </article>
```

Remove `CircleDollarSign` import if unused. Keep `Heart` on returning.

Empty today: if `todayCount === 0`, the upcoming empty copy already exists; under today’s book subline use `No visits yet — share your Glo link.` when `todayCount === 0`.

- [ ] **Step 4: Fake social-gap strip**

The aside block with `Thu & Sat open — Trend Scout has fills` is invented. Remove that `<section className="inventory-alert">` (Social gaps this week) or only render it if `pendingDrafts > 0` with copy `N drafts waiting approval` linking to `/dashboard/social`. Do not mention Thu/Sat unless computed from real drafts.

- [ ] **Step 5: Banner**

Replace the bottom banner text with:

```tsx
      <p className="demo-data-banner">
        Figures on this page come from this studio’s book and leads. No modeled revenue.
        Cloud pull: Dashboard → Ops.
      </p>
```

- [ ] **Step 6: Grep**

```powershell
Select-String -Path src\routes\dashboard.index.tsx -Pattern '2840|78%|4.1%|Content ready'
```

Expected: no matches.

- [ ] **Step 7: Commit** (skip unless asked)

---

### Task 4: Purge demo rows + Call Glo

**Files:**
- Modify: `src/routes/dashboard.tsx`
- Modify: `src/components/AiReceptionist.tsx` only if a `tel:` was added

**Interfaces:**
- Consumes: `purgeDemoAppointmentsIfOnboarded` from `../lib/calendar-store`
- Produces: dashboard shell calls purge on mount

- [ ] **Step 1: Dashboard shell**

In `src/routes/dashboard.tsx`, import `purgeDemoAppointmentsIfOnboarded` from `../lib/calendar-store`. In the existing `useEffect` that already runs when `gate === 'ok'` (or add one):

```tsx
  useEffect(() => {
    purgeDemoAppointmentsIfOnboarded()
  }, [gate])
```

`readAppts()` already purges; this makes dashboard entry explicit.

- [ ] **Step 2: Call Glo**

In `AiReceptionist.tsx`, the `Call Glo` chip must remain:

```tsx
    if (label === 'Call Glo') {
      pushBot('Phone voice is not live yet. Chat books the desk.', homeChips)
      return
    }
```

Do not add `window.location.href = 'tel:+17372324091'`.

```powershell
Select-String -Path src\components\AiReceptionist.tsx -Pattern 'tel:'
```

Expected: no `tel:` in that file.

- [ ] **Step 3: Commit** (skip unless asked)

---

### Task 5: Verify

**Files:** none new

- [ ] **Step 1: Typecheck**

```powershell
Set-Location E:\GlowUP-build\glowkiss-main
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 2: Unit tests**

```powershell
node --experimental-strip-types --test src/lib/proof-metrics.test.ts
```

Expected: all pass.

- [ ] **Step 3: Manual (operator)**

1. Onboarded dashboard: no Maya Chen / `$2,840` / `78%`.  
2. Empty book: today `0`, returning `—`, Glo `0`, leads `0`.  
3. Tenant Glo book → home Glo count and upcoming match Calendar.  
4. Unsigned window may still seed sample floor.  
5. Call Glo chip does not dial.

- [ ] **Step 4: Deploy** (when founder wants it live)

```powershell
Set-Location E:\GlowUP-build\glowkiss-main
$env:VITE_GA4_MEASUREMENT_ID = 'G-ZP4WJ2QXKZ'
npm run build
node E:\GlowUP-build\generate-html.mjs
powershell -File scripts\deploy-netlify-with-functions.ps1
```

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| Live home cards, no dollars | 3 |
| Returning null if < 2 guests | 1–2 |
| Glo books + leads | 2–3 |
| Welcome chip live drafts | 3 |
| Purge demo on live floor | 4 |
| CALL GLO no tel | 4 |
| Banner truth | 3 |
| Hero preview untouched | (no task — do not edit `HeroDashboardPreview.tsx`) |
| Verification grep 2840/78% | 3, 5 |
