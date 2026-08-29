# GitHub → Netlify auto-deploy

**Repo:** private `https://github.com/selah3435-glitch/glowup`  
**Functions directory:** `netlify/functions-clean` (see `netlify.toml`)

## Connect once (Netlify UI)

1. Netlify → Site `glowupbeautysolutions-260` → **Project configuration → Build & deploy → Import from Git** (or **Link repository**).
2. Choose GitHub → `selah3435-glitch/glowup` → branch `main`.
3. Build command: `vite build && node scripts/generate-html.mjs` (from `netlify.toml`).
4. Publish directory: `dist/client`.
5. Confirm functions dir is `netlify/functions-clean`.

`vite build` alone ships assets without prerendered HTML, so Netlify serves its generic 404. The generate-html step writes `/`, `/for-floors`, `/for-solo`, and `/compare/{vagaro,gloss-genius,fresha}` into `dist/client` before publish. `npm run build` runs both steps.

After that, every push to `main` deploys production.

## Env that must stay on Netlify (never in git)

`RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`, `XAI_API_KEY`, `STRIPE_SECRET_KEY`, Twilio keys, `PLATFORM_ADMIN_TOKEN` (set a long random string).

## Owner vs guest keys

- **Owner key** `gu_…` — dashboard / cloud sync. Never put this in a public booking URL.
- **Desk key** `gd_…` — `/book/gd_…` guest Glo. Safe to share with clients.

Dashboard → Brand / Ops generates both on first sync.
