# DESIGN.md — GlowUP

## Scene

Salon owners and stylists on phones and front-desk tablets between clients; dim studio light; premium calm, not neon SaaS.

## Theme

**Dark product default** — near-black canvas, gold accent, cream ink. Marketing can match.

## Color strategy

**Committed** gold on tinted dark neutrals.

| Token | Role | Value (current) |
|---|---|---|
| `--black` | Page bg | `#0a0a0a` |
| `--paper` / `--card` | Surfaces | `#1c1c1c` / `#161616` |
| `--ink` | Primary text | `#f5f0e6` |
| `--muted` | Secondary | `#8c827f` |
| `--gold` | Accent | `#e0bb87` |
| `--gold-light` | Hover/light gold | `#f0d9b0` |
| `--line` | Borders | `#363837` / `#2e2a22` |
| `--wine` | Deep panels | `#111111` |

Use OKLCH when refactoring tokens. Never pure `#000` / `#fff` for large areas if avoidable; tint neutrals.

## Typography

- **Display:** Playfair Display (serif) — titles only  
- **UI:** DM Sans — body, labels, controls  
- **Minimum UI text:** 12px body, 11px labels (fix legacy 6–9px dashboard type)  
- Hierarchy ≥ 1.25 scale steps  

## Layout

- Dashboard sidebar ~235px; main content max ~1200–1340 content width  
- Prefer hairline gold borders at low opacity over heavy cards  
- Nested cards discouraged  
- Social Pulse: max 3 action cards  

## Motion

- 150–250ms ease-out fades  
- No bounce/elastic  
- Avoid animating layout properties  

## Components

- Buttons: gold filled (primary), gold outline (secondary)  
- Inputs: dark card fill, gold/rose focus ring  
- Toasts: deep panel + gold check  
- Concierge: editorial panel, not chatbot bubble farm  

## Absolute bans

- Gradient text  
- Decorative glassmorphism as default  
- Side-stripe alert cliché as primary pattern  
- Purple “AI” gradients  
- Confetti gamification  
- Identical icon+title+text card grids as the only feature pattern  

## AI surfaces

- Label: “Glow Concierge” / “Glow Agents”  
- Assist actions: structured variants (max 3 captions), not endless chat  
- Quiet status: “Draft ready”, “Needs approval” — gold not alarm red  

## Accessibility

- Visible focus  
- Contrast on gold/dark pairs checked  
- Touch targets ≥ 44px where possible  
- Don’t rely on color alone for status  
