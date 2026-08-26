# PRODUCT.md â€” GlowUP.

## Register

**product** (app UI serves the tool) + **brand** surfaces for marketing site.

## Brand

- **Wordmark:** `GlowUP.` (period is part of the logo â€” always include it)
- **Slogan:** Beauty Business, Beautifully Done.

## Product purpose

GlowUP. is a multi-tenant **salon operating system**. **Flagship:** AI Receptionist / **Glo** (book/reschedule/FAQ 24/7). Also CRM, booking, marketing, reviews, analytics, Glow Agents + Glow Concierge.

**Goal:** Fully functional SaaS competitive with Gloss Genius, Mangomint, and Vagaro — strongest on AI front desk + calm premium UX.

## Who we serve (scale — not a niche brand)

**GlowUP. is not a solo-only product.** One brand, one OS, three sizes:

| Scale | Who | What they get |
|---|---|---|
| **Single stylist** | Booth, suite, independent | Glo 24/7 desk, live book, CRM without hiring front desk |
| **Multi-stylist floor** | 2–20+ chairs | Shared multi-stylist calendar, staff, approvals, floor CRM |
| **Multi-location** | Groups / multi-site brands | Same OS across locations — book, CRM, Glo, growth under one brand |

Go-to-market may *start* with fast solo wins; **positioning and product always say we grow with the floor.** Never lead the brand as “only 1–2 stylist shops.”

**Public line:** *One chair or multi-location floors — same GlowUP. OS, same Glo front desk.*

## Pricing (public — continuous OS, hybrid AI)

Source of truth: `src/lib/pricing.ts` · landing `#pricing`

| Plan | Target | Monthly | AI included |
|------|--------|---------|-------------|
| **Solo** | 1 stylist / booth | **$39** | ~150 Glo conversations |
| **Floor** | Multi-stylist, 1 location | **$149** | ~1,000 Glo conversations |
| **Brand** | 2+ locations | **$299+/location** or custom | High / volume |

- **Not** pure per-seat (punishes adding chairs).  
- **Not** fake unlimited AI (protects margin).  
- **Included AI** in every paid tier so the differentiator is felt immediately.  
- Overage packs when usage exceeds included; voice telephony may use a separate allowance.  
- Annual ~15% when checkout ships.  
- **Sales line:** One OS vs booking tool + separate AI receptionist ($49–200+/mo).

## Competitive posture (honest)

**Win on:** Native Glo AI into live multi-stylist calendar; continuous solo → multi-loc story; salon-floor language.  
**Catch up on:** Inventory/payroll depth, marketplace discovery, consumer apps, years of edge-case trust — labeled Roadmap, not faked live.

## Users

| Role | Needs |
|---|---|
| Owner | Full control, approvals, brand, booking URL, Concierge, multi-location view |
| Manager | Approvals, schedule, campaigns (not billing transfer) |
| Stylist | Own chair book; draft content; submit for approval |
| Front desk | View full floor schedule; limited drafts if granted |
| Client (public) | Book via external URL / native booking; trust |

## Brand relationship

- **Product brand:** GlowUP / GlowUP Beauty Solutions  
- **AI face (voice + chat):** **Glo** — one personality, multiple **roles** (not separate brand names)  
- **AI brand (ops/content):** Glow Agents + Glow Concierge  
- **Connected org:** JAWSAI911 (builder, agency channel, shared systems DNA)  
- In-app AI is never named “Jaws agents.” Footer/about may say “Built by JAWSAI911.”

## Glo — 5 core voice agents (launch set)

Locked for premium package narrative ($300–$700+/mo with site + CRM + automation).  
Full detail: `docs/GLO_VOICE_AGENTS.md`

