import { createFileRoute, Link } from '@tanstack/react-router'
import { Phone, Plus, RefreshCw, Search, UserRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  addClient,
  clientVisitStats,
  listClients,
  syncClientsFromAppointments,
  updateClient,
  type Client,
} from '../lib/clients-store'

export const Route = createFileRoute('/dashboard/clients')({
  component: ClientsPage,
})

function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [q, setQ] = useState('')
  const [toast, setToast] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Client | null>(null)

  const refresh = useCallback(() => {
    setClients(listClients())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function toastMsg(m: string) {
    setToast(m)
    window.setTimeout(() => setToast(''), 2800)
  }

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        c.phone.includes(t) ||
        c.email.toLowerCase().includes(t) ||
        c.formulas.toLowerCase().includes(t),
    )
  }, [clients, q])

  function onSync() {
    const n = syncClientsFromAppointments()
    refresh()
    toastMsg(n ? `Synced ${n} new client(s) from the book.` : 'Clients already match bookings.')
  }

  return (
    <>
      {toast && (
        <div className="toast">
          <span className="toast-check">✓</span>
          {toast}
        </div>
      )}

      <div className="welcome-row">
        <div>
          <p>CLIENT CRM</p>
          <h1>Clients</h1>
          <span>Formulas, notes, and visit history — filled from AI bookings and owner adds.</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="button-cream cal-add-btn" onClick={onSync} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.15)', color: 'inherit' }}>
            <RefreshCw size={15} /> Sync from book
          </button>
          <button type="button" className="button-dark cal-add-btn" onClick={() => setShowAdd((v) => !v)}>
            <Plus size={16} /> {showAdd ? 'Close' : 'Add client'}
          </button>
        </div>
      </div>

      <div className="crm-toolbar">
        <Search size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, formula…"
          aria-label="Search clients"
        />
      </div>

      {showAdd && (
        <AddClientForm
          onSaved={() => {
            setShowAdd(false)
            refresh()
            toastMsg('Client saved.')
          }}
        />
      )}

      <div className="crm-layout">
        <section className="schedule-card crm-list-card">
          <div className="card-heading">
            <div>
              <span>DIRECTORY</span>
              <h2>{filtered.length} clients</h2>
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="booking-holds-empty">
              No clients yet. Book via <strong>AI Receptionist</strong>, or <strong>Sync from book</strong> / Add client.
            </p>
          ) : (
            <ul className="crm-list">
              {filtered.map((c) => {
                const stats = clientVisitStats(c)
                return (
                  <li key={c.id}>
                    <button type="button" className={selected?.id === c.id ? 'active' : ''} onClick={() => setSelected(c)}>
                      <span className="client-avatar rose">{c.name.slice(0, 2).toUpperCase()}</span>
                      <div>
                        <strong>{c.name}</strong>
                        <small>
                          {c.phone} · {stats.total} visits · last {stats.lastService}
                        </small>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="schedule-card crm-detail-card">
          {!selected ? (
            <p className="booking-holds-empty">Select a client to view formulas and notes.</p>
          ) : (
            <ClientDetail
              client={selected}
              onSave={(next) => {
                updateClient(selected.id, next)
                refresh()
                setSelected({ ...selected, ...next, updatedAt: new Date().toISOString() })
                toastMsg('Client updated.')
              }}
            />
          )}
        </section>
      </div>

      <p className="demo-data-banner">
        CRM MVP on this device · Links to calendar by phone ·{' '}
        <Link to="/dashboard/calendar">Open calendar</Link>
      </p>
    </>
  )
}

function AddClientForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || phone.replace(/\D/g, '').length < 7) return
    addClient({ name, phone, email })
    onSaved()
  }

  return (
    <form className="cal-add-form" onSubmit={onSubmit}>
      <h3>New client</h3>
      <div className="cal-add-grid">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label className="full">
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </label>
      </div>
      <button type="submit" className="button-dark">
        Save client
      </button>
    </form>
  )
}

function ClientDetail({
  client,
  onSave,
}: {
  client: Client
  onSave: (patch: Partial<Client>) => void
}) {
  const [formulas, setFormulas] = useState(client.formulas)
  const [preferences, setPreferences] = useState(client.preferences)
  const [notes, setNotes] = useState(client.notes)
  const stats = clientVisitStats(client)

  useEffect(() => {
    setFormulas(client.formulas)
    setPreferences(client.preferences)
    setNotes(client.notes)
  }, [client.id, client.formulas, client.preferences, client.notes])

  return (
    <div className="crm-detail">
      <div className="card-heading">
        <div>
          <span>PROFILE</span>
          <h2>{client.name}</h2>
        </div>
        <a href={`tel:${client.phone}`} className="booking-hold-phone">
          <Phone size={14} /> {client.phone}
        </a>
      </div>
      <div className="crm-stats">
        <div>
          <strong>{stats.total}</strong>
          <span>visits</span>
        </div>
        <div>
          <strong>{stats.upcoming}</strong>
          <span>upcoming</span>
        </div>
        <div>
          <strong>{stats.lastVisit}</strong>
          <span>last visit</span>
        </div>
      </div>
      <label>
        Color formulas
        <textarea value={formulas} onChange={(e) => setFormulas(e.target.value)} rows={3} placeholder="e.g. 7N + 20vol gloss…" />
      </label>
      <label>
        Preferences
        <textarea value={preferences} onChange={(e) => setPreferences(e.target.value)} rows={2} placeholder="Pressure, chatter, scent…" />
      </label>
      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </label>
      <button
        type="button"
        className="button-dark"
        onClick={() => onSave({ formulas, preferences, notes })}
      >
        <UserRound size={15} /> Save profile
      </button>
    </div>
  )
}
