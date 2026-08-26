# Go live: Stripe Checkout (GlowUP)

Production currently returns:

```json
{"error":"STRIPE_SECRET_KEY not configured","fallback":true}
```

The function `netlify/functions-clean/create-checkout.mjs` only needs **`STRIPE_SECRET_KEY`** at runtime. Without it, pricing CTAs fall back to free onboarding with the plan selected.

## 1) Get a Stripe secret key

1. Open [Stripe Dashboard](https://dashboard.stripe.com) (sign in or create account).
2. Toggle **Test mode** on (top right) for first go-live rehearsal.
3. **Developers** → **API keys**.
4. Copy **Secret key**:
   - Test: starts with `sk_test_...`
   - Live (when ready): starts with `sk_live_...`
5. Prefer a **restricted key** with only:
   - Checkout Sessions: write
   - Customers: write
   - Subscriptions: write  
   (never put secret keys in the browser or git.)

## 2) Add `STRIPE_SECRET_KEY` on Netlify (Production)

**UI path:**

1. [Netlify app](https://app.netlify.com) → site **glowupbeautysolutions**  
   (Site ID: `f73e88c5-30bb-4291-8905-c203fbaecaba`)
2. **Site configuration** → **Environment variables** → **Add a variable**
3. Key: `STRIPE_SECRET_KEY`
4. Value: paste `sk_test_...` (or `sk_live_...`)
5. Scopes: include **Functions** (and Builds/Runtime if offered)
6. Contexts: **Production** (or **All contexts** if you want previews too)
7. Save

**CLI (after you have the key in a local shell only — do not commit):**

```powershell
# Never echo the secret. Paste into the prompt or set privately:
$env:STRIPE_SECRET_KEY = "sk_test_..."   # your key, not committed

$site = "f73e88c5-30bb-4291-8905-c203fbaecaba"
$cfg = Get-Content "$env:APPDATA\netlify\Config\config.json" -Raw | ConvertFrom-Json
$token = $cfg.users.'6a6bddee8b3f8ed9b8ce2f4e'.auth.token
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
$accountId = "6a6bddee8b3f8ed9b8ce2f4e"
$body = @(
  @{
    key    = "STRIPE_SECRET_KEY"
    scopes = @("builds", "functions", "runtime", "post_processing")
    values = @(@{ value = $env:STRIPE_SECRET_KEY; context = "production" })
  }
) | ConvertTo-Json -Depth 6

Invoke-RestMethod -Method POST `
  -Uri "https://api.netlify.com/api/v1/accounts/$accountId/env?site_id=$site" `
  -Headers $headers -Body $body | Out-Null
```

If the variable already exists, use `PUT` to  
`.../accounts/$accountId/env/STRIPE_SECRET_KEY?site_id=$site` with a single object body (same shape as `scripts/set-xai-netlify-env.ps1`).

## 3) Redeploy so functions pick up the env

Netlify injects env at **deploy** time for functions. After setting the variable:

```powershell
cd E:\GlowUP-build\glowkiss-main
npm run deploy:full
```

(Equivalent: `powershell -File scripts/deploy-netlify-with-functions.ps1`.)

A UI **Trigger deploy → Clear cache and deploy site** also works if the functions bundle is already correct on the last deploy.

## 4) Verify

```powershell
# Expect ok:true + url (Stripe Checkout), not fallback:true
Invoke-RestMethod -Method POST `
  -Uri "https://glowupbeautysolutions.com/api/billing/checkout" `
  -ContentType "application/json" `
  -Body '{"plan":"solo"}'
```

- Success: `{ "ok": true, "url": "https://checkout.stripe.com/...", "sessionId": "cs_...", "plan": "solo", "trialDays": 14 }`
- Still missing key: `{ "error": "STRIPE_SECRET_KEY not configured", "fallback": true }`

Manual: landing **#pricing** → **Start Solo / Floor** → Stripe hosted Checkout (14-day trial). Success URL: `/dashboard?checkout=success&plan=...`.

## 5) Optional later

| Variable | Purpose |
|----------|---------|
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | Live SMS (see `docs/BILLING_SMS_SETUP.md`) |
| Live Stripe key | Flip Test mode off; replace with `sk_live_...`; redeploy |

**Brand** ($299+/location): not Checkout — email `aaron.jawsai@gmail.com`.

## Rollback

- Delete or clear `STRIPE_SECRET_KEY` in Netlify env → redeploy → Checkout falls back to free onboarding again (safe degrade).
- Rotate the key in Stripe Dashboard if it was exposed.
