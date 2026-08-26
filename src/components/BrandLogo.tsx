/** Official GlowUP. rose/gold wordmark (public/brand/glowup-logo.jpg) */

const LOGO_SRC = '/brand/glowup-logo.jpg'

export function BrandLogo({
  light = false,
  href = '/',
  showSlogan = false,
  compact = false,
}: {
  /** On dark surfaces: cream plate so rose/gold logo stays readable */
  light?: boolean
  href?: string
  showSlogan?: boolean
  compact?: boolean
}) {
  return (
    <a
      className={`brand-lockup brand-lockup-img ${light ? 'brand-light' : ''} ${compact ? 'brand-compact' : ''}`}
      href={href}
      aria-label="GlowUP. home — Beauty Business, Beautifully Done."
    >
      <span className={`brand-logo-frame ${light ? 'on-dark' : ''}`}>
        <img
          src={LOGO_SRC}
          alt="GlowUP. — Beauty Business, Beautifully Done."
          className="brand-logo-img"
          width={compact ? 120 : 168}
          height={compact ? 48 : 68}
          decoding="async"
        />
      </span>
      {/* Logo art already includes slogan; optional text only when mark is cropped/tiny */}
      {showSlogan && compact && (
        <span className="brand-slogan brand-slogan-text">Beauty Business, Beautifully Done.</span>
      )}
    </a>
  )
}
