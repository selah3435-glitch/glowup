# Phase 2 — Glo AI (website differentiator)

**Goal:** Make AI the reason people choose GlowUP.  
**Slice 1 (this ship):** **Website chat = Glo AI lead capture** (+ keep booking).

## What visitors get in 5 seconds
1. Chat with **Glo** (not a generic form).  
2. Glo qualifies: interest → service → name → phone → email optional.  
3. Lead lands in owner **Leads** board + CRM.  
4. Or they **Book** straight onto the live calendar.

## Channels
| Channel | Phase 2 focus |
|---------|----------------|
| **Website chat** | Live xAI via `POST /api/glo/chat` + scripted chips fallback |
| Voice `+1 (971) 476-1615` | Bridge `npm run glo:phone` / `glo:server` + Console attach |
| SMS | Outbox already; auto later |

**Dual go-live runbook:** `docs/GLO_DUAL_CHANNEL.md`

## Glo roles in chat (v1 routing)
- **Sales** — “interested / price / new client” → qualify + capture lead  
- **Scheduler** — “book / appointment” → calendar flow  
- **Support** — hours / FAQ  
- **Reception** — opening menu + route chips  

## Success metrics
- Leads captured / week  
- Lead → booked rate  
- After-hours chat sessions  
