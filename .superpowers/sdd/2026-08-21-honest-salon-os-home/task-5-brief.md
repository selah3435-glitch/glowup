# Task 5: Verify

Work from E:\GlowUP-build\glowkiss-main. Do not deploy to Netlify (founder did not ask to go live this step).

- [ ] **Step 1: Typecheck**

```powershell
Set-Location E:\GlowUP-build\glowkiss-main
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 2: Unit tests**

```powershell
npx --yes tsx --test src/lib/proof-metrics.test.ts
```

(Use tsx; node --experimental-strip-types fails on calendar-store import.) Expected: 5/5 pass.

- [ ] **Step 3: Grep**

```powershell
Select-String -Path src\routes\dashboard.index.tsx -Pattern '2840|78%|4.1%|Content ready'
Select-String -Path src\components\AiReceptionist.tsx -Pattern 'tel:'
```

Expected: no matches.

- [ ] **Step 4: Deploy** SKIP unless you are told to deploy. Do not run deploy scripts.

Write command output into the report. No code changes unless a check fails — if a check fails, report BLOCKED with the output, do not silently fix unrelated files.

Skip git.
