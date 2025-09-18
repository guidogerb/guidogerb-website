import { useCallback, useEffect, useState } from 'react'
import Protected from '@guidogerb/components-pages-protected'
import { Footer } from '@guidogerb/footer'
import { Header, HeaderContextProvider } from '@guidogerb/header'
import './App.css'
import headerSettings from './headerSettings.js'
import footerSettings from './footerSettings.js'
import Welcome from './website-components/welcome-page/index.jsx'

const SECTION_MAP = {
  '/': 'top',
  '/solutions': 'solutions',
  '/platform': 'platform',
  '/distribution': 'distribution',
  '/resources': 'resources',
  '/newsletter': 'newsletter',
  '/partner-portal': 'partner-portal',
  '/contact': 'contact',
}

const getInitialPath = () => {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname || '/'
}

function scrollToSection(id) {
  if (!id || typeof document === 'undefined') return
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function useActivePath() {
  const [activePath, setActivePath] = useState(() => getInitialPath())

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = getInitialPath()
      setActivePath(nextPath)
      const sectionId = SECTION_MAP[nextPath]
      if (sectionId) {
        scrollToSection(sectionId)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sectionId = SECTION_MAP[getInitialPath()]
    if (sectionId) {
      scrollToSection(sectionId)
    }
  }, [])

  return [activePath, setActivePath]
}

