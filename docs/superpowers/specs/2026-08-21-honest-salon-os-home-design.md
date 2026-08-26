# Honest salon OS home (slice 1)

**Status:** Approved (founder: “approve” / approach 1)  
**Date:** 2026-08-21  
**Approach:** 1 — Honest home + live floors only  
**Product:** GlowUP. tenant OS (not company Lead Scout, not voice Glo)

## Goal

An onboarded or signed-in salon owner sees only facts from their live book and CRM. No Maya/Jordan seed, no hardcoded `$2,840` / `78%` / fake agent counts. Glo chat still books. CALL GLO does not pretend the phone is live.

## Non-goals (later slices)

- Phone / voice bridge on `+17372324091`
- Resend email
- Postgres/Neon cutover
- Social auto-post
- Company WPB outreach
- Inventing revenue from assumed tickets
- Changing the marketing hero preview (`HeroDashboardPreview`) — it stays a labeled mock

## Current facts

- `computeProofMetrics()` already counts confirmed/completed visits, Glo books (`source === 'ai_receptionist'`), leads.
- Dashboard home **Today’s book** is already live (`listForDay` + `totalBookedMinutes`).
- **Today’s revenue**, **Clients returning**, **Content ready**, and “3 suggestions · 1 needs approval” are hardcoded.
- `seedDemoFloorIfEmpty()` skips when `isLiveSalonBook()`; `purgeDemoAppointmentsIfOnboarded()` already strips `demo-floor-*` / `demo-rebook-*` / `demo-winback-*` ids on read.
- CALL GLO chip already replies: “Phone voice is not live yet. Chat books the desk.”

## Behavior

### Who is a live floor

Same as `isLiveSalonBook()` today: onboarded flag, pilot session email/onboardedAt, ops identity email, or ops `lastSyncedAt`. Those floors never receive demo seed. On dashboard load, purge leftover demo appointment ids if any remain.

Unsigned browsers without those signals may still seed the sample floor (marketing “try the desk”). `?demo=1` onboarding stays demo.

### Owner home cards (four)

| Card | Source | Empty / insufficient |
|------|--------|----------------------|
| Today’s book | Confirmed visits today + minutes | `0` + “No visits yet — share your Glo link.” |
| Returning | Distinct guests (phone last 10 digits, else name) with **2+** confirmed/completed visits ÷ guests with **1+** visits | If fewer than **2** guests with any visit: **—** (not 0%, not 78%). No “+4.1% this month.” |
| Glo books | Confirmed/completed with `source === 'ai_receptionist'` | `0` |
| Leads | `listLeads()` length; subline = how many status `booked` | `0` |

Remove `$2,840`, spark bars tied to fake revenue, `78%` donut, “Content ready / 4 / 1 needs approval.”

Do **not** compute dollars. No ticket × visits.

### Welcome chip

Replace “3 suggestions · 1 needs approval” with a live count of concierge/social drafts pending approval if that store has a real list; otherwise “Glow Agents · no drafts waiting.” Never hardcode 3 and 1.

### Upcoming list

Already live. Keep. Empty copy already points at Glo / Calendar.

### CALL GLO

Keep chat-only. Do not add `tel:+17372324091` to the receptionist. Chip and FAQ stay: voice not live, chat books.

### Banners

`dashboard.index` banner today: “Revenue metrics still sample…” After this ships, change to a true line: calendar + Glo books are live on this device; cloud pull from Ops; revenue dollars not shown until priced services exist on the book.

Calendar/clients banners can stay operational (device vs cloud), not “sample metrics.”

## Data rules

- Counts use the same appointment list as Calendar (`listAppointments` / day lists), after demo purge.
- Returning never uses invented occupancy or a default percentage.
- Marketing homepage mock (`$2,840` in `HeroDashboardPreview`) is **out of scope** and must remain labeled as preview, not the owner home.

## Files

- `src/routes/dashboard.index.tsx` — cards, chip, banner
- `src/lib/proof-metrics.ts` — add `returningGuests` / `returningPct` (or `null` when < 2 guests)
- `src/lib/calendar-store.ts` — no behavior change unless purge is not hitting dashboard mount; call `purgeDemoAppointmentsIfOnboarded` from dashboard shell if needed
- `src/components/AiReceptionist.tsx` — no tel: on Call Glo (confirm only)
- `docs/superpowers/specs/2026-08-21-honest-salon-os-home-design.md` — this spec

## Success criteria

- [ ] Onboarded session: no `demo-floor-*` appointments; home has no `$2,840` or `78%`
- [ ] Empty live book: today’s count `0`, returning **—**, Glo books `0`, leads `0`, empty upcoming copy
- [ ] After a Glo book: today’s or upcoming list shows that visit; Glo books increments
- [ ] Guest with two completed visits by same phone: returning % is a real ratio
- [ ] Unsigned / not onboarded: sample floor may still seed
- [ ] Call Glo does not place a phone call
- [ ] No invented revenue or occupancy

## Verification

1. Private window, no onboarding: sample floor allowed.  
2. Onboarded dashboard: purge + honest cards.  
3. Book via tenant Glo link → refresh home → visit and Glo count match Calendar.  
4. Grep dashboard.index for `2840` and `78%` — zero hits.

## Out of this PR

Voice, Resend, Twilio inbound, auto-post, company leads Excel, Neon.
