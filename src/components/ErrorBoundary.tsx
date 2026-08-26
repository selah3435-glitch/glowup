import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode; label?: string }
type State = { error: Error | null }

/** Catches React render crashes so the whole app does not white-screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[GlowUP ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`,
      error,
      info.componentStack,
    )
    // Optional: Sentry.captureException(error) when DSN is configured
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '40vh',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            background: '#0c0c0c',
            color: '#f5f0e6',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <p style={{ letterSpacing: '0.12em', fontSize: 12, opacity: 0.7 }}>GLOWUP.</p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 500, margin: '0.5rem 0' }}>Something went wrong</h1>
            <p style={{ opacity: 0.8, lineHeight: 1.5 }}>
              This screen hit an unexpected error. Your data on this device is usually still safe. Try reloading.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.25rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderRadius: 999,
                background: '#c4a574',
                color: '#0c0c0c',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
            <p style={{ marginTop: '1rem', fontSize: 12, opacity: 0.5 }}>{this.state.error.message.slice(0, 120)}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
