# Glo — Core Voice Agents (Launch Set)

**Locked from founder + advisor input (Selah Daniels framing):**  
Launch with **5 voice roles under one face: Glo**. Not 8+ differently named bots.

**xAI Realtime agent id (Console):** `00929ede-1eb1-4a74-9221-dd69617071f9`  
**Glo phone (voice):** `+1 (971) 476-1615` · E.164: `+19714761615`  
**WebSocket test:** `npm run glo:realtime` → `scripts/xai-realtime-glo.mjs`  
**Phone bridge:** `npm run glo:phone` → `scripts/glo-voice-phone-bridge.mjs`  
**Setup runbook:** `docs/GLO_PHONE_SETUP.md`

**Product brand:** GlowUP.  
**AI face:** **Glo** (roles, not separate personalities)  
**In-app:** never “Jaws agents.” Footer may say Built by JAWSAI911.

---

## Brand pattern

| Role name | What callers hear |
|-----------|-------------------|
| **Glo Reception** | Professional answer + route / never miss a call |
| **Glo Sales** | Qualify fit (Lead Qualification) |
| **Glo Scheduler** | Book / reschedule / confirm on the live calendar |
| **Glo Support** | FAQs, hours, pricing, common questions → escalate |
| **Glo Follow-Up** | Outbound: new leads, missed calls, re-engage |

One voice identity (**Glo**). Five skills. Owner still controls brand tone in settings.

---

## The five agents (detail)

### 1. Glo Sales — Lead Qualification (highest ROI)
- Answers inbound 24/7 when intent is “interested / pricing / is this for me?”
- Qualifying questions (service, timeline, budget band if appropriate, location, first-time vs rebook)
- Scores or tags fit → CRM lead status (`hot` / `warm` / `nurture` / `not_fit`)
- Hands hot leads to **Glo Scheduler** or owner SMS

### 2. Glo Scheduler — Appointment Booking
- Schedules, reschedules, confirms **on GlowUP. live calendar**
- Same rules as web AI Receptionist (duration, conflicts, client name/phone)
- Optional deposit CTA (Stripe Payment Link)
- Queues confirm SMS/email in Ops outbox

### 3. Glo Support — Customer Support
- Hours, services, pricing ranges, policies, parking, prep
- Escalates complex/complaint/medical edge cases to human
- Does **not** invent medical claims

### 4. Glo Follow-Up — Outbound Follow-Up
- Calls/SMS follow-up within minutes of new lead or missed inquiry
- Re-engages older CRM leads (slow days / win-back)
- Goal: more conversations that reach Scheduler

### 5. Glo Reception — Receptionist / Call Routing
- Answers every call professionally
- Routes: Sales · Scheduler · Support · human owner
- Safety net so no call is “dead air”

---

## Mapping to existing GlowUP. product

| Glo role | Current build | Next build |
|----------|---------------|------------|
| Scheduler | Web AI Receptionist + calendar spine | Voice channel → same calendar-store |
| Support | FAQ replies in chat | Shared knowledge base / salon settings |
| Sales | Partial (intent → book) | Qualification script + CRM lead fields |
| Follow-Up | Fill the Book / outbox concepts | Outbound dialer + sequences |
| Reception | Single chat agent | Intent router before specialized flows |

**Content agents** (Trend Scout, Chair Content, Shorts, etc.) stay under **Glow Concierge** — not voice launch.

## MCP tool access (authoritative live data)

All Glo roles (and the web receptionist) call **MCP tools** — not ad-hoc DB access.  
Contract: `docs/ARCHITECTURE_MCP.md` · façade: `src/lib/mcp-booking-crm.ts`

| Glo role | Tools |
|----------|--------|
| Reception | route; light `check_availability` |
| Sales | `search_clients`, `get_client_profile`, `log_interaction`, `update_client_notes` |
| Scheduler | `check_availability`, `book_appointment`, `reschedule_appointment`, `cancel_appointment`, `collect_deposit` |
| Support | `get_client_profile`, `search_clients`, salon policy resources |
| Follow-Up | `search_clients`, `get_client_profile`, `log_interaction`, soft availability |

---

## Pricing narrative ($300–$700+/mo)

Bundle for premium:

1. **Glo voice pack** (5 roles)  
2. **Website / landing** (GlowUP. marketing site or client SuperSite)  
3. **CRM + live calendar**  
4. **Lead capture + automation** (confirmations, follow-ups, ops sync)  

Wedge line: *“Glo answers while you’re with a client—and books into a real calendar.”*

---

## Launch order (ruthless)

1. **Glo Reception + Glo Support** (answer + FAQ)  
2. **Glo Scheduler** (book into live calendar — already web-proven)  
3. **Glo Sales** (qualify before book)  
4. **Glo Follow-Up** (outbound)  
5. Telephony provider + number + recording consent  

Do **not** sell all five as “fully autonomous” until Scheduler is reliable on voice.

---

## Success metrics

- % calls answered / missed  
- After-hours bookings attributed to Glo  
- Lead → booked rate (Sales → Scheduler)  
- Time-to-first-follow-up (Follow-Up)  
- Escalation rate (Support)

---

## Explicit non-goals (launch)

- Different character names per agent  
- Replacing human for complaints without escalate  
- Social auto-post as a “voice agent”  
- Bank/payouts as a Glo role  
