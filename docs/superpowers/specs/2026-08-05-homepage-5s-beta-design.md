# Homepage: 5-second product clarity, pain points, beta, honest Glo

**Status:** Approved by user (2026-08-05)  
**Scope:** Marketing homepage only (+ hero photo remaster). Dashboard product code unchanged.  
**Prior:** Rhode light public site + logo; product-overlay hero with Overview mock.

---

## Goals

1. Within **~5 seconds**, a stylist/owner understands **what GlowUP is** and **what it does**.
2. Show a **real-looking stylist dashboard** in the first fold (product, not atmosphere alone).
3. Surface the **2 biggest pains** and how GlowUP fixes them.
4. Make **open beta** unmistakable on public pages.
5. Stay **honest about Glo voice**: no xAI voice console credits yet → do not sell live phone as ready.
6. **Glo website chat** remains the AI booking path (including after hours) when chat/API is available.

---

## First 5 seconds (hero)

### Message hierarchy

| Element | Spec |
|--------|------|
| Nav beta chip | `Open beta` next to logo (rose/cream pill) |
| Kicker | `Open beta · Salon OS for stylists & owners` |
| H1 | Keep short benefit: *The floor that books itself.* |
| Lede | One breath: one live book for every chair, Glo AI **chat** front desk, clients & deposits — booth → multi-location |
| Primary CTA | `Join the beta · free setup` → `/login?next=/onboarding` |
| Secondary CTA | `See the dashboard` → focuses/scrolls to hero mock (not “Call Glo”) |
| Dashboard mock | HTML Overview preview (right on desktop): sidebar + metrics + upcoming + small Glo chat chip; label `Stylist dashboard · beta preview` |
| Phone in nav | Demote/remove primary tel CTA until voice credits exist |

### Layout

- **Desktop:** Full-bleed remastered salon hero; copy left; floating dark Overview card right (~2° tilt, soft shadow).
- **Mobile:** Copy + CTAs first, then full-width dashboard mock still early in first scroll.

### Hero photo remaster

- Source: current `/hero-salon.jpg` (luxury pink salon).
- **Slight** makeover via image edit: keep composition/mood; unique enough not to read as stock twin.
- Remove third-party brand marks (e.g. YSL-style monograms, Vogue-style mastheads on wall art).
- Soft rose/cream brand tint; export as `/hero-salon.jpg` (keep original as `hero-salon-original.jpg` if not already).

---

## Pain points band (immediately under promo strip)

**Heading:** `Two problems. One OS.`

| # | Pain | Fix |
|---|------|-----|
| 1 | **After-hours / missed demand** — phones while in color, DMs at 9pm, voicemail dead ends | **Glo AI chat** (beta) books holds on the **live** multi-stylist calendar. *Phone voice: coming soon (no voice credits yet).* |
| 2 | **Multi-chair chaos** — double-books, sticky notes, tools that break at stylist #2 | **One live calendar OS** + clients/formulas + deposits — booth → brand, no forced re-platform |

Footer line under cards: *You’re joining an open beta — free setup while we pilot with real floors.*

---

## Beta messaging (public)

- Nav: persistent `Open beta` chip on marketing pages (homepage required; login/onboarding nice-to-have).
- CTAs prefer “Join the beta” / “free setup” language.
- Pricing / final CTA: soft *Beta · free setup* line.
- Dashboard mock badge: `beta preview`.

---

## Glo: chat vs voice (honesty rules)

| Channel | Status for this launch | Homepage behavior |
|---------|------------------------|-------------------|
| **Website chat (Glo)** | Supported path: `/api/glo/chat` + local `book_appointment` when actions return; works any time of day including after hours if client uses chat | Primary AI story; “Try Glo chat” / open FAB |
| **Phone voice** | **Not sold as live** — owner has no xAI voice console credits | No primary `tel:` CTA; Glo section says **Voice coming soon** |

### Fact: Does chat book after hours?

**Yes (for chat).** There is no business-hours lock on Glo website chat. After-hours is about *when the client messages*, not a server curfew. Booking applies via `applyGloActions` → `book_appointment` onto the salon’s live calendar store. Live LLM replies need `XAI_API_KEY` on Netlify; without it, offline/chip fallback can still complete structured booking flows in the client.

**Phone/voice is separate** and is not ready until voice credits are funded.

---

## Components / files (implementation targets)

- `public/hero-salon.jpg` — remastered asset  
- `src/routes/index.tsx` — hero layout, copy, pain band, beta, Glo honesty  
- `src/styles-rhode-marketing.css` — hero split + mock + pain cards + beta chip  
- New optional: `src/components/HeroDashboardPreview.tsx` — Overview mock (HTML/CSS only; no auth)  
- Glo section + nav: demote phone; promote chat  

Out of scope: funding xAI voice; changing real dashboard routes; Identity/Stripe/SMS.

---

## Success criteria

- [ ] Unfamiliar visitor can state “salon OS / live book + AI chat” after viewing hero ~5s  
- [ ] Dashboard mock visible without scrolling on desktop first fold  
- [ ] Two pain cards present with product fixes  
- [ ] “Open beta” visible in nav  
- [ ] No primary claim that phone voice is live  
- [ ] Hero image no third-party luxury brand marks; still pink salon mood  
- [ ] Build succeeds; deploy when ready  

---

## Self-review

- No TBD placeholders for core decisions.  
- Consistent with prior Rhode public-only scope.  
- Pain points match user choice: after-hours misses + multi-chair chaos.  
- Voice honesty explicit so marketing does not contradict ops reality.  
- Chat after-hours booking documented from code paths (`glo-chat` + `book_appointment`).  
