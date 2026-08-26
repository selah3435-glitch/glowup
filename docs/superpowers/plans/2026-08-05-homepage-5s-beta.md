# Homepage 5s Clarity + Beta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First-fold homepage so visitors know in ~5 seconds that GlowUP is a salon OS (live book + Glo chat), see an Overview dashboard mock, read two pain→fix cards, see open beta, and never get sold live phone voice before xAI voice credits exist.

**Architecture:** Marketing-only changes on the Rhode homepage. Remaster `hero-salon.jpg` with `image_edit`. Build a pure HTML/CSS `HeroDashboardPreview` component (no auth, static demo data). Restructure hero into split layout (copy + mock). Add pain band and beta chip. Demote Glo phone CTAs; promote chat. Dashboard product routes stay dark/unmodified.

**Tech Stack:** TanStack Start/React 19, existing Rhode CSS (`styles-rhode-marketing.css`), Lucide icons, local static assets under `public/`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-05-homepage-5s-beta-design.md` (approved).
- Public Rhode only — do not restyle dashboard product pages.
- Primary CTA copy: **Join the beta · free setup** → `/login?next=%2Fonboarding` (or existing `TRIAL_HREF`).
- Secondary CTA: **See the dashboard** → focus/scroll to `#hero-dashboard` (not Call Glo).
- Pain points fixed: (1) after-hours/missed demand → Glo **chat**; (2) multi-chair chaos → live calendar OS.
- **No primary `tel:` Glo CTA**; voice = “coming soon” until owner funds xAI voice console.
- Chat still books after hours (do not remove AiReceptionist booking; copy may say chat books after hours).
- Hero photo: slight remaster, remove third-party brand marks (YSL/Vogue-style), keep pink salon mood.
- YAGNI: no interactive live dashboard iframe, no new backend, no voice billing work.

## File map

| File | Responsibility |
|------|----------------|
| `public/hero-salon-original.jpg` | Backup of pre-remaster hero if not already present |
| `public/hero-salon.jpg` | Remastered hero background |
| `src/components/HeroDashboardPreview.tsx` | Static Overview mock for marketing hero |
| `src/styles-rhode-marketing.css` | Hero split, beta chip, pain cards, mock chrome |
| `src/routes/index.tsx` | Nav beta, hero copy/layout, pain band, Glo honesty, phone demote |
| `docs/superpowers/specs/2026-08-05-homepage-5s-beta-design.md` | Spec (already written; do not rewrite unless mismatch) |

---

### Task 1: Remaster hero salon image

**Files:**
- Create/keep: `public/hero-salon-original.jpg` (copy of current if missing)
- Modify: `public/hero-salon.jpg` (overwrite with remaster)
- Tool: Grok `image_edit` with source `E:\GlowUP-build\glowkiss-main\public\hero-salon.jpg`

**Interfaces:**
- Consumes: existing hero JPEG
- Produces: new `hero-salon.jpg` used by `HERO_BG = '/hero-salon.jpg'` in `index.tsx`

- [ ] **Step 1: Backup original**

```powershell
cd E:\GlowUP-build\glowkiss-main
if (-not (Test-Path public\hero-salon-original.jpg)) {
  Copy-Item public\hero-salon.jpg public\hero-salon-original.jpg
}
```

- [ ] **Step 2: Run image_edit (slight makeover)**

Prompt (use essentially this):

> Soft editorial remaster of this luxury pink salon interior. Keep the same room layout, pink sofas, white marble floor, styling stations, and bright modern lighting. Slightly warmer cream-rose color grade to match a beauty brand. Replace wall art that shows Vogue mastheads or YSL monograms with abstract black-and-white fashion photography and simple geometric gold line art with no brand logos or readable brand names. Keep photorealistic, high-end salon photography look. No text overlays, no watermarks, no people at the chairs.

Source image: absolute path to `public/hero-salon.jpg` (or original backup).

- [ ] **Step 3: Save tool output over `public/hero-salon.jpg`**

Copy the generated file into `public/hero-salon.jpg` (and ensure `public/brand` assets untouched).

- [ ] **Step 4: Visual check**

Open the new JPEG with the read/image tool. Confirm: no readable YSL/Vogue-style marks; still pink salon; not a totally different room.

- [ ] **Step 5: Commit**

```bash
git add public/hero-salon.jpg public/hero-salon-original.jpg
git commit -m "assets: remaster hero salon photo for brand-safe uniqueness"
```

---

### Task 2: HeroDashboardPreview component

**Files:**
- Create: `src/components/HeroDashboardPreview.tsx`
- Test: visual + `npm run build` (no unit test harness required; smoke via build)

**Interfaces:**
- Consumes: none (static demo data only)
- Produces: `export function HeroDashboardPreview()` — presentational React component with root `id="hero-dashboard"` and class `rd-dash-preview`

