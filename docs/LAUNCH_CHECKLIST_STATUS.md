# Launch checklist status (2026-08-05)

## Technical & tracking

| Item | Status | Notes |
|------|--------|--------|
| GA4 + Meta Pixel | **Ready (env-driven)** | Set `VITE_GA4_MEASUREMENT_ID` and/or `VITE_META_PIXEL_ID` on Netlify **build** env, redeploy. Scripts load only after cookie consent. |
| Event tracking | **Shipped** | `join_beta_click`, `sign_up_click`, `start_checkout`, `gap_audit_submit`, `see_dashboard_click` via `src/lib/analytics.ts` |
| Forms → CRM | **Partial** | Gap audit + Identity signup → platform API; in-app clients store + cloud book via `/api/ops` |
| Multi-device calendar/CRM | **Phase A shipped** | Netlify Blobs `/api/ops`; auto push/pull; salonSyncKey |
| Visit deposits + SMS/email | **Phase B shipped** | Payment Link deposits; auto confirm/owner alert; Twilio + Resend env; Ops toggles |
| Email welcome automation | **Not built** | Needs ESP (e.g. Resend/Customer.io); not in codebase |
| Mobile audit | **Code CSS responsive** | Needs real device QA by operator |
| Core Web Vitals &lt; 2.5s LCP | **Operator check** | Run PageSpeed Insights on production after deploy |

## Positioning & copy

| Item | Status |
|------|--------|
| Hero who + problem | **Shipped** — multi-stylist owners; 15–25% inquiry loss |
| Concrete metrics | **Shipped** on homepage (modeled ranges) |
| Tone / proofread | **Pass on homepage**; legal pages authoritative |
| Hyperlink 404s | Privacy/Terms real routes; internal anchors present |

## Operational & legal

| Item | Status |
|------|--------|
| Privacy + Terms | **Shipped** `/privacy`, `/terms` + footer links |
| Migration section | **Shipped** `#migrate` |
| Demo calendar invites | **Not a third-party scheduler** — product uses in-app calendar |
| Cookie consent | **Shipped** (shows only if analytics IDs configured) |
| HTTPS / HSTS | **Verified** Netlify + Strict-Transport-Security |

## Action required from you

1. Netlify → Environment variables (Build):  
   - `VITE_GA4_MEASUREMENT_ID` = `G-XXXXXXXX`  
   - `VITE_META_PIXEL_ID` = Meta pixel ID  
2. Redeploy so Vite embeds those at build time.  
3. Accept cookies on site → verify hits in GA4/Meta.  
