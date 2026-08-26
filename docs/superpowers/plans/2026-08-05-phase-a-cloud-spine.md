# Phase A Cloud Spine Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Multi-device salon book (appointments + clients) via Netlify Blobs `/api/ops` with auto-sync from the existing local stores.

**Architecture:** Snapshot PUT/GET by `salonSyncKey`; localStorage is a cache; debounced push on mutate; pull on dashboard load.

**Tech Stack:** Netlify Functions (classic handler), Netlify Blobs, TanStack/React client stores.

## Global Constraints

- Deploy via `scripts/deploy-netlify-with-functions.ps1` and `netlify/functions-clean/*`
- Preserve classic handler shape like `platform.mjs` (not only Request/Response)
- Do not break offline local booking if API is down

---

### Task 1: Ops function + redirect

**Files:**
- Create: `netlify/functions-clean/ops.mjs`
- Modify: `scripts/deploy-netlify-with-functions.ps1`

- [ ] Add ops.mjs GET/PUT Blobs store `glowup-ops`
- [ ] Redirect `/api/ops` → `/.netlify/functions/ops`

### Task 2: Auto-sync client

**Files:**
- Create: `src/lib/ops-auto-sync.ts`
- Modify: `src/lib/cloud-sync.ts`, `calendar-store.ts`, `clients-store.ts`, `ops-settings.ts`

- [ ] Debounced `scheduleCloudPush`
- [ ] Hook write paths
- [ ] Default sync friendlier

### Task 3: Dashboard bootstrap

**Files:**
- Modify: `src/routes/dashboard.tsx`, `dashboard.ops.tsx`

- [ ] Pull on mount when key exists
- [ ] Bind Identity email/id into snapshot settings

### Task 4: Schema forward

**Files:**
- Modify: `db/schema.ts`

- [ ] Add `appointments` + `clients` tables for future Neon

### Task 5: Deploy + smoke

- [ ] deploy:full
- [ ] PUT then GET snapshot
