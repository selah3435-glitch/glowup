# Task 4 Report — Wire homepage (nav, hero, pain, Glo honesty)

**Date:** 2026-08-05  
**Status:** complete  
**Plan:** `docs/superpowers/plans/2026-08-05-homepage-5s-beta.md` Task 4

## Goal

Wire the Rhode marketing homepage for 5-second product clarity: open beta chip, product-split hero with dashboard mock, two pain→fix cards, honest Glo (chat primary / voice coming soon), and beta CTAs — without touching dashboard routes.

## Files changed

| Path | Action |
|------|--------|
| `src/routes/index.tsx` | Full homepage wiring per plan Steps 1–7 |
| `.superpowers/sdd/2026-08-05-homepage-5s-beta/task-4-report.md` | This report |

No other files modified. No git commit (per task constraints). Dashboard routes untouched.

## What changed

1. **Imports**
   - Added `HeroDashboardPreview` from `../components/HeroDashboardPreview`
   - Removed unused `Phone` (lucide) and `GLO_PHONE_DISPLAY` / `GLO_PHONE_E164` imports
   - Removed unused `scrollTo` helper

2. **Nav**
   - Brand wrap: `.rd-nav-brand` + `Open beta` chip (`.rd-beta-chip`)
   - Links: Product · Why GlowUP (`#pain`) · Pricing · Glo
   - Primary CTA: **Join the beta** → `TRIAL_HREF`
   - Removed primary `tel:` Glo phone link

3. **Hero** (`rd-hero rd-hero-product`)
   - Kicker: Open beta · Salon OS for stylists & owners
   - Lede: live multi-stylist calendar + Glo AI chat + clients/deposits, single chair → multi-location
   - Primary CTA: **Join the beta · free setup** → `TRIAL_HREF`
   - Secondary CTA: **See the dashboard** → smooth scroll to `#hero-dashboard`
   - Product pane mounts `<HeroDashboardPreview />`
   - `HERO_BG` remains `'/hero-salon.jpg'`

4. **Promo strip**
   - `Open beta · Solo $39 · Floor $149 · Brand $299+ · Glo chat included · Voice coming soon`

5. **Pain band** (`id="pain"`)
   - Card 1: After-hours demand → Glo AI chat (beta); voice coming soon
   - Card 2: Multi-chair chaos → one live calendar OS
   - Footer: open beta / free setup pilot note

6. **Glo section** (`#glo`)
   - Copy: chat books live calendar after hours; voice coming soon (not live)
   - No `tel:` links
   - Buttons: **Open Glo chat** (`.ai-rec-fab` click) + **Join the beta**

7. **Final CTA**
   - **Join the beta · free setup** → `TRIAL_HREF`
   - Supporting copy mentions open beta + Glo chat

8. **Preserved**
   - Essentials, philosophy, stories, proof, pricing, quotes, footer structure
   - `<AiReceptionist />` at bottom (chat booking path intact)

## Verification

```powershell
cd E:\GlowUP-build\glowkiss-main
npm run build
```

- **Result:** exit 0 (client + SSR builds succeeded)
- Grep on `src/routes/index.tsx`: no `tel:`, no `GLO_PHONE_*`, no lucide `Phone` import
- Present: `HeroDashboardPreview`, `rd-pain`, `Join the beta`, `#hero-dashboard` scroll target

## Residual risks

- Visual QA (desktop first-fold mock + mobile single-column hero) deferred to Task 5 / manual checklist
- Footer link updated to “Join the beta” for CTA consistency; philosophy CTA still “Open your studio” (out of Task 4 scope)
- Plan Step 9 git commit skipped by instruction

## One-line summary

Homepage now leads with open beta, product-split hero + dashboard mock, two pain cards, and honest Glo chat CTAs with no primary phone sell.
