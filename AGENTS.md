# GlowUP Project Guide

## Product context

Read `PRODUCT.md`, `DESIGN.md`, and `GLOWUP_PROGRESS.md` before large changes. GlowUP is a full salon SaaS (not a demo-only theme). AI is branded **Glow Agents** + **Glow Concierge**, connected to JAWSAI911 as builder/ecosystem only.

Growth architecture: `docs/ARCHITECTURE_GROWTH.md`.

## Architecture

GlowUP is a TanStack Start application deployed on Netlify. File-based routes live in `src/routes`, shared browser utilities live in `src/lib`, and reusable UI wrappers live in `src/components`. Global styling is intentionally centralized in `src/styles.css` because the product uses a tightly coordinated editorial design system rather than generic component-library defaults.

Dashboard shell: `src/components/DashboardShell.tsx`. Social + Concierge live under `/dashboard/social/*` and `/dashboard/concierge`.

Netlify Identity provides account creation, sign-in, OAuth, session state, and user IDs. The root route wraps every page in `IdentityProvider` and `CallbackHandler`. Netlify Identity only completes real authentication on a deployed Netlify URL; the local interface includes an explicit interactive preview path.

Netlify Database stores structured salon setup data through Drizzle ORM. The schema is defined in `db/schema.ts`, the client is in `db/index.ts`, and migrations belong in `netlify/database/migrations`. The `netlify/functions/onboarding.ts` function exposes the authenticated `/api/onboarding` endpoint.

## Key Directories

- `src/routes`: Marketing, login, onboarding, and dashboard screens.
- `src/components`: Cross-route interface wrappers such as auth callback handling.
- `src/lib`: Client-side service contexts and shared logic.
- `db`: Drizzle schema and Netlify Database client.
- `netlify/functions`: Server-side APIs deployed as Netlify Functions.
- `netlify/database/migrations`: Generated database migrations applied on deploy.
- `public`: Static brand assets.

## Conventions

- Use TypeScript and functional React components.
- Keep routes focused on complete screen experiences; extract code only when it is reused or materially improves clarity.
- Use descriptive identifiers and preserve strict TypeScript settings.
- Reuse CSS variables in `src/styles.css` for color, typography, spacing, and visual hierarchy.
- Keep interactions accessible with semantic controls, visible focus behavior, and mobile layouts.
- Use Lucide icons rather than hand-authored interface SVGs.
- Store durable records in Netlify Database, never local files or in-memory server state.

## Non-Obvious Decisions

The dashboard contains realistic seeded display data so the product value is visible before a salon has appointments. The authenticated salon name is loaded from Netlify Database when available. Local preview navigation remains usable because Netlify Identity requires a deployed Netlify environment for real sessions.

After changing `db/schema.ts`, generate a named migration with `npm run db:generate -- --name <imperative_snake_case_name>`. After changing Identity integration, ensure the Netlify Identity enable script from the installed skill has been run.

## Cursor Cloud specific instructions

- Install from the repository root with `npm ci`. Dependencies are locked in `package-lock.json`. There is no `pnpm-lock.yaml`.
- The app dev server is `npm run dev -- --host 0.0.0.0 --port 3000` (`http://localhost:3000`). `netlify.toml` sets Node 22. Netlify Identity cannot finish a real session on localhost. Use **Skip login — explore setup** (`/onboarding?demo=1`), complete the three setup steps, and confirm `/dashboard` shows the studio name. That path stores salon setup in browser local storage.
- `npm run build` is the production check. Unit tests: `npx tsx --test src/lib/proof-metrics.test.ts src/lib/competitor-scout.test.ts` (plain `node --test` cannot resolve the extensionless imports in `proof-metrics.ts`). `npx tsc --noEmit` currently reports an unused `ensureSalonSyncKey` import in `src/routes/dashboard.index.tsx`.
- Keys in `.env.example` are for billing, SMS, email, and agent features. The marketing site, onboarding preview, and seeded dashboard run without them.
