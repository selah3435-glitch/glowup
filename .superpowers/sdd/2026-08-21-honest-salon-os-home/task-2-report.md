# Task 2 Report: ProofMetrics fields

**Status:** DONE  
**Commits:** none (no git)  
**Date:** 2026-08-21

## Summary

Extended `ProofMetrics` and `computeProofMetrics` in `src/lib/proof-metrics.ts` with `returningPct`, `returningGuestCount`, and `guestCount`. No dashboard edits. No occupancy or dollar fields.

## Files

| Action | Path |
|--------|------|
| Modified | `src/lib/proof-metrics.ts` |

## Implementation

- Added to `ProofMetrics`: `returningPct: number | null`, `returningGuestCount: number`, `guestCount: number`.
- After `confirmed` is built in `computeProofMetrics`:
  - `returningPct = returningPctFromVisits(confirmed)`
  - Guest map via `guestKey(a.clientPhone, a.clientName)`; `guestCount = counts.size`; `returningGuestCount` = guests with `n >= 2`.
- Those three fields are returned on the metrics object.
- Did not change `guestKey` / `returningPctFromVisits` behavior.

## Step 2 — Typecheck

```powershell
npx tsc --noEmit
```

Exit code `0` — no TypeScript errors (including `proof-metrics.ts`).

## Step 3 — Commit

Skipped (per brief; no git).

## Scope checks

- [x] Only `src/lib/proof-metrics.ts` modified
- [x] No `dashboard.index.tsx` edits
- [x] No occupancy / dollar fields
- [x] No git init/commit

## Concerns

None.
