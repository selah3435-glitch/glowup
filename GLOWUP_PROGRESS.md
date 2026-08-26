# GlowUP — Full Session Progress & Decisions

**Saved:** 2026-07-30  
**Backup copy also at:** `C:\Users\Student\Downloads\GlowUP_PROGRESS_AND_DECISIONS.md`

See that file or `PRODUCT.md` for the complete record. This repo copy is the source of truth checked into the project.

---

## Vision

Fully functional multi-tenant salon SaaS with **Glow Agents** + **Glow Concierge**, connected to **JAWSAI911** (builder/ecosystem), not rebranded as Jaws.

Double-stack: public Site layer + Command dashboard + always-on AI agents.

## Locked decisions

1. Publish phase 1: **Assist** (not auto-post yet); full auto-post still on roadmap  
2. Platforms: **Facebook → Instagram → TikTok → other**  
3. Aggregator cost: **OK** for true publish phase  
4. Roles: **Stylist drafts → owner/manager approve**  
5. Booking v1: **externalBookingUrl**  
6. Ceiling: **full SaaS** with Jaws-class AI richness  
7. Brand: GlowUP product; Glow Agents + Glow Concierge; JAWSAI911 connected  

## Live

https://glowupbeautysolutions-260.netlify.app  
(JAWSAI account · site `glowupbeautysolutions-260`)

## Project path

`E:\GlowUP-build\glowkiss-main`

## Next session

**Read first:** [`docs/NEXT_SESSION.md`](docs/NEXT_SESSION.md) — smoke test, deploy recipe, file map, build order.

## Glow Agents

Front Desk · Book Closer · Trend Scout · Chair Content · Shorts · Reputation · Retail & Services · Fill the Book

## Post status machine

`draft → pending_approval → approved → scheduled → ready → marked_posted`  
(Later: `publishing → published` via API)

## Build status (updated this session)

- [x] Progress + PRODUCT + DESIGN docs (also `Downloads/GlowUP_PROGRESS_AND_DECISIONS.md`)  
- [x] Schema expansion: members, growth_settings, posts, assets, concierge_suggestions, agent_runs, trend_digests, externalBookingUrl, partnerOrg  
- [x] `src/lib/glow-agents.ts` agent catalog + demo posts/suggestions  
- [x] Dashboard layout shell + Overview / Social / Concierge nav  
- [x] Social: Pulse, Studio, Schedule (assist FB/IG), Brand (booking URL), Campaigns  
- [x] Concierge: approval queue, suggestions, full agent grid  
- [x] Onboarding saves local salon context + external booking URL field  
- [ ] Generate DB migration on deploy (`pnpm db:generate`)  
- [x] Booking holds slice: AI Receptionist state machine + localStorage + dashboard list/cancel  
- [x] Real appointments/clients CRUD (local + multi-device Blobs `/api/ops` Phase A)  
- [ ] Postgres/Neon cutover from Blobs snapshots  
- [ ] LLM-backed agent runtime  
- [ ] True social auto-post (aggregator)  
- [ ] Email/SMS + review engine production  

### New routes

| Path | Purpose |
|---|---|
| `/dashboard` | Overview (sample metrics labeled) |
| `/dashboard/social` | Pulse |
| `/dashboard/social/studio` | Draft + consent + approval path |
| `/dashboard/social/schedule` | Week wall + assist publish |
| `/dashboard/social/brand` | Brand kit + external booking URL |
| `/dashboard/social/campaigns` | Campaign recipes |
| `/dashboard/concierge` | Glow Concierge |

*Update this checklist as work ships.*
