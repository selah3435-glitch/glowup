# Task 1 Report: Returning % helper (pure)

**Status:** DONE  
**Commits:** none (no git)  
**Date:** 2026-08-21

## Summary

Added pure helpers `guestKey` and `returningPctFromVisits` to `src/lib/proof-metrics.ts`, plus `src/lib/proof-metrics.test.ts`. No dashboard or calendar-store changes. No revenue fields invented.

## Files

| Action | Path |
|--------|------|
| Modified | `src/lib/proof-metrics.ts` |
| Created | `src/lib/proof-metrics.test.ts` |

## Implementation

- `guestKey(phone, name)`: last 10 digits when phone has ≥10 digits; raw digits when ≥7; otherwise trimmed lowercase name.
- `returningPctFromVisits(visits)`: counts only `confirmed` / `completed`; returns `null` when distinct guests `< 2`; else `Math.round((guestsWithTwoOrMore / guestsWithOneOrMore) * 100)`.
- Map increment uses `counts.get(key)` (brief typo `counts.get(k)` corrected per instructions).

## TDD Evidence

### Step 1 — Write failing test

Created `src/lib/proof-metrics.test.ts` with the five cases from the brief (verbatim).

### Step 2 — RED

First attempt with Node strip-types failed on transitive ESM resolution of `calendar-store` (existing import in the module), not on missing exports:

```powershell
node --experimental-strip-types --test src/lib/proof-metrics.test.ts
```

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'E:\GlowUP-build\glowkiss-main\src\lib\calendar-store'
...
ℹ pass 0
ℹ fail 1
```

Fallback per brief (`tsx`):

```powershell
npx --yes tsx --test src/lib/proof-metrics.test.ts
```

```
SyntaxError: The requested module './proof-metrics.ts' does not provide an export named 'guestKey'
...
ℹ pass 0
ℹ fail 1
```

**RED confirmed** (exports missing).

### Step 3 — Implement

Added `guestKey` and `returningPctFromVisits` above `computeProofMetrics` in `src/lib/proof-metrics.ts`.

### Step 4 — GREEN

```powershell
npx --yes tsx --test src/lib/proof-metrics.test.ts
```

```
✔ guestKey prefers last 10 phone digits (2.4168ms)
✔ guestKey falls back to name (0.1972ms)
✔ returningPct is null with 0 or 1 guest (0.2129ms)
✔ returningPct is a real ratio (0.1394ms)
✔ ignores cancelled (0.6959ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ duration_ms 408.9665
```

**GREEN confirmed** (5/5 pass).

### Step 5 — Commit

Skipped (repo has no git; per brief).

## Scope checks

- [x] Pure helpers only
- [x] No dashboard wiring
- [x] No calendar-store changes
- [x] No occupancy / dollar / revenue fields
- [x] No git init/commit

## Concerns

- `node --experimental-strip-types --test` cannot load `proof-metrics.ts` because sibling imports omit `.ts` extensions; use `npx tsx --test` for this suite until those imports are extension-safe for bare Node ESM.
