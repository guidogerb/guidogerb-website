import Protected from '@guidogerb/components-pages-protected'
import { Footer } from '@guidogerb/footer'
import { Header, HeaderContextProvider } from '@guidogerb/header'
import { ErrorShell } from '@guidogerb/components-pages-public'
import { PublicRouter } from '@guidogerb/components-router-public'
import './App.css'
import headerSettings from './headerSettings.js'
import footerSettings from './footerSettings.js'
import Welcome from './website-components/welcome-page/index.jsx'
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
          <section className="hero" id="fermentation">
            <p className="eyebrow">Fermentation for joyful tables</p>
            <h1>
              PickleCheeze cultures vegetables and plant-based cheeze into bright, briny staples for
              community suppers.
            </h1>
            <p className="lede">
              We ferment in small batches using hyper-local produce, coaxing layered flavors that
              pair with natural wine, hearth breads, and late-night playlists.
            </p>
            <dl className="hero-highlights" aria-label="Fermentation highlights">
              <div>
                <dt>48 hrs</dt>
                <dd>Average ferment time before a brine is tasted and tuned</dd>
              </div>
              <div>
                <dt>120 jars</dt>
                <dd>Weekly capacity across pickles, krauts, and koji vegetables</dd>
              </div>
              <div>
                <dt>9 styles</dt>
                <dd>Plant-based cheeze wheels aged with custom cultures</dd>
              </div>
            </dl>
          </section>

          <section className="content-grid" id="cheese-lab">
            <article>
              <h2>Cheeze lab experiments</h2>
              <p>
                Rind-aged wheels develop in our temperature-controlled lab with cultures we
                propagate from the very produce we ferment. Expect washed rinds, cave-aged blues,
                and creamy spreads ready for service.
              </p>
              <ul className="feature-list">
                <li>Cashew and sunflower bases cultured with koji, rejuvelac, and lactic blends</li>
                <li>Smoked paprika + ancho brine rubs for campfire-ready cheeze logs</li>
                <li>Weekly micro-batch releases announced to newsletter subscribers first</li>
              </ul>
            </article>
            <article>
              <h2>Fermentation share</h2>
              <p>
                Join the fermentation club to receive rotating jars, cheeze pairings, and pantry
                extras. Shares include recipe cards and playlists so every delivery becomes a dinner
                party.
              </p>
              <ul className="feature-list">
                <li>Seasonal produce sourced from partner farms within 40 miles</li>
                <li>Members-only hotline for pairing questions and kitchen troubleshooting</li>
                <li>Pickup in Minneapolis or insulated courier delivery across the metro</li>
              </ul>
            </article>
          </section>

          <section className="content-grid" id="events">
            <article>
              <h2>Pop-up tastings</h2>
              <p>
                We host immersive tasting menus with natural wine pairings, collaborations with
                local bakers, and fermentation demos that send you home with your own starter
                cultures.
              </p>
              <ul className="feature-list">
                <li>Interactive stations for kraut pounding and cheeze shaping</li>
                <li>Private events tailored for teams, wedding weekends, and supper clubs</li>
                <li>Mobile brine bar that turns patios into fermentation playgrounds</li>
              </ul>
            </article>
            <article>
              <h2>Wholesale partners</h2>
              <p>
                Restaurants and grocers partner with PickleCheeze for rotating brine flights and
                plant-based cheeze boards. We develop exclusive flavors that complement your menu.
              </p>
              <ul className="feature-list">
                <li>Branded crocks and signage ready for retail shelves</li>
                <li>Staff training covering storage, plating, and story-driven service</li>
                <li>Quarterly menu workshops to ideate seasonal specials together</li>
              </ul>
            </article>
          </section>

          <section className="market" id="market">
            <div>
              <h2>Marketplace preview</h2>
              <p>
                Subscribe for early access to market drops featuring cult-favorite jars, cheeze
                kits, pantry toppers, and pairing bundles curated with local makers.
              </p>
            </div>
            <ul className="market-items" aria-label="Marketplace teasers">
              <li>
                <h3>Golden hour pickle flight</h3>
                <p>Charred pineapple kimchi, turmeric daikon, and smoked carrot coins</p>
              </li>
              <li>
                <h3>Cellar cheeze duo</h3>
                <p>Koji-washed bloom rind and ash-aged basil wheels</p>
              </li>
              <li>
                <h3>Brine pantry kit</h3>
                <p>House crackers, pickled mustard seeds, and rhubarb shrub concentrate</p>
              </li>
            </ul>
          </section>

          <section className="newsletter" id="newsletter">
            <div>
              <h2>Join the brine dispatch</h2>
              <p>
                Monthly emails share fermentation tips, release calendars, and behind-the-scenes
                looks at experiments happening in the cheeze lab.
              </p>
            </div>
            <form
              className="newsletter-form"
              aria-label="Newsletter sign up"
              onSubmit={(event) => event.preventDefault()}
            >
              <label htmlFor="newsletter-email" className="visually-hidden">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
              <button type="submit">Notify me</button>
            </form>
          </section>

          <section className="protected" id="partner-hub">
            <h2>Partner pantry</h2>
            <p className="protected-copy">
              Chefs, buyers, and collaborators can review seasonal availability, download product
              specs, and schedule tasting pickups once signed in.
            </p>
            <Protected logoutUri={import.meta.env.VITE_LOGOUT_URI}>
              <Welcome>
                <p>
                  Explore the latest cellar inventory, download plating guides, and coordinate joint
                  events directly with the PickleCheeze team.
                </p>
              </Welcome>
            </Protected>
          </section>
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
