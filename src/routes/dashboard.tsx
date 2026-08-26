import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DashboardShell } from '../components/DashboardShell'
import { purgeDemoAppointmentsIfOnboarded } from '../lib/calendar-store'
import {
  ensureSalonDeskBookingUrl,
  pullFromCloud,
  pushToCloud,
  resolveCloudSalon,
  setCloudIdentityMeta,
} from '../lib/cloud-sync'
import { DEFAULT_SALON, loadSalonContext, saveSalonContext } from '../lib/demo-salon'
import { useIdentity } from '../lib/identity-context'
import { enableCloudSync } from '../lib/ops-auto-sync'
import { ensureSalonSyncKey, loadOpsSettings, saveOpsSettings } from '../lib/ops-settings'
import { isOnboarded, loadPilotSession } from '../lib/pilot-session'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const [salonName, setSalonName] = useState(DEFAULT_SALON.name)
  const [gate, setGate] = useState<'ok' | 'login' | 'wait'>('wait')
  const { user, ready } = useIdentity()

  useEffect(() => {
    if (!ready) return
    if (user || isOnboarded() || loadPilotSession()?.email) {
      setGate('ok')
      return
    }
    setGate('login')
    const next = encodeURIComponent('/dashboard')
    window.location.assign(`/login?next=${next}`)
  }, [ready, user])

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search)
      if (
        q.get('checkout') === 'success' &&
        (q.get('plan') === 'solo' || q.get('plan') === 'floor' || q.get('plan') === 'brand')
      ) {
        window.localStorage.setItem('glowup_selected_plan_v1', q.get('plan')!)
        window.localStorage.setItem('glowup_checkout_session', q.get('session_id') || '')
      }
    } catch {
      /* ignore */
    }

    const local = loadSalonContext()
    setSalonName(local.name)

    void fetch('/api/onboarding')
      .then(async (response) => {
        if (!response.ok) return
        const data = (await response.json()) as {
          name?: string
          brandTone?: string
          city?: string
          services?: string[]
          externalBookingUrl?: string
          partnerOrg?: string
        }
        if (data.name) {
          setSalonName(data.name)
          saveSalonContext({
            name: data.name,
            brandTone: data.brandTone ?? local.brandTone,
            city: data.city ?? local.city,
            services: data.services ?? local.services,
            externalBookingUrl: data.externalBookingUrl || local.externalBookingUrl,
            partnerOrg: data.partnerOrg ?? local.partnerOrg,
          })
        }
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (gate !== 'ok') return
    purgeDemoAppointmentsIfOnboarded()

    if (user) {
      setCloudIdentityMeta({
        identityUserId: user.id || '',
        email: user.email || '',
      })
      if (user.email) {
        saveOpsSettings({ ownerNotifyEmail: loadOpsSettings().ownerNotifyEmail || user.email })
      }
    }

    let cancelled = false
    void (async () => {
      await resolveCloudSalon()
      if (cancelled) return
      enableCloudSync()
      ensureSalonSyncKey()
      const deskUrl = ensureSalonDeskBookingUrl()
      const salon = loadSalonContext()
      const ops = loadOpsSettings()
      saveOpsSettings({
        studioName: salon.name || ops.studioName,
        city: salon.city || ops.city,
        hours: salon.hours || ops.hours,
        services: salon.services?.length ? salon.services : ops.services,
      })
      if (salon.name) setSalonName(salon.name)
      if (!salon.externalBookingUrl) {
        saveSalonContext({ externalBookingUrl: deskUrl })
      }

      const pull = await pullFromCloud()
      if (cancelled) return
      if (pull.ok) {
        const flag = 'glowup_ops_pulled_session'
        if (!sessionStorage.getItem(flag)) {
          sessionStorage.setItem(flag, '1')
          window.location.reload()
          return
        }
      } else {
        await pushToCloud()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [gate, user])

  if (gate !== 'ok') {
    return (
      <div className="page-wrap" style={{ padding: '2rem' }}>
        <p className="muted-copy">{gate === 'login' ? 'Redirecting to sign in…' : 'Loading studio…'}</p>
      </div>
    )
  }

  return (
    <DashboardShell salonName={salonName}>
      {!user && (
        <p className="demo-data-banner">
          You are on this device only. Sign in at <a href="/login">/login</a> so the cloud book follows you.
        </p>
      )}
      <Outlet />
    </DashboardShell>
  )
}
