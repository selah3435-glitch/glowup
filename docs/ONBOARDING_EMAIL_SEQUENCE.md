# GlowUP. — 4-part salon onboarding email sequence

**Status:** Launch copy ready (not wired to an ESP yet)  
**Brand:** GlowUP. · Beauty Business, Beautifully Done.  
**Primary buyer:** Multi-stylist / multi-location owners (Floor & Brand)  
**Tone:** Authoritative, owner-grade, honest about open beta (Glo chat live; voice coming soon)

## Platform setup

Pick one and import these as a drip:

| Platform | Notes |
|----------|--------|
| **Mailchimp** | Customer journey / automation from signup tag |
| **HubSpot** | Workflow after contact lifecycle = lead / trial |
| **Klaviyo** | Metric or list trigger on account create |
| **Resend / Loops** | Transactional + delay sequences |

**Trigger:** User completes signup (Identity) or gap audit with work email.  
**Merge fields:** `{{first_name}}`, `{{salon_name}}`, `{{plan}}` (solo|floor|brand)

**Base URL:** `https://glowupbeautysolutions.com`

| CTA | URL |
|-----|-----|
| Dashboard | `https://glowupbeautysolutions.com/dashboard` |
| Onboarding | `https://glowupbeautysolutions.com/onboarding` |
| Free setup / login | `https://glowupbeautysolutions.com/login?next=%2Fonboarding` |
| Migration / gap audit | `https://glowupbeautysolutions.com/#audit` |
| Activate Glo (chat) | `https://glowupbeautysolutions.com/dashboard` (open Glo FAB) or homepage `#glo` |
| Strategy session | `mailto:aaron.jawsai@gmail.com?subject=GlowUP%2015-minute%20strategy%20session` |

---

## Email 1 — Welcome & setup (Day 0 · immediate)

**Subject:** Welcome to GlowUP.! Let’s set up your digital front desk  
**Preview:** Three steps to get the floor live this week.

```
Hi {{first_name}},

Welcome to GlowUP. — the Salon Operating System for owners who run chairs (and for solos who will).

You're in open beta. Here's the fastest path to value:

1) Business profile — name, city, team size (2 minutes)
2) Services — what you sell and default durations
3) Calendar — open the live multi-stylist book and walk today's board

→ Go to setup: https://glowupbeautysolutions.com/onboarding
→ Or open your studio: https://glowupbeautysolutions.com/dashboard

Glo AI chat can book after hours onto that live book once you're set up. Phone voice is coming soon.

— The GlowUP. team
Beauty Business, Beautifully Done.
```

**CTA:** Go to My Dashboard / Onboarding

---

## Email 2 — Migration (Day 2)

**Subject:** Moving from another salon app? We’ll handle the heavy lifting.  
**Preview:** Export → map → go live. No black-box data loss.

```
Hi {{first_name}},

The #1 reason owners delay switching software isn't features — it's fear of losing the book.

On GlowUP. open beta, migration is guided:

1) Export clients, notes, and upcoming appointments (CSV / spreadsheet from Booksy, GlossGenius, Mindbody-class tools, etc.)
2) We map stylists, services, and holds onto the GlowUP. multi-stylist calendar spine
3) You go live with Glo chat + CRM while the old stack winds down

Request free data migration / gap audit:
https://glowupbeautysolutions.com/#audit

Reply to this email if you already have an export ready — we'll queue white-glove help.

— GlowUP. migrations
```

**CTA:** Request Free Data Migration → `/#audit`

---

## Email 3 — Glo AI ROI (Day 5)

**Subject:** Never miss a client booking again (even after hours)  
**Preview:** After-hours demand on the live book — modeled lift toward 40%+ inquiry→book.

```
Hi {{first_name}},

Most floors convert only 15–25% of inquiries into booked appointments. After-hours calls and DMs die in voicemail while color is processing.

Glo is GlowUP.'s AI chat front desk (open beta):
• Answers when you're on the floor
• Books holds onto the real multi-stylist calendar
• Helps fill empty chair gaps without buying twice the ads

Phone voice for Glo is coming soon — chat is the path that books today.

Activate AI booking (open dashboard → Chat with Glo):
https://glowupbeautysolutions.com/dashboard

Run the ROI model on the homepage if you want a dollar estimate for your missed-call volume:
https://glowupbeautysolutions.com/#roi

— GlowUP. product
```

**CTA:** Activate AI Booking Assistant → `/dashboard`

---

## Email 4 — Social proof & strategy call (Day 7)

**Subject:** How multi-stylist floors scale on one GlowUP. OS  
**Preview:** One book, fewer overlaps — then a 15-minute strategy session.

```
Hi {{first_name}},

Owners who grow from one chair to a full floor (and then a second location) usually hit the same wall: tools that work for solo and break at stylist #2.

GlowUP. is built as one continuous Salon OS — live multi-stylist calendar, client retention infrastructure, and Glo after-hours chat — so you don't re-platform mid-growth.

Modeled planning ranges we share with pilots:
• Industry inquiry→book often sits at 15–25%; instant after-hours response helps push toward 40%+
• Same lead volume, more chairs filled — without doubling ad spend

Want a 15-minute strategy session to tune your account (plan, migration, Glo)?
https://glowupbeautysolutions.com/#audit
or email aaron.jawsai@gmail.com with subject: GlowUP 15-minute strategy session

If you're ready to go deeper on the floor today:
https://glowupbeautysolutions.com/dashboard

— GlowUP. success
Beauty Business, Beautifully Done.
```

**CTA:** Schedule a 15-Minute Strategy Session → audit / mailto

---

## Implementation checklist (ESP)

- [ ] Create tags: `trial_started`, `plan_solo`, `plan_floor`, `plan_brand`, `gap_audit`
- [ ] Automation: on `signed_up` / Identity confirm → Email 1 immediately
- [ ] Delay 2 days → Email 2 (skip if already requested migration)
- [ ] Delay 5 days from signup → Email 3
- [ ] Delay 7 days from signup → Email 4
- [ ] UTM on CTAs: `utm_source=email&utm_medium=onboarding&utm_campaign=d0_welcome` (d2_migrate, d5_glo, d7_strategy)
- [ ] Unsubscribe / physical address footer per CAN-SPAM / CASL

## Product wiring later

Hook `trackPlatformEvent` stages (`signed_up`, `onboarding_complete`) to your ESP webhook when you pick a platform. Until then, import trial emails manually or from Netlify Identity / platform registry.
