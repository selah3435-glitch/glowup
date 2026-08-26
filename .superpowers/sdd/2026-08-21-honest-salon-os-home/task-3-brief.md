# Task 3: Owner home cards

**Files:** Modify only `src/routes/dashboard.index.tsx`

**Consumes:** `computeProofMetrics()` from `../lib/proof-metrics` (now has returningPct, returningGuestCount, guestCount, totalAiBooks, afterHoursAiBooks, leadsCaptured, leadsBooked). `listPendingDrafts()` from `../lib/draft-store`. Existing todayCount / todayMins.

**Produces:** four cards — Today’s book, Returning, Glo books, Leads; welcome chip from pending drafts; no `$2,840` / `78%` / `Content ready`

Follow these steps exactly:

1. Add imports:
```tsx
import { computeProofMetrics } from '../lib/proof-metrics'
import { listPendingDrafts } from '../lib/draft-store'
```
After todayMins:
```tsx
  const proof = typeof window !== 'undefined' ? computeProofMetrics() : null
  const pendingDrafts = typeof window !== 'undefined' ? listPendingDrafts().length : 0
  const returningLabel =
    proof && proof.returningPct != null ? `${proof.returningPct}%` : '—'
```

2. Replace `<small>3 suggestions · 1 needs approval</small>` with:
```tsx
            <small>
              {pendingDrafts > 0
                ? `${pendingDrafts} draft${pendingDrafts === 1 ? '' : 's'} waiting approval`
                : 'No drafts waiting'}
            </small>
```

3. Metric grid:
- Keep Today’s book live count + minutes. If todayCount === 0, subline: `No visits yet — share your Glo link.`
- Replace Today’s revenue ($2,840) with Glo books:
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
- Replace Clients returning 78% / +4.1% / donut 78 with returningLabel. If returningPct == null, no fake delta; subline `Need 2+ guests on the book`. If set, subline `${proof.returningGuestCount} of ${proof.guestCount} guests`. Keep Heart icon.
- Replace Content ready with Leads:
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
- Remove CircleDollarSign import if unused.

4. Fake social-gap strip `Thu & Sat open — Trend Scout has fills`: remove that inventory-alert section OR only render if pendingDrafts > 0 with copy `N drafts waiting approval` linking to `/dashboard/social`. Do not mention Thu/Sat.

5. Banner replace with:
```tsx
      <p className="demo-data-banner">
        Figures on this page come from this studio’s book and leads. No modeled revenue.
        Cloud pull: Dashboard → Ops.
      </p>
```

6. Grep `src\routes\dashboard.index.tsx` for `2840|78%|4.1%|Content ready` — zero matches.

7. Skip git commit.

Do not invent occupancy or dollars. Do not edit HeroDashboardPreview.tsx.
