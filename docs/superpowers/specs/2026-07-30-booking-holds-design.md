# Booking Holds (AI Receptionist) — Design

**Date:** 2026-07-30  
**Status:** Approved for implementation  
**Slice:** Guided native hold via AI Receptionist + localStorage

## Decisions

| Topic | Choice |
|-------|--------|
| Outcome | Native hold in GlowUP.; optional external booking URL CTA |
| Persistence | Browser `localStorage` (`glowup_booking_holds_v1`) |
| Client surface | AI Receptionist chat only |
| Flow | Guided state machine (not free-form-only, not embedded form-first) |

## Architecture

```
Client (homepage FAB)
  → AiReceptionist state machine
  → booking-store (localStorage)
  → Dashboard Overview ("Booking holds")
```

## Data model

```ts
type BookingHold = {
  id: string
  createdAt: string
  status: 'held' | 'cancelled'
  service: string
  dateLabel: string
  dateISO: string
  time: string
  clientName: string
  clientPhone: string
  notes?: string
  source: 'ai_receptionist'
}
```

API: `listHolds()`, `addHold()`, `cancelHold()`, slot helpers.

## Services & slots

- Services: onboarding salon services merged with defaults (Cut & style, Balayage, Gloss, Facial).
- Openings: next 5 business days, fixed slot times; exclude times already `held`.

## Chat states

`idle` → `pick_service` → `pick_day` → `pick_time` → `pick_name` → `pick_phone` → `confirm` → `done`  
Also: `faq` for pricing/hours; Start over clears draft.

## Dashboard

- "Booking holds" panel: upcoming held items, cancel frees slot.
- Sample appointments remain labeled as sample/demo.

## Out of scope

DB/multi-device sync, staff assignment, payments, SMS/email, LLM intent, true reschedule engine.

## Success criteria

1. Full chat path creates a hold that survives refresh (same browser).  
2. Dashboard lists holds; cancel returns slot to chat.  
3. Double-book of same date+time prevented.  
4. External booking URL appears on confirm when set in salon context.
