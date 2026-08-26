# Platform ops — signups, uptime, alerts

## DNS (glowupbeautysolutions.com)

As of 2026-08-01 the apex domain **already resolves and serves GlowUP** over HTTPS (status 200).

- **Still works:** https://glowupbeautysolutions-260.netlify.app  
- **Custom domain:** https://glowupbeautysolutions.com  

You only need to change **IONOS DNS** if the custom domain stops resolving or SSL fails.  
Recommended records if you ever reset DNS:

| Type | Name | Value |
|------|------|--------|
| A | `@` | `75.2.60.5` (Netlify load balancer) **or** keep Netlify’s recommended IPs from Domain management |
| CNAME | `www` | `glowupbeautysolutions-260.netlify.app` |

Check Netlify → Domain management for the live DNS status.

---

## Signup tracking (built-in)

| Event | When | Stage |
|-------|------|--------|
| Create account | `/login` signup | `signed_up` |
| Start onboarding | step 2+ | `onboarding_started` |
| Finish onboarding | step 3 save | `onboarding_complete` |

- **API:** `POST /api/platform` · `GET /api/platform`  
- **UI:** Dashboard → **Platform**  
- **Storage:** Netlify Blobs (`glowup-platform`) with memory fallback  

### Alerts (email + SMS)

1. Create a free webhook that sends email + SMS, e.g.:
   - [Make.com](https://www.make.com) / Zapier: Webhook → Email + SMS  
   - Twilio: webhook → SMS  
2. Netlify env: **`OPS_ALERT_WEBHOOK`** = that URL  
3. Redeploy functions (`npm run deploy:full`)  
4. Optional lock: **`PLATFORM_ADMIN_TOKEN`** = long random secret (paste same into Platform page)

On new `signed_up` and `onboarding_complete`, GlowUP POSTs JSON to the webhook.

---

## Uptime monitoring (you create once — free)

1. Open [Better Stack](https://betterstack.com/uptime) or [UptimeRobot](https://uptimerobot.com)  
2. Add monitors (every 1–5 min):

| URL | Expect |
|-----|--------|
| `https://glowupbeautysolutions.com/` | HTTP 200 |
| `https://glowupbeautysolutions.com/api/health` | HTTP 200, body `"ok":true` |
| `https://glowupbeautysolutions-260.netlify.app/api/health` | backup |

3. Enable **email + SMS** contacts on the monitor  
4. Optional: status page for “is GlowUP up?”

---

## Crash / error monitoring (Sentry — free tier)

1. Create project at [sentry.io](https://sentry.io) (React + Node)  
2. Netlify env: `SENTRY_DSN=...` (wire when ready)  
3. App already has **ErrorBoundary** so React crashes show a recovery screen instead of a white page  

---

## Health check

```http
GET /api/health
```

```json
{ "ok": true, "service": "glowup", "hasXaiKey": true, "hasAlertWebhook": false }
```
