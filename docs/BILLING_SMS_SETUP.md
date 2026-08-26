# Billing · Glo metering · SMS

## 1) Stripe Checkout (Solo $39 · Floor $149)

1. Create a [Stripe](https://dashboard.stripe.com) account (test mode first).
2. Netlify → Environment variables → add:
   - **`STRIPE_SECRET_KEY`** = `sk_test_...` or `sk_live_...` (prefer restricted key with Checkout + Customers + Subscriptions)
3. Redeploy: `npm run deploy:full`
4. Landing **#pricing** → **Start Solo / Floor** opens Stripe Checkout (14-day trial).
5. Success returns to `/dashboard?checkout=success&plan=...` and saves the plan.

**Brand** ($299+/location): email `aaron.jawsai@gmail.com` (Talk to us).

Without `STRIPE_SECRET_KEY`, buttons still start free onboarding with the plan selected.

## 2) Glo AI metering

- Local counter: `glowup_glo_usage_v1` (YYYY-MM conversations)
- Allowance from plan: Solo 150 · Floor 1000 · Brand 5000
- Soft warn at 100%; hard soft-cap at **120%** (chips still work)
- Dashboard → **Ops** shows usage this month

## 3) Proof metrics

Computed from this browser’s real data:

- AI books (`source === ai_receptionist`) + after-hours
- Deposit paid rate
- Leads captured / booked
- Multi-stylist days

Landing **#proof** + Ops metric cards.

## 4) Live SMS (Twilio) — Phase B

Netlify env:

| Variable | Example |
|----------|---------|
| `TWILIO_ACCOUNT_SID` | `ACxxxx` |
| `TWILIO_AUTH_TOKEN` | secret |
| `TWILIO_FROM` | `+1...` Twilio number |

On **every new booking** (calendar or Glo), with Ops messaging on:

1. Client confirm SMS is queued and sent via `POST /api/sms` if Twilio is set  
2. Owner alert SMS/email if owner phone/email saved  
3. Optional **auto deposit** when Payment Link + toggle on  

Ops → **Open** on outbox: Twilio or native compose. **Send tomorrow reminders** batch-sends.

Without Twilio, messages stay **queued** in Ops (no popup spam on auto book).

## 5) Live email (Resend) — Phase B

| Variable | Example |
|----------|---------|
| `RESEND_API_KEY` | `re_...` |
| `RESEND_FROM` | `GlowUP. <bookings@yourdomain.com>` (optional; Resend test sender works initially) |

`POST /api/email` → Resend. Without key → mailto fallback from Ops Open.

## 6) Visit deposits

1. Stripe Dashboard → Payment Links → create deposit amount link  
2. Ops → paste **Stripe Payment Link URL** + default amount  
3. Calendar → **Deposit** on an appointment, or enable **Auto deposit on book**  

## Endpoints

| Path | Function |
|------|----------|
| `POST /api/billing/checkout` | `create-checkout` (SaaS plan) |
| `POST /api/sms` | `send-sms` |
| `POST /api/email` | `send-email` |
| `GET /api/health` | includes `hasTwilio`, `hasResend` |
