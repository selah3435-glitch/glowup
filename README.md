# GlowUP

GlowUP is a mobile-first **salon operating system** for single stylists, multi-stylist floors, and multi-location brands. It combines a refined client-facing brand experience with guided setup and an owner dashboard for multi-stylist appointments, revenue, rebooking, clients, products, Glo AI front desk, and daily operations.

**Product docs (read these):** `PRODUCT.md` · `DESIGN.md` · `GLOWUP_PROGRESS.md` · `docs/ARCHITECTURE_GROWTH.md`  
**Session backup:** also saved at `C:\Users\Student\Downloads\GlowUP_PROGRESS_AND_DECISIONS.md`

AI is branded **Glow Agents** + **Glow Concierge** (connected to JAWSAI911 as builder/ecosystem). Dashboard foundations: `/dashboard/social`, `/dashboard/concierge`.

## Experience

- Editorial marketing site with a premium beauty-industry visual direction
- Netlify Identity sign-in, account creation, OAuth, and auth callback handling
- Three-step salon onboarding for studio details, services, and brand tone
- Netlify Database persistence for authenticated salon profiles
- Responsive owner dashboard with appointment flow, performance metrics, revenue insights, rebooking prompts, and inventory alerts
- Interactive preview path for reviewing the product before authentication is available

## Technology

- TanStack Start and React 19
- TypeScript and Tailwind CSS 4
- Netlify Identity via `@netlify/identity`
- Netlify Database with Drizzle ORM
- Netlify Functions
- Lucide React icons

## Local Development

Install dependencies and run the project through Netlify Dev so functions and platform routing are available:

```bash
pnpm install
/opt/buildhome/node-deps/node_modules/.bin/netlify dev --port 8889
```

Open `http://localhost:8889/login?next=%2Fonboarding` to enter the product flow. Netlify Identity sessions require a deployed Netlify preview or production URL, so use **Explore the interactive preview** when working locally.

## Database

The salon schema is defined in `db/schema.ts`. Netlify applies generated migrations from `netlify/database/migrations` during deployment. After changing the schema, create a migration with:

```bash
pnpm db:generate -- --name add_descriptive_change
```

No connection string is required; Netlify provisions and connects the managed database automatically.
