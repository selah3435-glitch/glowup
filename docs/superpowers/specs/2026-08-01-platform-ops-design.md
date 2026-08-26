# Platform ops — signups, monitoring, hardening

**Status:** Approved to implement (user: do both)  
**Date:** 2026-08-01

## Goals

1. Know who signs up through the site (list + funnel stages + alerts).
2. Detect site/function outages and crashes; notify via email + SMS.
3. Harden client/server code to reduce white-screen crashes.

## Approach

Operator stack (plug-in tools + GlowUP APIs):

| Concern | Solution |
|---------|----------|
| Auth identity | Netlify Identity (source of passwords) |
| Signup registry | `POST/GET /api/platform` + Netlify Blobs store |
| Funnel stages | `signed_up` → `onboarding_started` → `onboarding_complete` → `active` |
| Alerts | `OPS_ALERT_WEBHOOK` (email/SMS via Make/Zapier/Twilio) |
| Uptime | Better Stack / UptimeRobot → homepage + `/api/health` |
| Errors | Sentry (browser + functions) when DSN set |
| Hardening | React ErrorBoundary, safer storage, health checks |

## Admin

Dashboard → **Platform** (`/dashboard/platform`) lists signups. Protected by signed-in session + optional `PLATFORM_ADMIN_EMAILS` allowlist.
