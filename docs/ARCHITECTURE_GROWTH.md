# Architecture — Growth OS + Glow Agents

## Bounded contexts

- `salons` — tenant root  
- `ops` — clients, appointments, services, staff (expanding)  
- `growth` — social, campaigns, pages, trends  
- `agents` — Concierge orchestration + agent runs  

## Tenancy

Every row: `salonId` (or ownerId until members land).  
Roles: `owner` | `manager` | `stylist` | `front_desk`.

## Publish pipeline

```
draft → pending_approval → approved → scheduled → ready → marked_posted
```

Assist phase: no provider API publish. Jobs can still notify “ready”.  
Later: `publishing → published` via Facebook/Instagram/TikTok adapters or Ayrshare/Zernio.

## Concierge

- Input: salon context (services, brandTone, city, booking URL, open gaps)  
- Output: suggestions[] linked to agentId + payload (draft post, review ask, rebook list)  
- Persist as `concierge_suggestions` / `agent_runs`

## Workers (planned)

Inngest or QStash: trend digest, ready-to-post notify, token refresh, analytics.

## External booking

`salons.externalBookingUrl` — CTAs in captions, link-in-bio, Book Closer.

## Partner connection

`salons.partnerOrg` optional (`jawsai911`) for provisioned SuperSite clients.
