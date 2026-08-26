# Task 4 report: Purge demo rows + Call Glo

## Status
Done.

## Changes
- `src/routes/dashboard.tsx`: imported `purgeDemoAppointmentsIfOnboarded` from `../lib/calendar-store` and called it at the start of the existing `[gate, user]` `useEffect` (immediately after `if (gate !== 'ok') return`). No extra effect added. Routing/auth unchanged.
- `src/components/AiReceptionist.tsx`: no edit. `Call Glo` still pushes the chat-only message; no `tel:` / `window.location.href` dial.

## Grep
```powershell
Select-String -Path src\components\AiReceptionist.tsx -Pattern 'tel:'
```
Result: no matches.

## Commits
None (per brief).

## Concerns
None. `readAppts()` already purges; dashboard entry now also purges explicitly when the shell is gated `ok`.
