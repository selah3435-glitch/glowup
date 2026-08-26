# Deploy report — go-live-agents

**Date:** 2026-08-05 (UTC)  
**Project:** `E:\GlowUP-build\glowkiss-main`  
**Site ID:** `f73e88c5-30bb-4291-8905-c203fbaecaba`  
**Deploy message:** `go-live-agents`

## Summary

| Step | Result |
|------|--------|
| `npx tsc --noEmit` | **exit 0** (no TS fixes required) |
| `npm run build` | **exit 0** |
| `node generate-html.mjs` | **ok** — wrote `dist/client/index.html` + base `_redirects` |
| `_redirects` API maps | **written** (see below) |
| `public/*` → `dist/client` | **copied** |
| Netlify prod deploy | **live yes** (exit 0) |
| Checkout smoke | **JSON** (not HTML DOCTYPE) |

## 1. Typecheck

```text
npx tsc --noEmit
# exit 0 — no remaining errors; no source edits required
```

## 2. Production build

```text
npm run build
# exit 0
# client: dist/client (Vite ~1m 8s)
# ssr: dist/server (~18s)
```

Build exit code: **0**

## 3. Static HTML + redirects

```text
node E:\GlowUP-build\generate-html.mjs
# status 200, wrote dist/client/index.html and _redirects
```

Ensured `dist/client/_redirects`:

```text
/api/glo/chat  /.netlify/functions/glo-chat  200
/api/platform  /.netlify/functions/platform  200
/api/health  /.netlify/functions/health  200
/api/billing/checkout  /.netlify/functions/create-checkout  200
/api/sms  /.netlify/functions/send-sms  200
/*    /index.html   200
```

Copied `public/*` into `dist/client` (brand assets, favicons, hero images).

## 4. Functions package

Deployed from `netlify/functions-clean`:

- `glo-chat.mjs`
- `platform.mjs`
- `health.mjs`
- `send-sms.mjs`
- `create-checkout.mjs`

## 5. Netlify deploy

**Auth:** `NETLIFY_AUTH_TOKEN` from AppData Netlify config user `6a6bddee8b3f8ed9b8ce2f4e` (token not logged here).

**EISDIR mitigation:** renamed `.netlify` → `.netlify.bak-deploy` before deploy; restored after.

```text
npx netlify-cli@17 deploy --prod \
  --dir=dist/client \
  --functions=netlify/functions-clean \
  --site=f73e88c5-30bb-4291-8905-c203fbaecaba \
  --skip-functions-cache \
  --message "go-live-agents"
# exit 0
# √ Deploy is live!
```

| Field | Value |
|-------|--------|
| Deploy live | **yes** |
| Deploy ID | `6a72b5546f5d101de621665f` |
| Unique URL | https://6a72b5546f5d101de621665f--glowupbeautysolutions-260.netlify.app |
| Production URL | https://glowupbeautysolutions.com |
| Build logs | https://app.netlify.com/projects/glowupbeautysolutions-260/deploys/6a72b5546f5d101de621665f |
| Assets | 63 files + 5 functions hashed; 45 files + 1 function uploaded |

## 6. Smoke tests

### Health

```text
GET https://glowupbeautysolutions.com/api/health
# 200
# {"ok":true,"service":"glowup","ts":"2026-08-05T04:00:54.680Z","region":"us-east-1","hasXaiKey":true,"hasAlertWebhook":false,"chat":"/api/glo/chat","platform":"/api/platform"}
```

### Checkout (must be JSON, not HTML)

Invalid plan (routing check — still JSON):

```text
POST /api/billing/checkout  Content-Type: application/json
{"plan":"starter","email":"smoke@example.com"}
# 400
# {"error":"plan must be solo or floor","brandContact":"aaron.jawsai@gmail.com","hint":"Brand plan is custom - email sales"}
# SMOKE: not HTML ✓
```

Valid plan:

```text
POST https://glowupbeautysolutions.com/api/billing/checkout
{"plan":"solo","email":"smoke@example.com"}
# 200
# {"ok":false,"fallback":true,"pilot":true}
# SMOKE: JSON_OK (no <!DOCTYPE>)
```

Direct function path also returned the same JSON 400/200 behavior (redirects working both ways).

**Interpretation:** API redirects + functions are live. Checkout is in **pilot fallback** mode (`ok:false, fallback:true, pilot:true`) because `STRIPE_SECRET_KEY` is not set (or not available to the function) in the Netlify environment. Client should show soft pilot UX rather than Stripe session URL. No secrets returned.

## 7. Rollback

1. Netlify UI → site → Deploys → publish previous successful deploy, **or**
2. Redeploy prior known-good artifact:
   ```text
   npx netlify-cli@17 deploy --prod --dir=<prior-dist-client> --functions=netlify/functions-clean --site=f73e88c5-30bb-4291-8905-c203fbaecaba --message "rollback"
   ```
3. Restore `_redirects` / functions from git if needed.

## 8. Residual risks

- **Stripe:** checkout remains pilot-only until `STRIPE_SECRET_KEY` (and related price/config) is set in Netlify env for production.
- **SSR vs static:** this deploy is static `dist/client` + `functions-clean`, not the TanStack Start SSR server bundle; SPA `_redirects` catch-all is intentional.
- **Secrets:** CLI build flags can echo auth tokens in local terminal history — rotate token if logs are shared.
- **`.netlify` rename:** restored after deploy; if a later deploy hits EISDIR, rename again before CLI run.

## Return checklist

| Item | Value |
|------|--------|
| Build exit | **0** |
| Deploy live | **yes** |
| Checkout smoke | `200 {"ok":false,"fallback":true,"pilot":true}` — JSON, not HTML |
