# Pilot week — land a salon + ads without friction

**Priority #1:** Signup → setup → dashboard never strands the user.  
**Also:** TikTok / Instagram ads drive to a clean funnel.

---

## What we hardened (product)

| Risk | Fix |
|------|-----|
| Identity not enabled | **Enabled** on Netlify site (2026-08-05) |
| Email confirm blocks setup | **Continue to studio setup** without waiting |
| Identity/client errors | **Guest seamless path** still opens onboarding |
| Onboarding API 401 | **Always saves locally** + enters dashboard |
| Returning users re-onboard | **Skip to dashboard** if already onboarded |
| Email confirm hash | Callback → onboarding or dashboard |
| No guidance | **Pilot checklist** on dashboard home |

---

## Your 48-hour pilot checklist (ops)

### A) Must-do before ads

1. **Smoke the funnel on production (incognito)**  
   - https://glowupbeautysolutions.com/login  
   - Create account → setup 3 steps → dashboard  
   - Home → Chat with Glo → Book a test chair  
   - Dashboard → Calendar shows it  

2. **Netlify Identity settings** (Identity is ON)  
   - Site → Identity → Settings  
   - Prefer **Autoconfirm** ON for pilot week (no email wait)  
   - Registration open  

3. **Env keys (when ready)**  
   - `XAI_API_KEY` — already for Glo  
   - `STRIPE_SECRET_KEY` — real Checkout  
   - Twilio trio — live SMS  

4. **You receive signups**  
   - Dashboard → **Platform**  
   - Optional: `OPS_ALERT_WEBHOOK` for SMS/email on signup  

### B) Ads (TikTok + Instagram) — simple

**Landing URL (use one):**  
`https://glowupbeautysolutions.com/?utm_source=tiktok`  
or `...?utm_source=instagram`  

**CTA in creative:**  
“Book after hours with Glo — free studio setup” → **Start Free / Create account**

**Angle (15–30s):**  
- Owner mid-color / hands full  
- Missed call → Glo books on live calendar  
- “One OS: solo → multi-chair — not another app you outgrow”  
- End card: glowupbeautysolutions.com + pricing Solo $39 / Floor $149  

**Don’t claim yet:** payroll, marketplace, “10k salons.”  
**Do claim:** multi-stylist calendar, CRM, Glo AI, transparent pricing.

**Budget tip (week 1):**  
Small daily test ($20–50/day) to traffic; optimize on complete signup (create account) if pixel later.

### C) Pilot salon offer

- Free **Floor** trial (14 days when Stripe on; free setup always)  
- You white-glove: 30-min Zoom setup  
- Success metric: **1 real after-hours AI book** or **5 live calendar appointments**

---

## Smooth path (what the pilot sees)

```
Ad → Homepage
  → Create account (or continue without confirm)
  → 3-step studio setup
  → Dashboard + pilot checklist
  → Glo book on public site
  → Calendar / Clients / Leads
```

If anything fails, product **still continues** with local studio data.

---

## After first pilot

1. Cloud appointments as shared system of record  
2. Stripe webhook = paid plan truth  
3. Pixel + conversion events for ads  
4. Phone Glo always-on for “call us” creatives  