| Role | Display | Job |
|---|---|---|
| `glo_sales` | **Glo Sales** | Lead qualification 24/7 — fit questions, score lead |
| `glo_scheduler` | **Glo Scheduler** | Book / reschedule / confirm on **live calendar** |
| `glo_support` | **Glo Support** | FAQs, hours, pricing, common support → escalate |
| `glo_followup` | **Glo Follow-Up** | Outbound: new leads, missed calls, re-engage |
| `glo_reception` | **Glo Reception** | Answer every call, route to the right Glo role / human |

**Rule:** One face (**Glo**). Five roles. Web AI Receptionist = Glo Scheduler + Support until full voice ships.

## Integration boundary — MCP

**MCP is first-class** for agent access to live booking + CRM (no brittle per-channel connectors).

- Architecture: `docs/ARCHITECTURE_MCP.md`
- In-process tool façade (P0): `src/lib/mcp-booking-crm.ts`
- Tools: `check_availability`, `book_appointment`, `reschedule_appointment`, `cancel_appointment`, `get_client_profile`, `search_clients`, `update_client_notes`, `log_interaction`, `collect_deposit`
- Orchestrator (LangGraph later) owns conversation state; MCP stays stateless capability layer

## Glow Agents (content / growth — Concierge)

| Agent id | Display name | Job |
|---|---|---|
| `front_desk` | Front Desk | FAQs, comments, hours, basic replies (maps toward Glo Support) |
| `book_closer` | Book Closer | High-intent → booking (maps toward Glo Scheduler / Sales) |
| `trend_scout` | Trend Scout | Beauty/local trends, digests |
| `chair_content` | Chair Content | Photo/video → multi-lane posts |
| `shorts` | Shorts | Reels/TikTok hooks + captions |
| `reputation` | Reputation | Review requests, Google paths |
| `retail_services` | Retail & Services | Service/product promos |
| `fill_the_book` | Fill the Book | Rebook, win-back, slow days (maps toward Glo Follow-Up) |

**Glow Concierge** orchestrates content agents; owners approve; stylists draft under approval policy.  
**Glo** owns voice/phone + booking conversation.

## Strategic principles

1. Full SaaS ceiling â€” ship in production-grade slices, never fake the product forever.  
2. CRM-native growth â€” content from appointments, services, clients, consent.  
3. Human-in-the-loop by default â€” stylist draft â†’ approve â†’ ready/post.  
4. Assist publish first; auto-post (FB â†’ IG â†’ TikTok) as progressive enhancement.  
5. External booking URL in v1; native booking on roadmap.  
6. Consent and brand locks before client-facing content goes â€œready.â€  
7. Measure to bookings and rebooks, not vanity likes alone.  
8. Editorial luxury UI â€” calm, readable, not purple AI slop.

## Anti-references

- Generic Hootsuite clone with no salon data  
- Fake â€œ2,000+ salonsâ€ style social proof without truth  
- Dead nav items that look real  
- Condescending or overly flirtatious copy for all verticals  
- Unsplash-only brochure that hides the software  
- Auto-posting client faces without consent  

## Voice

Warm editorial, confident, sparse. Beauty desk â€” not hype coach, not cold enterprise CRM.

Examples:
- â€œGlow Concierge has 3 drafts ready for approval.â€  
- â€œTurn into Reel draftâ€  
- â€œWe wonâ€™t show a face until consent is on.â€  

## Platform order (social)

1. Facebook  
2. Instagram  
3. TikTok  
4. Other  

## Publish phases

1. **Assist:** drafts, schedule, copy, open native apps, mark posted  
2. **Auto-post:** OAuth + aggregator/API, scheduled publish jobs  

## Success metrics

- Time to first draft &lt; 3 min; first ready post &lt; 10 min after connect  
- Weekly active posters among connected accounts  
- Approval latency &lt; 24h multi-staff  
- Review request â†’ Google completion rate  
- Bookings attributed via UTM / booking link taps  

## Live & repo

- Live: https://glowupbeautysolutions.netlify.app  
- Repo folder: glowkiss-main (GlowUP)  
- Progress log: GLOWUP_PROGRESS.md  
