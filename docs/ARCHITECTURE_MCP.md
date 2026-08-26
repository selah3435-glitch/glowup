# GlowUP. Architecture — MCP as first-class boundary

**Status:** Locked direction (2026-07-31)  
**Protocol posture:** MCP as the live-data boundary for agents (stateless core; tools/resources/prompts).  
**Product face:** **Glo** (5 voice roles) + web AI Receptionist call the same tools.

---

## 1. Boundary map

```
Channels (web chat · voice · SMS · future DM)
        │
        ▼
┌───────────────────────────────┐
│  Orchestrator (supervisor)    │  goal decompose · route · HITL · brand tone
│  LangGraph / equivalent later │  checkpoints (Postgres/Redis) — NOT in MCP
└───────────────┬───────────────┘
                │ MCP (discover + call tools/resources)
                ▼
┌───────────────────────────────┐
│  MCP Server: booking-crm      │  pure capabilities, no orchestration
│  (live calendar · CRM · pay)  │
└───────────────┬───────────────┘
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
 Calendar    Clients    Payments / notes
 (store)     (CRM)      (Stripe link · outbox)
```

| Layer | Owns | Does not own |
|-------|------|----------------|
| **Orchestrator** | Routing Glo roles, multi-step plans, reflection, human gates | Direct DB schemas, POS secrets in prompts |
| **MCP servers** | Typed tools/resources against live data | Conversation state, marketing copy generation |
| **Specialists** | Booking, Support, Sales, Follow-Up, Upsell (filtered tool sets) | Cross-salon admin |
| **Stores / DB** | Source of truth for appointments & clients | Agent personality |

**Rule:** Brittle custom connectors are forbidden for agent access. Agents only touch live data via MCP (or the in-process tool façade that becomes the MCP server).

---

## 2. MCP server surface — `glowup-booking-crm`

### 2.1 Tools (v1 ship set)

| Tool | Purpose | Glo roles |
|------|---------|-----------|
| `check_availability` | Free/busy + duration; ranked slots | Scheduler, Reception |
| `book_appointment` | Create booking; optional deposit flag | Scheduler, Sales→Scheduler |
| `reschedule_appointment` | Move with conflict checks | Scheduler |
| `cancel_appointment` | Cancel + free slot | Scheduler, Support |
| `get_client_profile` | History, notes, formulas, prefs | Sales, Support, Scheduler, Follow-Up |
| `search_clients` | Lookup / qualification | Sales, Follow-Up, Support |
| `update_client_notes` | Persistent memory | Sales, Support, Follow-Up |
| `log_interaction` | Structured interaction log | All |
| `collect_deposit` | Deposit request / payment link | Scheduler, Sales |
| `recommend_upsells` | *v1.1* history-grounded add-ons | Sales, Follow-Up |

### 2.2 Resources (read-only)

| URI | Content |
|-----|---------|
| `client://{id}/profile` | Core CRM record |
| `client://{id}/history` | Appointments |
| `client://{id}/preferences` | Formulas + prefs + notes |
| `salon://policies` | Hours, cancel policy, deposit rules (settings) |
| `salon://services` | Service catalog + durations |
| `stylist://default/availability` | v1 single-studio “Studio” stylist |

*Rooms/equipment, multi-stylist skills, photo refs: v1.1+ schema.*

### 2.3 Prompts (orchestrator-loadable)

- `post_service_care_plan`
- `vip_rebooking_sequence`
- `no_show_risk_outreach`
- `lead_qualification_script` (Glo Sales)
- `scheduler_confirm_script` (Glo Scheduler)

### 2.4 Stateless posture

- Every tool call is self-contained; conversation state lives in the orchestrator checkpointer.
- Future: protocol `_meta` (version + client capabilities) on the wire when MCP runtime is wired.
- Destructive tools (`cancel`, `collect_deposit`, book with deposit) prefer **confirm multi-round-trip** before commit.

---

## 3. Glo → MCP tool matrix

| Glo role | Primary tools |
|----------|----------------|
| **Reception** | route only → hand off; may `check_availability` lightly |
| **Sales** | `search_clients`, `get_client_profile`, `log_interaction`, `update_client_notes` → Scheduler |
| **Scheduler** | `check_availability`, `book_appointment`, `reschedule_*`, `cancel_*`, `collect_deposit` |
| **Support** | `get_client_profile`, `search_clients`, catalog/policies resources |
| **Follow-Up** | `search_clients`, `get_client_profile`, `log_interaction`, soft `check_availability` |

Web **AI Receptionist** today ≈ **Glo Scheduler + Support** tool set.

---

## 4. Data model (target)

- **Client** = aggregate root (phone unique-ish, formulas, prefs, LTV later).
- **Appointment** = booked time with service duration, payment status, source.
- **Availability** = derived from appointments + service duration (+ staff/rooms later).
- **Consent** required before photo/analysis resources.
- **Postgres** for multi-device production; **localStorage** is the current Phase 1 façade behind the same tool names.

---

## 5. Auth & tenancy

| Concern | Approach |
|---------|----------|
| Multi-tenant | `salon_id` / location on every tool (orchestrator injects) |
| Agent tokens | Scoped OAuth/OIDC later; Phase 1 salon sync key / owner session |
| PII tools | Audit log on profile + payment tools |
| Payments | Thin wrapper over Stripe Payment Link / future PaymentIntent |

---

## 6. Performance budgets (hot path)

| Call | Target |
|------|--------|
| `check_availability` | &lt; 300ms local; &lt; 800ms networked |
| `book_appointment` | &lt; 500ms local; &lt; 1.2s with deposit queue |
| Parallel | profile + availability safe to fan-out |

Cache service durations and salon settings; never cache free/busy longer than a few seconds.

---

## 7. Implementation phases

| Phase | Deliverable |
|-------|-------------|
| **P0 (now)** | In-process tool façade `src/lib/mcp-booking-crm.ts` matching tool names; agents call this |
| **P1** | HTTP/MCP server process wrapping same functions; web + voice share it |
| **P2** | LangGraph (or equiv) supervisor: triage → Scheduler specialist only |
| **P3** | Sales + Follow-Up specialists; upsell + visual analysis tools |
| **P4** | Human gates on deposits, out-of-policy cancel, marketing sends |

---

## 8. What not to do

- Put LangGraph state inside the MCP server  
- One mega-tool “do_everything”  
- Separate booking DB for voice vs web  
- Skip confirmations on payment mutations  

---

## 9. Code map (repo)

| Path | Role |
|------|------|
| `src/lib/mcp-booking-crm.ts` | Tool façade (authoritative names) |
| `src/lib/calendar-store.ts` | Appointments + availability |
| `src/lib/clients-store.ts` | CRM |
| `src/lib/payments.ts` | Deposits |
| `src/lib/notifications-store.ts` | Confirm / follow-up outbox |
| `src/lib/glo-voice-agents.ts` | Glo role catalog |
| `docs/GLO_VOICE_AGENTS.md` | Voice product lock |

---

## 10. Next practical step

1. Finish **P0** façade (this PR).  
2. Point **AI Receptionist** at `check_availability` / `book_appointment` (thin adapter).  
3. Stand up MCP server process when cloud host is ready (Railway/Node).  
4. Only then wire voice telephony into the same tools.
