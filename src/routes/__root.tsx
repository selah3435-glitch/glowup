import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { CallbackHandler } from '../components/CallbackHandler'
import { CookieConsent } from '../components/CookieConsent'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { IdentityProvider } from '../lib/identity-context'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'GlowUP. | The AI-Powered Salon Operating System (OS)',
      },
      {
        name: 'description',
        content:
          'Centralize booking, client CRM, and Glo AI after-hours chat. GlowUP. scales from solo independent stylists to high-volume multi-location salons. Join the open beta.',
      },
      {
        name: 'theme-color',
        content: '#f7f4ef',
      },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/brand/glowup-logo.jpg' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ErrorBoundary label="root">
          <IdentityProvider>
            <CallbackHandler>{children}</CallbackHandler>
            <CookieConsent />
          </IdentityProvider>
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  )
}
