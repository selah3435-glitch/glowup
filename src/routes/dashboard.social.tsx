import { Link, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/social')({
  component: SocialLayout,
})

const tabs = [
  { to: '/dashboard/social', label: 'Pulse', end: true },
  { to: '/dashboard/social/studio', label: 'Studio', end: false },
  { to: '/dashboard/social/schedule', label: 'Schedule', end: false },
  { to: '/dashboard/social/brand', label: 'Brand', end: false },
  { to: '/dashboard/social/campaigns', label: 'Campaigns', end: false },
] as const

function SocialLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <div className="social-module">
      <div className="social-header">
        <div>
          <p className="eyebrow-inline">GROWTH OS</p>
          <h1>Social</h1>
          <span>Glow Agents draft. You approve. Assist publish for Facebook → Instagram → TikTok.</span>
        </div>
        <Link className="button button-dark button-small" to="/dashboard/social/studio" search={{ from: undefined, trend: undefined, campaign: undefined }}>
          + New draft
        </Link>
      </div>

      <nav className="social-tabs" aria-label="Social sections">
        {tabs.map((tab) => {
          const active = tab.end
            ? pathname === tab.to || pathname === `${tab.to}/`
            : pathname.startsWith(tab.to)
          return (
            <Link key={tab.label} to={tab.to} className={active ? 'active' : ''}>
              {tab.label}
            </Link>
          )
        })}
      </nav>

      <Outlet />
    </div>
  )
}
