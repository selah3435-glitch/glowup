# GlowUP. — Start here next session

**Last updated:** 2026-07-30  
**Live (JAWSAI Netlify):** https://glowupbeautysolutions-260.netlify.app  
**Custom domain (DNS pending):** https://glowupbeautysolutions.com — see `docs/DOMAIN_SETUP.md`  
**Code:** `E:\GlowUP-build\glowkiss-main`  
**Account:** aaron.jawsai@gmail.com · site id `f73e88c5-30bb-4291-8905-c203fbaecaba`

---

## What’s real vs sample

| Area | Status |
|------|--------|
| Marketing homepage | Live static (SSR HTML pre-generated into `dist/client`) |
| Slogan | **Beauty Business, Beautifully Done.** |
| Gallery (incl. tile 6) | Working Unsplash URLs |
| AI Receptionist **booking holds** | **Real** (this browser): service → day → time → name → phone → confirm |
| Dashboard **Booking holds** | **Real** (same browser localStorage); Cancel frees slot |
| Dashboard metrics / “Wednesday appointments” | **Sample / demo** |
| Social + Concierge | UI + demo data; assist-publish foundations |
| Netlify Identity / multi-device | Not wired for holds |
| Netlify Functions on deploy | **Skipped** (Windows EISDIR zip); static `--no-build` only |

**Storage keys**
- Holds: `glowup_booking_holds_v1`
- Salon context: `glowup_salon_context_v1`

---

## Smoke test (2 minutes) — do this first

Same browser for steps 1–4.

1. Open https://glowupbeautysolutions-260.netlify.app — hard refresh (Ctrl+F5).  
2. Click **Book with AI** (bottom FAB).  
3. Tap **Book** → pick a service chip → weekday → time → type name → phone (7+ digits) → **Confirm hold**.  
4. Expect: “You’re held…” + short Ref code.  
5. Go to `/dashboard` → **Booking holds** shows that client.  
6. **Cancel** → hold disappears; book same slot again in chat — should be available.  
7. Optional: Onboarding/Brand set `externalBookingUrl` → confirm message should include the link.

**Pass if:** hold survives refresh on home, appears on dashboard, cancel works.

---

## Deploy recipe (when you change UI)

```powershell
Set-Location "E:\GlowUP-build\glowkiss-main"
$env:npm_config_cache = "E:\npm-cache"
$env:Path = "E:\npm-global;$env:Path"
$env:NODE_OPTIONS = "--max-old-space-size=2048"
npm run build
node "E:\GlowUP-build\generate-html.mjs"
"/*    /index.html   200" | Set-Content "dist\client\_redirects" -Encoding ASCII
Remove-Item -Recurse -Force ".netlify" -EA SilentlyContinue
if (Test-Path "netlify\functions") { Rename-Item "netlify\functions" "functions.deploy-skip" -Force }
node ".\node_modules\netlify-cli\bin\run.js" deploy --prod --dir dist/client --no-build --site f73e88c5-30bb-4291-8905-c203fbaecaba
if (Test-Path "netlify\functions.deploy-skip") { Rename-Item "netlify\functions.deploy-skip" "functions" -Force }
```

---

## Key files

| Path | Why |
|------|-----|
| `src/components/AiReceptionist.tsx` | Booking state machine |
| `src/lib/booking-store.ts` | Holds + slots + localStorage |
| `src/routes/dashboard.index.tsx` | Holds panel |
| `src/lib/demo-salon.ts` | Salon name/services/booking URL |
| `src/lib/glow-agents.ts` | Agent catalog + demo concierge |
| `docs/superpowers/specs/2026-07-30-booking-holds-design.md` | Booking design |
| `PRODUCT.md` / `GLOWUP_PROGRESS.md` | Product truth + checklist |

---

## Recommended build order (next)

1. ~~Owner calendar route~~ **Done (local spine)** — `/dashboard/calendar`  
2. **Cloud appointments** — multi-device DB (backend B: Neon/Railway)  
3. **Client CRM MVP**  
4. **Payments (Stripe)**  
5. **SMS/email**  
6. **Custom domain**  
7. **Fix EISDIR / Identity** when needed for auth  

See `docs/PHASE1_LAUNCH.md` / `C:\Users\Student\GlowUP-phase1\PHASE1_LAUNCH.md`.

---

## Locked product decisions (don’t re-litigate)

- Brand: **GlowUP.** + slogan with period  
- Social assist first; FB → IG → TikTok  
- Stylist draft → owner/manager approve  
- External booking URL still valid fallback  
- AI brand: Glow Agents / Glow Concierge (not “Jaws agents” in-app)

---

## Session prompt starter

> Resume GlowUP. at `E:\GlowUP-build\glowkiss-main`. Read `docs/NEXT_SESSION.md`. Live: glowupbeautysolutions-260. Next priority: [cloud holds | Identity | calendar | EISDIR].


## Phase 1 #1 priority
Read `docs/PHASE1_LAUNCH.md`. Workspace: `E:\GlowUP-build\glowkiss-main` (USB).

