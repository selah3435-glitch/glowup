# Stripe env report — GlowUP Netlify go-live

**Date:** 2026-08-05 (session date context: user_info 2026-08-04)  
**Site:** https://glowupbeautysolutions.com  
**Site ID:** `f73e88c5-30bb-4291-8905-c203fbaecaba`  
**Account user:** `6a6bddee8b3f8ed9b8ce2f4e` (aaron.jawsai@gmail.com)  
**Symptom:** `POST /api/billing/checkout` → `{"error":"STRIPE_SECRET_KEY not configured","fallback":true}`

---

## Status

| Item | Result |
|------|--------|
| Overall | **BLOCKED — human must supply Stripe secret key** |
| `STRIPE_SECRET_KEY` on Netlify | **NO** |
| Key found locally (safe places) | **NO** |
| Key set via CLI this session | **NO** (nothing to set) |
| Checklist written | **YES** → [`docs/GO_LIVE_STRIPE.md`](../../../docs/GO_LIVE_STRIPE.md) |

---

## 1) Docs & function

### `docs/BILLING_SMS_SETUP.md`

- Add Netlify env **`STRIPE_SECRET_KEY`** = `sk_test_...` / `sk_live_...`
- Redeploy: `npm run deploy:full`
- Without key: free onboarding fallback with plan selected
- SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`

### `netlify/functions-clean/create-checkout.mjs`

- Reads `process.env.STRIPE_SECRET_KEY`
- Missing → HTTP 200 + `{ error: "STRIPE_SECRET_KEY not configured", fallback: true }`
- Present → Stripe Checkout Session (subscription, 14-day trial) for `solo` ($39) / `floor` ($149)
- Plans use inline `price_data` (no pre-created Stripe Price IDs required)

---

## 2) Local secret scan (masked)

| Location | Finding |
|----------|---------|
| Process / User / Machine env (`STRIPE*`, `XAI*`, `TWILIO*`, `*SECRET*`) | None set |
| `E:\GlowUP-build\glowkiss-main\.env*` | No `.env` / `.env.local` / `.env.production` |
| `E:\GlowUP-build\.env` | Missing |
| `%USERPROFILE%\.env`, `.stripe` | Missing |
| `%USERPROFILE%\.config\stripe` | Exists but only `docs/cache/` (no keys) |
| Project scripts | No Stripe key material; `scripts/set-xai-netlify-env.ps1` is XAI-only |
| Netlify CLI config | Present; auth user `6a6bddee8b3f8ed9b8ce2f4e` |

**No `sk_test_***` / `sk_live_***` available to install.**

---

## 3) Netlify env inventory

**Method A — REST API** (same pattern as `scripts/set-xai-netlify-env.ps1`):

```
GET https://api.netlify.com/api/v1/accounts/6a6bddee8b3f8ed9b8ce2f4e/env?site_id=f73e88c5-30bb-4291-8905-c203fbaecaba
```

**All keys on site (names only):**

- `XAI_API_KEY`

**Wanted keys:**

| Variable | Present? | Notes |
|----------|----------|--------|
| `STRIPE_SECRET_KEY` | **no** | Root cause of production fallback |
| `XAI_API_KEY` | **yes** | context `all`; value set (len ~84; **not printed**) |
| `TWILIO_ACCOUNT_SID` | **no** | |
| `TWILIO_AUTH_TOKEN` | **no** | |
| `TWILIO_FROM` | **no** | |
| `STRIPE_PUBLISHABLE_KEY` | **no** | Not required by create-checkout |
| `STRIPE_WEBHOOK_SECRET` | **no** | Not required by create-checkout |

**Method B — Netlify CLI v17:**

- `npx netlify-cli@17 env:list --site=...` fails (no `--site` option on this command).
- Works with `$env:NETLIFY_SITE_ID` + `$env:NETLIFY_AUTH_TOKEN` + `env:list --context production --plain`.
- Confirmed same: only `XAI_API_KEY` listed for production.

**CLI note:** `env:list --plain` prints secret values. Prefer REST list + name-only reporting, or Netlify UI. Do not paste CLI plaintext secrets into tickets or git.

---

## 4) Action taken this session

1. Confirmed function contract and docs.
2. Confirmed Stripe key absent locally and on Netlify.
3. **Did not** call `env:set` (no key value available).
4. Wrote owner checklist: **`docs/GO_LIVE_STRIPE.md`**.

---

## 5) Next human action (required)

1. Stripe Dashboard → **Developers → API keys** → copy **Secret key** (`sk_test_...` first).
2. Netlify → Site → **Environment variables** → add **`STRIPE_SECRET_KEY`** (Production / Functions).
3. Redeploy: `npm run deploy:full` from `E:\GlowUP-build\glowkiss-main`.
4. Verify:

```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://glowupbeautysolutions.com/api/billing/checkout" `
  -ContentType "application/json" `
  -Body '{"plan":"solo"}'
```

Expect `ok: true` and a `checkout.stripe.com` URL (not `fallback: true`).

Optional after Checkout works: Twilio vars for live SMS (`docs/BILLING_SMS_SETUP.md`).

---

## Rollback / residual risk

- **Rollback:** Remove `STRIPE_SECRET_KEY` → redeploy → safe free-onboarding fallback.
- **Residual:** Checkout cannot go live until owner pastes a real Stripe secret into Netlify and redeploys functions. XAI is already configured for Glo chat; SMS remains off until Twilio env is set.
- **Security:** Never commit secrets; rotate any key that appears in shell history or chat logs.
