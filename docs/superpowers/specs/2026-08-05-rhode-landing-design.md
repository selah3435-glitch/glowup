# GlowUP. public site — Rhode-inspired light editorial

**Approved:** option 1 (light Rhode) + official logo asset  
**Scope:** homepage, login, onboarding (dashboard stays dark product UI)

## Brand

- Logo: `/brand/glowup-logo.jpg` — rose→gold **GlowUP.** wordmark on cream (slogan baked into art)
- Product slogan (copy): **Beauty Business, Beautifully Done.**
- Palette: cream `#F7F4EF`, paper `#FFFCF8`, ink `#1A1A1A`, rose `#C4787A`, gold `#C4A574`
- Hero: local `/hero-salon.jpg`

## Layout (Rhode rhythm)

1. Sticky minimal nav + logo  
2. Full-bleed hero + short H1  
3. Promo strip (pricing/Glo)  
4. Essentials card grid  
5. Philosophy block  
6. Story bands  
7. Glo flagship  
8. Proof metrics  
9. Pricing  
10. Quotes + final CTA + footer  

## Files

- `src/styles-rhode-marketing.css` — marketing + `.rhode-public` auth/onboarding overrides
- `src/routes/index.tsx` — `.marketing-page.rhode-look`
- `src/routes/login.tsx` / `onboarding.tsx` — `.rhode-public`
- `src/components/BrandLogo.tsx`
- `public/brand/glowup-logo.jpg`

## Note

Dashboard keeps dark chrome; BrandLogo uses a cream plate (`light` prop) so the rose/gold mark stays readable.
