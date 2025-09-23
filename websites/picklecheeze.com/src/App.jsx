import { Footer } from '@guidogerb/footer'
import { Header, HeaderContextProvider } from '@guidogerb/header'
import { ErrorShell } from '@guidogerb/components-pages-public'
import { PublicRouter } from '@guidogerb/components-router-public'
import './App.css'
import headerSettings from './headerSettings.js'
import footerSettings from './footerSettings.js'
import {
  CheeseLabAndShareSection,
  EventsAndWholesaleSection,
  FermentationHeroSection,
  MarketplacePreviewSection,
  NewsletterSignupSection,
  PartnerHubSection,
} from './website-components/landing-sections/index.js'
import { MARKETING_PATHS, useMarketingNavigation } from './useMarketingNavigation.js'

const MAINTENANCE_PATH = '/maintenance'

const marketingRoutes = MARKETING_PATHS.map((path) => ({ path, element: <LandingRoute /> }))

const routes = [
  ...marketingRoutes,
  { path: MAINTENANCE_PATH, element: <MaintenanceRoute /> },
]

function LandingRoute() {
  const { activePath, handleNavigate } = useMarketingNavigation()

  return (
    <HeaderContextProvider defaultSettings={headerSettings}>
      <div className="app-shell" id="top">
        <Header activePath={activePath} onNavigate={handleNavigate} />

        <main className="app-main">
          <FermentationHeroSection />
          <CheeseLabAndShareSection />
          <EventsAndWholesaleSection />
          <MarketplacePreviewSection />
          <NewsletterSignupSection />
          <PartnerHubSection logoutUri={import.meta.env.VITE_LOGOUT_URI} />
        </main>

        <Footer {...footerSettings} onNavigate={handleNavigate} id="contact">
          <div className="footer-contact">
            <h2>Say hello</h2>
            <p>
              Email <a href="mailto:hello@picklecheeze.com">hello@picklecheeze.com</a> or call{' '}
              <a href="tel:+16125550876">+1 (612) 555-0876</a> to chat collaborations, wholesale,
              and workshop bookings.
            </p>
            <p>Based in Northeast Minneapolis. Pickups every Thursday &amp; Saturday.</p>
          </div>
        </Footer>
      </div>
    </HeaderContextProvider>
  )
}

function NotFoundRoute() {
  const { activePath, handleNavigate, navigateHome } = useMarketingNavigation()

  return (
    <HeaderContextProvider defaultSettings={headerSettings}>
      <ErrorShell
        className="error-shell--pickle"
        statusCode={404}
        statusLabel="HTTP status code"
        title="Jar not on this shelf"
        description="We hunted through every brining rack but couldn’t find that page."
        actionsLabel="Helpful links"
        actions={[
          {
            label: 'Return to fermentation hub',
            href: '/',
            variant: 'primary',
            onClick: navigateHome,
          },
          {
            label: 'Email the fermentation team',
            href: 'mailto:partners@picklecheeze.com?subject=Portal%20support',
          },
        ]}
        header={<Header activePath={activePath} onNavigate={handleNavigate} />}
        footer={<Footer {...footerSettings} onNavigate={handleNavigate} />}
      >
        <p>
          Double-check the link or head back to the fermentation hub to keep browsing seasonal jars,
          partner resources, and workshop dates.
        </p>
      </ErrorShell>
    </HeaderContextProvider>
  )
}

function MaintenanceRoute() {
  const { activePath, handleNavigate, navigateHome } = useMarketingNavigation()

  return (
    <HeaderContextProvider defaultSettings={headerSettings}>
      <ErrorShell
        className="error-shell--pickle"
        statusCode={503}
        statusLabel="Service status"
        title="Fermentation kitchen is curing updates"
        description="We’re refreshing partner resources and will be back online shortly."
        actionsLabel="While you wait"
        actions={[
          {
            label: 'Check back on the homepage',
            href: '/',
            variant: 'primary',
            onClick: navigateHome,
          },
          {
            label: 'Follow our brine dispatch on Instagram',
            href: 'https://instagram.com/picklecheeze',
            external: true,
          },
        ]}
        header={<Header activePath={activePath} onNavigate={handleNavigate} />}
        footer={<Footer {...footerSettings} onNavigate={handleNavigate} />}
      >
        <p>
          Reach out at <a href="mailto:hello@picklecheeze.com">hello@picklecheeze.com</a> if you
          need inventory sheets or delivery updates while we finish the release.
        </p>
      </ErrorShell>
    </HeaderContextProvider>
  )
}

function App() {
  return <PublicRouter routes={routes} fallback={<NotFoundRoute />} />
}

export default App
