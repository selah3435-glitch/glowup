# Phase A — Cloud spine (Salon OS system of record)

**Status:** Approved for implementation (founder: “yes start and implement phase A”)  
**Date:** 2026-08-05

## Goal

Make calendar + CRM **multi-device** for a pilot salon: book on phone, see on desk; Glo and dashboard share one cloud book per salon.

## Non-goals (later phases)

- Full Postgres multi-tenant SQL reporting  
- Staff RBAC enforcement  
- Multi-location Brand  
- SMS/email automation  
- Social auto-post  
- Voice phone  

## Architecture (recommended: Blobs salon book)

| Piece | Choice | Why |
|-------|--------|-----|
| Store | **Netlify Blobs** `glowup-ops` keyed by `salonSyncKey` | Already matches `cloud-sync.ts`; no Neon credential blocker; same pattern as `platform.mjs` |
| API | `GET/PUT /api/ops` Netlify function in `functions-clean` | Deploy path already uses functions-clean |
| Client SoR | localStorage cache + **auto push/pull** | Offline-friendly; existing calendar/clients UI unchanged |
| Tenant key | `gu_…` salonSyncKey (ops settings) | Exists today; optional bind to Identity email/user id in snapshot meta |
| Future | Drizzle `appointments` / `clients` tables | Ready when DATABASE_URL lands; not required for Phase A ship |

### Approaches considered

1. **Blobs snapshot (chosen)** — ship multi-device this week on current Netlify stack.  
2. **Neon + Drizzle first** — true SQL; blocked until DB provisioned and migrations run.  
3. **localStorage only + export file** — already partial; not multi-device.

## Data model (snapshot v1)

```json
{
  "version": 1,
  "salonSyncKey": "gu_…",
  "updatedAt": "ISO",
  "ownerIdentityId": "",
  "ownerEmail": "",
  "appointments": [ /* Appointment[] */ ],
  "clients": [ /* Client[] */ ],
  "notifications": [ /* OutboundMessage[] */ ],
  "settings": { /* OpsSettings partial */ }
}
```

Last-write-wins on full snapshot PUT (pilot-safe; conflict merge later).

## Client behavior

1. Every salon gets a stable `salonSyncKey` via `ensureSalonSyncKey()`.  
2. `syncEnabled` defaults **on** after first successful cloud contact (or explicitly on dashboard).  
3. Mutations to appointments/clients **debounce-push** (~800ms).  
4. Dashboard mount **pull-then-merge-or-replace** when sync enabled.  
5. Glo/MCP unchanged — they already call calendar/clients stores.

## Security (pilot)

- Knowledge of `salonSyncKey` = access to that salon book (treat like a share link).  
- Key is long random (`gu_` + 16 hex).  
- Later: require Identity JWT + server-side key map.

## Success criteria

- [ ] `PUT /api/ops` stores snapshot; `GET /api/ops?key=` returns it  
- [ ] Push from device A → pull on device B shows same appointments/clients  
- [ ] Glo book on A appears on dashboard calendar after B pull/reload  
- [ ] Deploy includes ops function + redirect  
- [ ] Design doc + progress notes updated  

## Files

- `netlify/functions-clean/ops.mjs` (new)  
- `scripts/deploy-netlify-with-functions.ps1`  
- `src/lib/cloud-sync.ts`, `ops-auto-sync.ts` (new), calendar/clients stores  
- `src/routes/dashboard.tsx`, `dashboard.ops.tsx`  
- `db/schema.ts` appointments + clients (forward-looking)  
