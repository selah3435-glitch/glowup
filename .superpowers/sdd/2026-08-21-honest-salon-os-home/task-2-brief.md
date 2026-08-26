# Task 2: ProofMetrics fields

**Files:**
- Modify: `src/lib/proof-metrics.ts` only

**Already done in Task 1:** `guestKey` and `returningPctFromVisits` exist and are exported. Tests pass via `npx tsx --test src/lib/proof-metrics.test.ts`.

**Interfaces:**
- Consumes: `returningPctFromVisits`, `guestKey`, `listAppointments(true)`, `listLeads()`
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
  const counts = new Map<string, number>()
  for (const a of confirmed) {
    const k = guestKey(a.clientPhone, a.clientName)
    if (!k) continue
    counts.set(k, (counts.get(k) || 0) + 1)
  }
  const guestCount = counts.size
  let returningGuestCount = 0
  for (const n of counts.values()) if (n >= 2) returningGuestCount += 1
```

Return those three fields on the object. Do not add a dollar field.

You may keep a small guestCounts map rather than duplicating returningPctFromVisits internals twice if you can derive returningGuestCount from the same map — YAGNI: matching the plan is enough. Do not change guestKey/returningPctFromVisits behavior.

- [ ] **Step 2: Typecheck**

```powershell
npx tsc --noEmit
```

Expected: no errors from `proof-metrics.ts`. If tsc fails on unrelated files, note it; your fields must still typecheck.

- [ ] **Step 3: Commit** SKIP — no git.

Do not edit dashboard.index.tsx. Do not invent occupancy or dollars.
