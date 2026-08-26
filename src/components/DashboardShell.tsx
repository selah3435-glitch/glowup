import { Link, useRouterState } from '@tanstack/react-router'
import {
  CalendarDays,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  Menu,
  MessageCircleHeart,
  MoreHorizontal,
  Package,
  Search,
  Settings,
  Star,
  UserRound,
  UsersRound,
  X,
  Megaphone,
  Bot,
  Wrench,
  Sparkles,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useIdentity } from '../lib/identity-context'
import { BrandLogo } from './BrandLogo'

type NavItem = {
  to: '/dashboard' | '/dashboard/calendar' | '/dashboard/clients' | '/dashboard/leads' | '/dashboard/ops' | '/dashboard/platform' | '/dashboard/social' | '/dashboard/concierge'
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  soon?: boolean
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays, end: true },
  { to: '/dashboard/clients', label: 'Clients', icon: UsersRound, end: true },
  { to: '/dashboard/leads', label: 'Leads', icon: Sparkles, end: true },
  { to: '/dashboard/ops', label: 'Ops', icon: Wrench, end: true },
  { to: '/dashboard/platform', label: 'Platform', icon: UsersRound, end: true },
  { to: '/dashboard/social', label: 'Social', icon: Megaphone, end: false },
  { to: '/dashboard/concierge', label: 'Concierge', icon: Bot, end: false },
  { to: '/dashboard', label: 'Sales', icon: CreditCard, end: true, soon: true },
  { to: '/dashboard', label: 'Team', icon: UserRound, end: true, soon: true },
  { to: '/dashboard', label: 'Inventory', icon: Package, end: true, soon: true },
  { to: '/dashboard', label: 'Marketing', icon: Star, end: true, soon: true },
]

export function DashboardShell({
  children,
  salonName,
}: {
  children: ReactNode
  salonName: string
}) {
  const { user, logout } = useIdentity()
  const [mobileNav, setMobileNav] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  function isActive(to: string, end?: boolean) {
    if (end) return pathname === to || pathname === `${to}/`
    return pathname === to || pathname.startsWith(`${to}/`)
  }

  return (
    <main className="dashboard-page">
      <aside className={mobileNav ? 'dashboard-sidebar open' : 'dashboard-sidebar'}>
        <div className="sidebar-top">
          <BrandLogo light compact showSlogan />
          <button type="button" className="close-nav" onClick={() => setMobileNav(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="studio-switcher">
          <span>{salonName.slice(0, 2).toUpperCase()}</span>
          <div>
            <small>MY BUSINESS</small>
            <strong>{salonName}</strong>
          </div>
          <ChevronDown size={15} />
        </div>

        <nav>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = !item.soon && isActive(item.to, item.end)
            if (item.soon) {
              return (
                <button type="button" key={item.label} className="nav-soon" title="Coming in full SaaS spine">
                  <Icon size={18} />
                  <span>{item.label}</span>
                  <b>Soon</b>
                </button>
              )
            }
            return (
              <Link
                key={item.label}
                to={item.to}
                className={active ? 'active' : ''}
                onClick={() => setMobileNav(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.label === 'Social' && <b>AI</b>}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <button type="button">
            <Settings size={18} />
            Settings
          </button>
          <div className="support-card">
            <MessageCircleHeart size={20} />
            <strong>Glow Concierge</strong>
            <p>Agents draft. You approve. Always on-brand.</p>
            <Link to="/dashboard/concierge" onClick={() => setMobileNav(false)}>
              Open Concierge
            </Link>
          </div>
          <div className="user-card">
            <span>{(user?.email || salonName || 'GU').slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{user?.email?.split('@')[0] || salonName || 'Owner'}</strong>
              <small>{user?.email || 'This device'}</small>
            </div>
            {user ? (
              <button type="button" onClick={() => void logout()} aria-label="Sign out">
                <MoreHorizontal size={17} />
              </button>
            ) : (
              <a href="/login?next=/dashboard" aria-label="Sign in">
                Sign in
              </a>
            )}
          </div>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <button type="button" className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="dashboard-search">
            <Search size={17} />
            <input placeholder="Search clients, appointments, posts…" />
            <kbd>⌘ K</kbd>
          </div>
          <div className="header-actions">
            <Link className="button button-cream button-small" to="/dashboard/concierge">
              Concierge
            </Link>
            <Link className="button button-dark button-small" to="/dashboard/social/studio" search={{ from: undefined, trend: undefined, campaign: undefined }}>
              + New draft
            </Link>
          </div>
        </header>
        <div className="dashboard-content">{children}</div>
      </section>
    </main>
  )
}