function App() {
  const [activePath, setActivePath] = useActivePath()

  const handleNavigate = useCallback(
    ({ item }) => {
      if (!item?.href || typeof window === 'undefined') return

      const href = String(item.href)

      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        window.location.href = href
        return
      }

      try {
        const url = new URL(href, window.location.origin)

        if (item.external || url.origin !== window.location.origin) {
          window.open(url.href, '_blank', 'noopener')
          return
        }

        const targetPath = url.pathname || '/'
        const sectionId =
          SECTION_MAP[targetPath] || (url.hash ? url.hash.replace('#', '') : undefined)

        window.history.pushState({}, '', targetPath)
        setActivePath(targetPath)

        if (sectionId) {
          scrollToSection(sectionId)
        } else {
          window.location.assign(url.href)
        }
      } catch {
        window.location.assign(href)
      }
    },
    [setActivePath],
  )

  return (
    <HeaderContextProvider defaultSettings={headerSettings}>
      <div className="app-shell" id="top">
        <Header activePath={activePath} onNavigate={handleNavigate} />

        <main className="app-main">
          <section className="hero" id="solutions">
            <p className="eyebrow">Publishing operations for modern catalogs</p>
            <h1>
              GuidoGerb Publishing brings manuscripts to market with full-service production and rights
              management.
            </h1>
            <p className="lede">
              From editorial strategy to digital distribution, we partner with authors, ensembles, and arts
              organizations to deliver releases across print, audio, and interactive channels.
            </p>
            <dl className="hero-highlights" aria-label="Publishing impact highlights">
              <div>
                <dt>600+</dt>
                <dd>active titles across scores, recordings, and digital editions</dd>
              </div>
              <div>
                <dt>40</dt>
                <dd>new releases shepherded each season with dedicated launch plans</dd>
              </div>
              <div>
                <dt>85%</dt>
                <dd>catalog revenue delivered through direct-to-audience storefronts</dd>
              </div>
            </dl>
          </section>

          <section className="content-grid" id="platform">
            <article>
              <h2>Integrated publishing console</h2>
              <p>
                Manage your entire catalog from manuscript intake to multi-format delivery. Our console keeps
                metadata, assets, and rights aligned so every release stays market-ready.
              </p>
              <ul className="feature-list">
                <li>Rights tracking for print, sync, and streaming agreements</li>
                <li>Automated ISRC, ISBN, and UPC assignment with validation rules</li>
                <li>Version history for scores, parts, and marketing collateral</li>
              </ul>
            </article>
            <article>
              <h2>Collaborative editorial workflows</h2>
              <p>
                Bring editors, arrangers, and composers into a shared workspace. Built-in review stages keep
                everyone aligned on deadlines and quality gates.
              </p>
              <ul className="feature-list">
                <li>Comment threads with score and manuscript annotations</li>
                <li>Approval checkpoints with automated reminders</li>
                <li>Asset lockers for stems, engravings, and print-ready files</li>
              </ul>
            </article>
          </section>

          <section className="content-grid" id="distribution">
            <article>
              <h2>Distribution channels</h2>
              <p>
                Launch simultaneously across streaming, retail, and licensing partners. We handle ingestion and
                compliance so your team can stay focused on building the catalog.
              </p>
              <ul className="feature-list">
                <li>Direct delivery to Apple Music, Spotify, and classical-focused DSPs</li>
                <li>Global print-on-demand and warehouse fulfillment management</li>
                <li>Synchronization licensing pipeline with broadcast ready assets</li>
              </ul>
            </article>
            <article>
              <h2>Direct-to-audience storefronts</h2>
              <p>
                Pair traditional channels with branded storefronts for ensembles, artists, and educators.
                Flexible bundles and subscription models help you grow recurring revenue.
              </p>
              <ul className="feature-list">
                <li>Customizable microsites with secure score and media delivery</li>
                <li>Dynamic pricing tiers for studios, institutions, and touring groups</li>
                <li>Customer analytics with cohort retention and royalty forecasting</li>
              </ul>
            </article>
          </section>

          <section className="content-grid" id="resources">
            <article>
              <h2>Author onboarding</h2>
              <p>
                Provide contributors with a clear path from first draft to launch. Templates, checklists, and
                personal consultations ensure every project is ready for distribution.
              </p>
              <ul className="feature-list">
                <li>Submission portal with formatting guidelines and asset requirements</li>
                <li>Release readiness scorecards and marketing asset checklists</li>
                <li>Quarterly planning sessions with our editorial and licensing leads</li>
              </ul>
            </article>
            <article>
              <h2>Marketing toolkit</h2>
              <p>
                Keep campaigns consistent with modular launch kits tailored to recordings, educational content,
                and performance rights packages.
              </p>
              <ul className="feature-list">
                <li>Pre-built email, social, and press release templates</li>
                <li>Digital ad creative sized for arts presenters and music retailers</li>
                <li>Audience journey maps to align nurture and paid campaigns</li>
              </ul>
            </article>
            <article>
              <h2>Compliance resources</h2>
              <p>
                Stay ahead of regional reporting and royalty requirements. Our resource library keeps your team
                current on mechanical, performance, and educational licensing rules.
              </p>
              <ul className="feature-list">
                <li>Regional royalty calendars and automated filing reminders</li>
                <li>Template agreements for composers, arrangers, and narrators</li>
                <li>Security checklist covering data residency and archival policies</li>
              </ul>
            </article>
          </section>

          <section className="newsletter" id="newsletter">
            <div>
              <h2>Quarterly publishing brief</h2>
              <p>
                Join our newsletter for catalog performance insights, partner spotlights, and submission
                deadlines. We highlight actionable trends for catalogs serving arts organizations and creative
                entrepreneurs.
              </p>
            </div>
            <form className="newsletter-form" aria-label="Newsletter sign up" onSubmit={(event) => event.preventDefault()}>
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
              <button type="submit">Subscribe</button>
            </form>
          </section>

          <section className="protected" id="partner-portal">
            <h2>Partner operations portal</h2>
            <p className="protected-copy">
              Signed-in partners can review royalty dashboards, download assets, and coordinate release plans with
              our production team.
            </p>
            <Protected logoutUri={import.meta.env.VITE_LOGOUT_URI}>
              <Welcome />
            </Protected>
          </section>
        </main>

        <Footer {...footerSettings} onNavigate={handleNavigate} id="contact">
          <div className="footer-contact">
            <h2>Work with GuidoGerb Publishing</h2>
            <p>
              Email{' '}
              <a href="mailto:hello@guidogerbpublishing.com">hello@guidogerbpublishing.com</a> or call{' '}
              <a href="tel:+12125559876">+1 (212) 555-9876</a> to discuss catalog development, distribution, or rights
              management partnerships.
            </p>
            <p>Headquarters in New York with a distributed production and licensing team.</p>
          </div>
        </Footer>
      </div>
    </HeaderContextProvider>
  )
}

export default App
