# GlowUP. Phase 1 Launch — #1 Priority

**Locked:** 2026-07-31  
**Live marketing:** https://glowupbeautysolutions-260.netlify.app  
**Status overall:** ~15–25% of Phase 1 — **marketing + AI hold teaser live; ops spine not launch-ready**

This document is the **number-one priority** over voice multi-channel, social OS depth, and competitive “full OS” scope until Phase 1 ships.

---

## Phase 1 scope (your list)

| # | Capability | Status | What exists today | What’s missing for launch |
|---|------------|--------|-------------------|---------------------------|
| 1 | **Online booking** ✅ (confirmed: not bank payouts) | **Partial (~30%)** | AI Receptionist guided hold (service → day → time → name → phone); localStorage; dashboard holds list | Real calendar availability, multi-device DB, confirmations, staff/duration rules |
| — | Bank payouts / Connect | **Not Phase 1** (parked) | — | Stripe Connect later; payments (card deposits) stay in P1-3 |
| 2 | **Calendar** | **Demo only (~10%)** | Sample “Wednesday appointments” UI; holds panel | Live day/week calendar, conflicts, team view, AI books into it |
| 3 | **Client CRM** | **Shell only (~5%)** | Marketing claims; onboarding services list | Client records, formulas, history, preferences AI can use |
| 4 | **SMS / email** | **Not started (0%)** | Footnote “demo” | Twilio/SendGrid (or similar), templates, booking confirm/remind |
| 5 | **Payments** | **Not started (0%)** | Copy mentions deposits/POS path | Stripe Checkout/PaymentIntents, deposits, card-on-file, tips |
| 6 | **Professional landing** | **Strong (~80%)** | Live branded homepage, pink hero, AI FAB, modules, gallery | Trust signals, real reviews, public roadmap, less “preview” language |
| 7 | **Custom domain** | **Not started (0%)** | `*.netlify.app` only | DNS + SSL for glowupbeautysolutions.com (or chosen domain) |

**Honest roll-up:** You can **demo** the vision. You cannot yet **launch** Phase 1 as a product owners run their business on.

> **Locked 2026-07-31:** “Online banking” in the founder list means **online booking** (clients book online), not owner bank payouts. Payouts are post–Phase 1.

---

## What is live and real (do not oversell)

- Marketing site on Netlify (static deploy)  
- Brand: GlowUP. + *Beauty Business, Beautifully Done.*  
- Soft pink hero + blush accent palette  
- AI Receptionist **booking holds** (browser localStorage)  
- Dashboard **Booking holds** list + cancel (same browser)  
- Onboarding + Social/Concierge **UI previews** (mostly sample data)  
- Schema stubs for salons / growth (not full appointments CRM)

## What is fake / sample / blocked

- Dashboard revenue metrics & sample appointments  
- Multi-device or multi-user truth (no Identity-gated cloud holds in production)  
- Netlify Functions often skipped on Windows deploy (EISDIR)  
- POS, SMS, email, custom domain  

## Infrastructure warning (blocks Phase 1)

| Issue | Impact |
|-------|--------|
| Prior build path `E:\GlowUP-build\glowkiss-main` **not available** on this machine | Need restore before coding |
| Incomplete copy under CrossDevice (missing booking-store / AiReceptionist in that tree) | Risk of building on old zip |
| **~1.5 GB free on C:** | npm install/build will fail without free space or external drive |
| Live site still serves last Netlify deploy | Good for demos; code must be recovered for Phase 1 work |

---

## Phase 1 build order (ruthless)

Do **not** start voice agents, multi-channel, or inventory until these clear.

### Milestone P1-0 — Restore workspace (blocker)
1. Free disk (≥15 GB recommended) or attach E:/external  
2. Restore full `glowkiss-main` (from Netlify deploy source, git, or complete archive)  
3. Confirm `booking-store.ts` + `AiReceptionist.tsx` present  

### Milestone P1-1 — Calendar spine + cloud booking  
- Appointment model (duration, staff, status)  
- Owner live calendar (not sample)  
- AI books/reschedules/cancels into calendar  
- Persist multi-device (backend **B**: Neon/Railway/Workers recommended; marketing stays Netlify)  

### Milestone P1-2 — Client CRM (minimum viable)  
- Clients: name, phone, email, notes, last/next visit  
- Link clients ↔ appointments  
- Basic search in dashboard  

### Milestone P1-3 — Payments  
- Stripe (deposits + pay at booking or checkout link)  
- Record payment status on appointment  
- *(Banking/payouts: Stripe Connect Express for owner bank later in P1 or P1.1)*  

### Milestone P1-4 — SMS + email  
- Booking confirmation + 24h reminder  
- Owner notify on new AI booking  
- Provider: Twilio SMS + Resend/SendGrid email  

### Milestone P1-5 — Professional polish + custom domain  
- Strip “demo/sample” from owner-critical surfaces  
- Security/privacy/trust strip on marketing  
- Connect custom domain on Netlify  

### Launch gate (all must be true)
- [ ] Owner can open calendar on phone and see real bookings  
- [ ] Client can book via AI or simple flow → lands on calendar  
- [ ] Client gets SMS or email confirmation  
- [ ] Deposit or payment works in test mode → live mode  
- [ ] CRM shows that client  
- [ ] Custom domain serves the app  
- [ ] No “sample Wednesday” as the only calendar  

---

## Explicitly NOT Phase 1 (park)

- Voice AI / multi-channel IG/WhatsApp (Phase 2 wedge after calendar is real)  
- Full inventory, commissions engine, native mobile apps  
- Auto social publish  
- Competing feature-for-feature with Vagaro  

---

## Session starter (paste next time)

> GlowUP Phase 1 is **#1 priority**. Read `C:\Users\Student\GlowUP-phase1\PHASE1_LAUNCH.md`. Restore workspace first, then P1-1 Calendar spine (backend B). Do not expand into voice until launch gate.

---

## Progress snapshot

| Area | % |
|------|---|
| Professional landing | 80% |
| Online booking (holds only) | 30% |
| Calendar (live) | 10% |
| Client CRM | 5% |
| SMS/email | 0% |
| Payments | 0% |
| Online banking/payouts | 0% |
| Custom domain | 0% |
| **Phase 1 overall** | **~15–25%** |
