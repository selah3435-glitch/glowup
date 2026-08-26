# Task 3 Report: Owner home cards

**Status:** DONE  
**Commits:** none (no git)  
**Date:** 2026-08-21

## Summary

Owner home metric grid now uses live book + `computeProofMetrics()` + `listPendingDrafts()`. Fake `$2,840` / `78%` / `4.1%` / `Content ready` are gone. Welcome chip and social strip use pending draft counts. Banner states figures come from this studio’s book and leads.

## Files

| Action | Path |
|--------|------|
| Modified | `src/routes/dashboard.index.tsx` |

No other files. `HeroDashboardPreview.tsx` untouched.

## Implementation

### Imports and live values

- `computeProofMetrics` from `../lib/proof-metrics`
- `listPendingDrafts` from `../lib/draft-store`
- Removed unused `CircleDollarSign`
- After `todayMins`:
  - `proof` / `pendingDrafts` gated on `typeof window !== 'undefined'`
  - `returningLabel` = `${proof.returningPct}%` or `'—'`

### Welcome chip

`<small>` is now `{N} draft(s) waiting approval` or `No drafts waiting`.

### Metric grid (four cards)

1. **Today’s book** — live `todayCount` + minutes. If `todayCount === 0`, subline `No visits yet — share your Glo link.`
2. **Clients returning** — `returningLabel`, Heart icon. If `returningPct == null`, subline `Need 2+ guests on the book` (no fake delta / donut). If set, `${returningGuestCount} of ${guestCount} guests`.
3. **Glo books** — `proof.totalAiBooks` (else `0`), subline `{afterHoursAiBooks} after hours` or `From Glo chat on this book`.
4. **Leads** — `proof.leadsCaptured` (else `0`), subline `{leadsBooked} booked` or `From Glo and the desk`.

### Social strip

Inventory-alert (`Thu & Sat open — Trend Scout has fills`) only renders when `pendingDrafts > 0`, copy `{N} draft(s) waiting approval`, link `/dashboard/social`.

### Banner

```
Figures on this page come from this studio’s book and leads. No modeled revenue.
Cloud pull: Dashboard → Ops.
```

## Step 6 — Grep

```powershell
Select-String -Path src\routes\dashboard.index.tsx -Pattern '2840|78%|4.1%|Content ready'
```

Zero matches.

## Step 6 — Typecheck

```powershell
npx tsc --noEmit
```

Exit code `0` — no TypeScript errors (including `dashboard.index.tsx`).

## Step 7 — Commit

Skipped (per brief; no git).

## Scope checks

- [x] Only `src/routes/dashboard.index.tsx` modified
- [x] Copy and field names from the brief used verbatim
- [x] No occupancy or dollar fields invented on the four cards
- [x] `HeroDashboardPreview.tsx` not edited
- [x] No git init/commit

## Concerns

The sidebar **Revenue rhythm** week-card still shows sample `$12,480` / `12.4%` / `$10.2k` / `$2.2k`. Out of this task’s four-card + banner + social-strip scope; still modeled dollars on the same page.

Concierge aside still hardcodes `1 draft needs approval. 3 agents have ideas.` (welcome chip is live).
