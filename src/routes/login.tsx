import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AuthError, MissingIdentityError, login, oauthLogin, signup } from '@netlify/identity'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useIdentity } from '../lib/identity-context'
import { trackPlatformEvent } from '../lib/platform-client'
import {
  isOnboarded,
  loadPilotSession,
  postAuthPath,
  savePilotSession,
} from '../lib/pilot-session'
import { BrandLogo } from '../components/BrandLogo'
import { trackEvent } from '../lib/analytics'

export const Route = createFileRoute('/login')({ component: LoginPage })

function persistPlanFromUrl() {
  if (typeof window === 'undefined') return
  const p = new URLSearchParams(window.location.search).get('plan')
  if (p === 'solo' || p === 'floor' || p === 'brand') {
    try {
      window.localStorage.setItem('glowup_selected_plan_v1', p)
    } catch {
      /* ignore */
    }
  }
}

function LoginPage() {
  const navigate = useNavigate()
  const { user, ready } = useIdentity()
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [name, setName] = useState(() => loadPilotSession()?.name || '')
  const [email, setEmail] = useState(() => loadPilotSession()?.email || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'ok' | 'warn' | 'err'>('ok')
  const [loading, setLoading] = useState(false)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)

  const nextPath = useMemo(() => {
    if (typeof window === 'undefined') return postAuthPath()
    persistPlanFromUrl()
    const n = new URLSearchParams(window.location.search).get('next')
    if (n && n.startsWith('/')) return n as '/onboarding' | '/dashboard'
    return postAuthPath()
  }, [])

  // Already signed in → right place
  if (ready && user) {
    persistPlanFromUrl()
    void navigate({ to: isOnboarded() ? '/dashboard' : '/onboarding' })
    return (
      <main className="auth-page">
        <section className="auth-form-wrap" style={{ margin: 'auto' }}>
          <p className="form-message">You’re signed in — opening your studio…</p>
        </section>
      </main>
    )
  }

  async function enterStudio(path?: string) {
    const dest = path || nextPath || postAuthPath()
    await navigate({ to: dest as '/onboarding' | '/dashboard' })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setMessageTone('ok')
    setLoading(true)
    setAwaitingConfirm(false)

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    if (!cleanEmail.includes('@')) {
      setMessage('Enter a valid email so we can save your salon.')
      setMessageTone('err')
      setLoading(false)
      return
    }
    if (password.length < 8) {
      setMessage('Password needs at least 8 characters.')
      setMessageTone('err')
      setLoading(false)
      return
    }
    if (mode === 'signup' && cleanName.length < 2) {
      setMessage('Add your name so the studio feels personal.')
      setMessageTone('err')
      setLoading(false)
      return
    }

    try {
      if (mode === 'signup') {
        trackEvent('sign_up_click', { method: 'email' })
        const newUser = await signup(cleanEmail, password, { full_name: cleanName })
        savePilotSession({
          email: cleanEmail,
          name: cleanName,
          mode: 'identity',
        })
        void trackPlatformEvent({
          email: cleanEmail,
          name: cleanName,
          identityUserId: newUser?.id,
          stage: 'signed_up',
          meta: { source: 'login_page', confirmed: Boolean(newUser?.confirmedAt) },
        })

        if (!newUser?.confirmedAt) {
          // Pilot: don’t strand them — they can continue setup now
          setAwaitingConfirm(true)
          setMessageTone('warn')
          setMessage(
            'Almost there — check email to confirm when you can. You can open your studio now without waiting.',
          )
          setLoading(false)
          return
        }
      } else {
        await login(cleanEmail, password)
        savePilotSession({
          email: cleanEmail,
          name: cleanName || loadPilotSession()?.name || cleanEmail.split('@')[0],
          mode: 'identity',
        })
      }
      await enterStudio()
    } catch (error) {
      if (error instanceof MissingIdentityError) {
        // Zero-friction guest pilot when Identity client isn’t ready
        savePilotSession({
          email: cleanEmail,
          name: cleanName || cleanEmail.split('@')[0],
          mode: 'guest',
        })
        void trackPlatformEvent({
          email: cleanEmail,
          name: cleanName,
          stage: 'signed_up',
          meta: { source: 'guest_seamless' },
        })
        setMessageTone('ok')
        setMessage('Studio unlocked — setting up your floor…')
        await enterStudio('/onboarding')
      } else if (error instanceof AuthError) {
        const status = error.status
        if (status === 401) {
          setMessageTone('err')
          setMessage(
            mode === 'login'
              ? 'That email and password don’t match. Try again or create an account.'
              : 'Couldn’t create that account. Try signing in if you already registered.',
          )
        } else if (status === 422 || /exist|registered|already/i.test(error.message)) {
          setMessageTone('warn')
          setMessage('That email may already be registered. Switch to Sign in, or continue as guest setup.')
          setMode('login')
        } else {
          setMessageTone('err')
          setMessage(error.message || 'Sign-in hit a snag. Please try again.')
        }
      } else {
        // Last resort: never leave pilot stuck
        savePilotSession({
          email: cleanEmail,
          name: cleanName || cleanEmail.split('@')[0],
          mode: 'guest',
        })
        void trackPlatformEvent({
          email: cleanEmail,
          name: cleanName,
          stage: 'signed_up',
          meta: {
            source: 'recover_continue',
            err: error instanceof Error ? error.message : 'unknown',
          },
        })
        setMessageTone('ok')
        setMessage('We saved your studio setup locally and will keep going.')
        await enterStudio('/onboarding')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page rhode-public">
      <section className="auth-visual">
        <BrandLogo href="/" showSlogan />
        <div className="auth-art">
          <div className="auth-sun" />
          <div className="auth-face" />
          <div className="auth-leaf leaf-a" />
          <div className="auth-leaf leaf-b" />
          <div className="auth-leaf leaf-c" />
        </div>
        <div className="auth-quote">
          <blockquote>
            One book for every chair. Glo holds after hours onto the live calendar — not a voicemail graveyard.
          </blockquote>
          <p>
            GlowUP. <span>Open beta · Beauty Business, Beautifully Done.</span>
          </p>
        </div>
      </section>

      <section className="auth-form-wrap">
        <a className="back-link" href="/">
          <ArrowLeft size={16} /> Back to GlowUP
        </a>
        <div className="auth-form-card">
          <div className="eyebrow">
            <span /> Your beautiful business starts here
          </div>
          <h1>{mode === 'login' ? 'Welcome back.' : 'Open your studio.'}</h1>
          <p>
            {mode === 'login'
              ? 'Sign in to your calendar, CRM, and Glo AI front desk.'
              : 'Create your account in under a minute — then set up your floor. Zero friction for pilots.'}
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login')
                setMessage('')
                setAwaitingConfirm(false)
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => {
                setMode('signup')
                setMessage('')
                setAwaitingConfirm(false)
              }}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <label>
                Your name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Amelia Hart"
                  autoComplete="name"
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@yourstudio.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Show password">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            {mode === 'login' && (
              <div className="form-options">
                <label className="check-label">
                  <input type="checkbox" defaultChecked />{' '}
                  <span>
                    <Check size={11} />
                  </span>{' '}
                  Remember me
                </label>
              </div>
            )}
            {message && (
              <div
                className="form-message"
                role="status"
                style={
                  messageTone === 'err'
                    ? { borderColor: 'rgba(200,80,80,0.4)' }
                    : messageTone === 'warn'
                      ? { borderColor: 'rgba(200,160,80,0.45)' }
                      : undefined
                }
              >
                {message}
              </div>
            )}
            {awaitingConfirm && (
              <button
                type="button"
                className="button button-dark auth-submit"
                onClick={() => void enterStudio('/onboarding')}
              >
                Continue to studio setup <ArrowRight size={17} />
              </button>
            )}
            {!awaitingConfirm && (
              <button className="button button-dark auth-submit" disabled={loading} type="submit">
                {loading
                  ? 'Just a moment…'
                  : mode === 'login'
                    ? 'Enter your studio'
                    : 'Create my account'}
                <ArrowRight size={17} />
              </button>
            )}
          </form>

          <div className="or">
            <span /> or <span />
          </div>
          <button
            type="button"
            className="google-button"
            onClick={() => {
              void Promise.resolve(oauthLogin('google') as Promise<unknown>).catch(() => {
                setMessageTone('warn')
                setMessage('Google sign-in isn’t enabled yet — use email above. It still gets you into the studio.')
              })
            }}
          >
            <b>G</b> Google
          </button>
          <a className="demo-link" href="/onboarding?demo=1">
            Skip login — explore setup <ArrowRight size={15} />
          </a>
          <small className="auth-terms">
            By continuing you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>. Your
            salon data starts on this device; cloud saves when signed in.
          </small>
        </div>
      </section>
    </main>
  )
}
