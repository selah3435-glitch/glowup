# Checkout UX — pilot fallback soft path

**Date:** 2026-08-05  
**Project:** GlowUP (`glowkiss-main`)  
**Scope:** Homepage pricing plan click → Stripe checkout fallback UX  
**Status:** ✅ Complete

---

## Problem

When `STRIPE_SECRET_KEY` is missing, `/api/billing/checkout` returned:

```json
{ "error": "STRIPE_SECRET_KEY not configured", "fallback": true, "message": "…" }
```

`onSelectPlan` surfaced that raw error to visitors:

> `STRIPE_SECRET_KEY not configured — continuing free setup for solo.`

Scary env-var language for an open-beta audience.

---

## Goals & success criteria

| Criterion | Result |
|-----------|--------|
| Soften message; never show `STRIPE_SECRET_KEY not configured` to end users | ✅ |
| Friendly pilot line: *Card checkout opens soon — continuing free beta setup for [plan].* | ✅ |
| Still save plan (`setSelectedPlanId`) + redirect to free setup (`TRIAL_HREF`) | ✅ |
| Real Stripe API errors still surface (shortened) when key is set but Stripe fails | ✅ |
| Brand plan mailto path unchanged | ✅ |

---

## Behavior matrix

| Scenario | User sees | Redirect |
|----------|-----------|----------|
| Stripe session URL returned | (none) | Stripe Checkout |
| Missing secret / pilot / offline API / network | `Card checkout opens soon — continuing free beta setup for {plan}.` | `/login?next=%2Fonboarding&plan={plan}` after ~900ms |
| Stripe API error (key set) | `{shortened error} — continuing free beta setup for {plan}.` | same free setup |
| Brand plan | (mailto open) | `brandMailto()` — **no** Stripe / free-setup redirect |

---

## Files changed

### 1. `src/lib/billing-client.ts`

- Added `CheckoutResult` with `pilot?: boolean`.
- Exported `pilotCheckoutMessage(plan)`.
- Config / deploy / network failures → `{ fallback: true, pilot: true }` with **no** raw error string.
- Regex sanitizer maps legacy server messages containing `STRIPE_SECRET`, `not configured`, HTML 404, etc. to pilot mode (safe even before function redeploy).
- Non-pilot Stripe failures → shortened `error` (≤120 chars).
- Brand still returns contact-only result (no fetch).

### 2. `src/routes/index.tsx` (`onSelectPlan`)

- Brand: still immediate `brandMailto()` (unchanged).
- Success URL: still hard-nav to Stripe.
- Pilot / soft fallback: `pilotCheckoutMessage(planId)`.
- Real error: shortened message + free beta setup line.
- Always `setSelectedPlanId` first; always `TRIAL_HREF&plan=` when not Stripe/brand.
- ~900ms pause so pricing-band message is readable before redirect.

### 3. `netlify/functions-clean/create-checkout.mjs`

- Missing key response is now:

```json
{ "ok": false, "fallback": true, "pilot": true }
```

- No env var names in JSON (network tab safe for end users).
- Stripe API failure path still returns shortened Stripe `error` + `fallback: true` (unchanged intent).

---

## Verification

- `npx tsc --noEmit -p tsconfig.json` → **exit 0**
- Manual path review:
  - Brand early-return before `startCheckout` fetch — intact.
  - Plan saved via `setSelectedPlanId(planId)` before checkout attempt.
  - Free setup URL still `${TRIAL_HREF}&plan=${planId}`.

---

## Residual risks

1. **Ops dashboard** (`src/routes/dashboard.ops.tsx`) still toasts a config hint if checkout fails — internal ops, not homepage. Out of scope.
2. **Deploy:** Client soft-path works against *old* function responses (regex maps `STRIPE_SECRET_KEY not configured`). New `pilot: true` response needs function redeploy for clean API body.
3. **900ms delay** is intentional UX; if users click multiple plans quickly, last click still wins (same as before busy-state pattern).

---

## Out of scope (not changed)

- Enabling real Stripe keys on Netlify
- Brand pricing card content
- Identity / onboarding flows after `TRIAL_HREF`
