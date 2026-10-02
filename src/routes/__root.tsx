import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { CallbackHandler } from '../components/CallbackHandler'
import { CookieConsent } from '../components/CookieConsent'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { IdentityProvider } from '../lib/identity-context'
import { GLOWUP_ENTITY_JSON_LD } from '../lib/glowup-schema'

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
        title: 'AI Receptionist for Salons | GlowUP.',
      },
      {
        name: 'description',
        content:
          'GlowUP. is salon software for multi-stylist floors. Glo, the AI receptionist, books the live calendar after hours. Floor pilot $149, 30 days on the house. Open beta.',
      },
      {
        name: 'theme-color',
        content: '#f7f4ef',
      },
      {
        'script:ld+json': GLOWUP_ENTITY_JSON_LD,
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