- [ ] **Step 1: Create component skeleton**

```tsx
/** Marketing-only Overview mock — not connected to real data/auth */
export function HeroDashboardPreview() {
  return (
    <div id="hero-dashboard" className="rd-dash-preview" aria-label="Stylist dashboard preview">
      <div className="rd-dash-chrome">
        <span className="rd-dash-badge">Stylist dashboard · beta preview</span>
        <aside className="rd-dash-side">
          <div className="rd-dash-logo">GlowUP.</div>
          <div className="rd-dash-studio">
            <small>MY BUSINESS</small>
            <strong>Lumen Collective</strong>
          </div>
          <nav className="rd-dash-nav">
            <span className="active">Overview</span>
            <span>Calendar</span>
            <span>Clients</span>
            <span>Leads</span>
            <span>Glo</span>
          </nav>
        </aside>
        <div className="rd-dash-main">
          <header className="rd-dash-welcome">
            <p>OWNER HOME · FLOOR PLAN</p>
            <h3>Welcome, Amelia.</h3>
            <span>Live book · Glo chat · CRM online</span>
          </header>
          <div className="rd-dash-metrics">
            <article>
              <span>Today’s book</span>
              <strong>12 <small>live</small></strong>
            </article>
            <article>
              <span>After-hours AI</span>
              <strong>4</strong>
            </article>
            <article>
              <span>Returning</span>
              <strong>78%</strong>
            </article>
          </div>
          <div className="rd-dash-upcoming">
            <div className="rd-dash-up-head">
              <strong>Upcoming</strong>
              <em>Glo chat booked 2 after hours</em>
            </div>
            <ul>
              <li><b>Maya R.</b> · Balayage · 10:00 · Noor</li>
              <li><b>Jordan K.</b> · Cut + gloss · 11:30 · Amelia</li>
              <li><b>Priya S.</b> · Blowout · 1:00 · Glo hold</li>
            </ul>
          </div>
          <div className="rd-dash-glo-chip">Glo chat · books the live calendar after hours</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify export is pure (no `useIdentity`, no stores)**

Grep the new file for `localStorage`, `useIdentity`, `book_appointment` — must be zero matches.

- [ ] **Step 3: Commit**

```bash
git add src/components/HeroDashboardPreview.tsx
git commit -m "feat: add marketing HeroDashboardPreview mock"
```

---

### Task 3: Rhode CSS for hero split, beta chip, pain cards, mock

**Files:**
- Modify: `src/styles-rhode-marketing.css` (append after existing hero / before auth section)

**Interfaces:**
- Consumes: classes from Task 2 + new classes used in Task 4
- Produces: styles for `.rd-beta-chip`, `.rd-hero-split`, `.rd-dash-preview*`, `.rd-pain*`

- [ ] **Step 1: Append CSS** (adapt tokens to existing `--rd-*` variables)

Key rules to add:

```css
/* Beta chip */
.rd-beta-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fff;
  background: var(--rd-rose);
  white-space: nowrap;
}
.rd-nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Hero becomes split over media */
.rd-hero.rd-hero-product {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: end;
  min-height: min(90vh, 860px);
  place-items: unset;
}
.rd-hero.rd-hero-product .rd-hero-copy {
  max-width: none;
  padding: 8% 6% 8% 5%;
}
.rd-hero.rd-hero-product .rd-hero-product-pane {
  position: relative;
  z-index: 2;
  padding: 6% 5% 6% 2%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* Dashboard mock chrome (dark product-ish) */
.rd-dash-preview {
  width: min(100%, 440px);
  transform: rotate(-1.5deg);
  filter: drop-shadow(0 28px 50px rgba(26, 26, 26, 0.28));
}
.rd-dash-chrome {
  display: grid;
  grid-template-columns: 118px 1fr;
  background: #141012;
  color: #faf4f6;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
  min-height: 340px;
}
.rd-dash-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(196, 120, 122, 0.95);
  color: #fff;
  font-weight: 600;
}
.rd-dash-side {
  background: #0c0a0b;
  padding: 16px 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11px;
}
.rd-dash-logo { font-family: var(--rd-serif); font-size: 14px; color: #e8a8b4; margin-bottom: 14px; }
.rd-dash-studio small { display: block; font-size: 8px; letter-spacing: 0.12em; color: #9a8a8e; }
.rd-dash-studio strong { font-size: 11px; }
.rd-dash-nav { display: grid; gap: 6px; margin-top: 16px; color: #9a8a8e; }
.rd-dash-nav .active { color: #faf4f6; font-weight: 600; }
.rd-dash-main { padding: 28px 16px 16px; }
.rd-dash-welcome p { margin: 0; font-size: 9px; letter-spacing: 0.14em; color: #e8a8b4; }
.rd-dash-welcome h3 { margin: 6px 0 4px; font-family: var(--rd-serif); font-weight: 400; font-size: 22px; }
.rd-dash-welcome span { font-size: 11px; color: #9a8a8e; }
.rd-dash-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 14px 0;
}
.rd-dash-metrics article {
  background: #1a1416;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 10px 8px;
}
.rd-dash-metrics span { display: block; font-size: 9px; color: #9a8a8e; }
.rd-dash-metrics strong { font-family: var(--rd-serif); font-size: 18px; font-weight: 400; }
.rd-dash-metrics small { font-size: 10px; color: #9a8a8e; }
.rd-dash-upcoming {
  background: #1a1416;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.rd-dash-up-head { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; margin-bottom: 8px; }
.rd-dash-up-head em { font-style: normal; color: #c4787a; font-size: 10px; }
.rd-dash-upcoming ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 11px; color: #d4c4c8; }
.rd-dash-glo-chip {
  margin-top: 10px;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0c0a0b;
  background: linear-gradient(90deg, #e8a8b4, #c4a574);
  padding: 8px 10px;
  border-radius: 999px;
  text-align: center;
  font-weight: 600;
}

/* Pain band */
.rd-pain {
  padding: 64px 5%;
  max-width: 1100px;
  margin: 0 auto;
}
.rd-pain-head { max-width: 520px; margin-bottom: 28px; }
.rd-pain-head h2 {
  margin: 0 0 10px;
  font-family: var(--rd-serif);
  font-weight: 400;
  font-size: clamp(1.7rem, 3vw, 2.4rem);
}
.rd-pain-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.rd-pain-card {
  background: var(--rd-paper);
  border: 1px solid var(--rd-line);
  border-radius: 16px;
  padding: 22px 20px;
}
.rd-pain-card h3 {
  margin: 0 0 8px;
  font-family: var(--rd-serif);
  font-weight: 400;
  font-size: 1.35rem;
}
.rd-pain-card .pain { margin: 0 0 12px; color: var(--rd-muted); font-size: 14px; line-height: 1.55; }
.rd-pain-card .fix {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--rd-ink);
  padding-top: 12px;
  border-top: 1px solid var(--rd-line);
}
.rd-pain-card .fix strong { color: var(--rd-rose); }
.rd-pain-foot {
  margin: 20px 0 0;
  font-size: 13px;
  color: var(--rd-muted);
}

@media (max-width: 900px) {
  .rd-hero.rd-hero-product {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .rd-hero.rd-hero-product .rd-hero-product-pane {
    padding: 0 5% 8%;
  }
  .rd-dash-preview {
    width: 100%;
    transform: none;
  }
  .rd-pain-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Confirm no broken existing `.rd-hero` rules**

Keep base `.rd-hero` media/shade absolute; `.rd-hero-product` only changes grid placement of copy + pane.

- [ ] **Step 3: Commit**

```bash
git add src/styles-rhode-marketing.css
git commit -m "style: hero product split, dashboard mock, pain band, beta chip"
```

---

### Task 4: Wire homepage (nav, hero, pain, Glo honesty)

**Files:**
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: `HeroDashboardPreview` from Task 2
- Produces: updated Home JSX matching approved copy

- [ ] **Step 1: Imports**

Add:

```tsx
import { HeroDashboardPreview } from '../components/HeroDashboardPreview'
```

Keep `GLO_PHONE_*` only if still referenced for “coming soon” copy; remove nav `tel:` link.

- [ ] **Step 2: Nav brand + beta, remove phone CTA**

Replace header brand area with:

```tsx
<header className="rd-nav">
  <div className="rd-nav-brand">
    <BrandLogo href="/" showSlogan={false} />
    <span className="rd-beta-chip">Open beta</span>
  </div>
  <nav className="rd-nav-links" aria-label="Primary">
    <a href="#essentials">Product</a>
    <a href="#pain">Why GlowUP</a>
    <a href="#pricing">Pricing</a>
    <a href="#glo">Glo</a>
    <a className="rd-nav-cta" href={TRIAL_HREF}>
      Join the beta
    </a>
  </nav>
</header>
```

- [ ] **Step 3: Hero product split**

Replace hero section body with:

```tsx
<section className="rd-hero rd-hero-product" id="home">
  <div className="rd-hero-media" aria-hidden>
    <img src={HERO_BG} alt="" />
    <div className="rd-hero-shade" />
  </div>
  <div className="rd-hero-copy">
    <p className="rd-kicker">Open beta · Salon OS for stylists &amp; owners</p>
    <h1>
      The floor that
      <br />
      <em>books itself.</em>
    </h1>
    <p className="rd-lede">
      GlowUP. is the salon operating system: one live multi-stylist calendar, Glo AI chat front desk,
      clients + deposits — from single chair to multi-location. No tool switch as you grow.
    </p>
    <div className="rd-cta-row">
      <a className="rd-btn-primary" href={TRIAL_HREF}>
        Join the beta · free setup <ChevronRight size={16} />
      </a>
      <button
        type="button"
        className="rd-btn-ghost"
        onClick={() => document.getElementById('hero-dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
      >
        See the dashboard
      </button>
    </div>
  </div>
  <div className="rd-hero-product-pane">
    <HeroDashboardPreview />
  </div>
</section>
```

- [ ] **Step 4: Promo strip beta language**

```tsx
<div className="rd-strip">
  Open beta · Solo $39 · Floor $149 · Brand $299+ · Glo chat included · Voice coming soon
</div>
```

- [ ] **Step 5: Pain band after strip**

```tsx
<section className="rd-pain" id="pain">
  <div className="rd-pain-head">
    <p className="rd-kicker">why floors switch</p>
    <h2>Two problems. One OS.</h2>
  </div>
  <div className="rd-pain-grid">
    <article className="rd-pain-card">
      <h3>After-hours demand dies in voicemail</h3>
      <p className="pain">
        You’re in color, the phone rings, DMs stack at 9pm — and tomorrow’s book never fills.
      </p>
      <p className="fix">
        <strong>Fix:</strong> Glo AI chat (beta) answers and books holds on your live multi-stylist calendar —
        including after hours. Phone voice is coming soon (not live yet).
      </p>
    </article>
    <article className="rd-pain-card">
      <h3>Multi-chair chaos as you grow</h3>
      <p className="pain">
        Double-books, sticky notes, and apps that break the moment you hire stylist #2.
      </p>
      <p className="fix">
        <strong>Fix:</strong> One live calendar OS + clients, formulas, and deposits — booth to brand without a
        forced re-platform.
      </p>
    </article>
  </div>
  <p className="rd-pain-foot">
    You’re joining an open beta — free setup while we pilot with real floors.
  </p>
</section>
```

- [ ] **Step 6: Glo section honesty**

Update Glo flagship copy and CTAs:

- Body: emphasize **chat** books on the live calendar after hours; **voice coming soon**.
- Remove primary `tel:` links or replace with plain text “Voice coming soon”.
- Buttons: `Open Glo chat` (click `.ai-rec-fab`) + `Join the beta`.

- [ ] **Step 7: Final CTA beta language**

```tsx
<a className="rd-btn-primary" href={TRIAL_HREF}>
  Join the beta · free setup <ChevronRight size={16} />
</a>
```

- [ ] **Step 8: Build smoke**

```powershell
cd E:\GlowUP-build\glowkiss-main
npm run build
```

Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: homepage 5s product hero, pain band, open beta, honest Glo"
```

---

### Task 5: Generate HTML + deploy verify (optional if credits/deploy requested)

**Files:**
- Run: `node E:\GlowUP-build\generate-html.mjs`
- Deploy: `npm run deploy:full` or API script per existing scripts

- [ ] **Step 1: Generate static index**

```powershell
cd E:\GlowUP-build\glowkiss-main
node E:\GlowUP-build\generate-html.mjs
```

Expected: `Wrote dist/client/index.html`

- [ ] **Step 2: Confirm dist has assets**

```powershell
Test-Path dist\client\index.html
Test-Path dist\client\hero-salon.jpg
Test-Path dist\client\brand\glowup-logo.jpg
```

Expected: all `True`.

- [ ] **Step 3: Deploy only if user asked**

Use `npm run deploy:full` or `scripts/deploy-netlify-api.ps1` + functions CLI path already proven.

- [ ] **Step 4: Manual checklist on live/local**

- [ ] Nav shows Open beta  
- [ ] Hero shows dashboard mock without scrolling (desktop)  
- [ ] Pain section has 2 cards  
- [ ] No primary Call Glo phone CTA  
- [ ] Glo chat FAB still present; booking path intact  
- [ ] Hero image has no third-party brand marks  

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| 5s product clarity (copy + mock) | 2, 3, 4 |
| Overview dashboard mock first fold | 2, 3, 4 |
| Pain: after-hours + multi-chair | 4 |
| Open beta visible | 3, 4 |
| No live voice claim / demote phone | 4 |
| Chat still books after hours (don’t break) | 4 Step 6 keeps AiReceptionist |
| Hero remaster unique/brand-safe | 1 |
| Dashboard product code unchanged | (no tasks touch dashboard routes) |

Placeholder scan: none intentional.  
Type consistency: `HeroDashboardPreview` export name fixed across Task 2–4.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-05-homepage-5s-beta.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — this session with executing-plans, batch + checkpoints  

**Which approach?**
