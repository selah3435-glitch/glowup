# Task 4: Purge demo rows + Call Glo

**Files:**
- Modify: `src/routes/dashboard.tsx`
- Modify: `src/components/AiReceptionist.tsx` only if a `tel:` was added (it must not)

**Interfaces:**
- Consumes: `purgeDemoAppointmentsIfOnboarded` from `../lib/calendar-store`
- Produces: dashboard shell calls purge on mount

- [ ] **Step 1: Dashboard shell**

In `src/routes/dashboard.tsx`, import `purgeDemoAppointmentsIfOnboarded` from `../lib/calendar-store`. In an existing `useEffect` that runs when the dashboard is shown, or add:

```tsx
  useEffect(() => {
    purgeDemoAppointmentsIfOnboarded()
  }, [gate])
```

`readAppts()` already purges; this makes dashboard entry explicit. Do not change routing/auth.

- [ ] **Step 2: Call Glo**

In `AiReceptionist.tsx`, the `Call Glo` chip must remain:

```tsx
    if (label === 'Call Glo') {
      pushBot('Phone voice is not live yet. Chat books the desk.', homeChips)
      return
    }
```

Do not add `window.location.href = 'tel:+17372324091'`.

```powershell
Select-String -Path src\components\AiReceptionist.tsx -Pattern 'tel:'
```

Expected: no `tel:` in that file.

- [ ] **Step 3: Commit** SKIP — no git.

Do not change dashboard.index.tsx (Task 3 done). Do not invent occupancy.
