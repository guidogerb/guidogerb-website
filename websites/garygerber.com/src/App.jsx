import { useCallback, useEffect, useMemo, useState } from 'react'
import { Footer } from '@guidogerb/footer'
import { Header, HeaderContextProvider } from '@guidogerb/header'
import { useAuth } from '@guidogerb/components-auth'
import './App.css'
import headerSettings from './headerSettings.js'
import footerSettings from './footerSettings.js'
import rehearsalResources from './rehearsalResources.js'
import RehearsalResourcesLanding from './RehearsalResourcesLanding.jsx'
import RehearsalPortalNavigation from './RehearsalPortalNavigation.jsx'
import NotFound from './NotFound.jsx'
import {
  ProgramsHeroSection,
  ConsultingSection,
  RecordingsEducationSection,
  AboutPressSection,
  NewsletterSignupSection,
  RehearsalRoomSection,
  Welcome,
} from '@guidogerb/components-ui'

const ROUTES = {
  '/': { view: 'marketing', sectionId: 'top' },
  '/programs': { view: 'marketing', sectionId: 'programs' },
  '/consulting': { view: 'marketing', sectionId: 'consulting' },
  '/about': { view: 'marketing', sectionId: 'about' },
  '/recordings': { view: 'marketing', sectionId: 'recordings' },
  '/education': { view: 'marketing', sectionId: 'education' },
  '/press': { view: 'marketing', sectionId: 'press' },
  '/newsletter': { view: 'marketing', sectionId: 'newsletter' },
  '/contact': { view: 'marketing', sectionId: 'contact' },
  '/auth/callback': { view: 'marketing' },
  '/rehearsal': { view: 'rehearsal-overview', sectionId: 'client-access' },
  '/rehearsal/resources': { view: 'rehearsal-resources', sectionId: 'client-access' },
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

const normalizePath = (value) => {
  if (!value || typeof value !== 'string') return '/'
  if (value.length > 1 && value.endsWith('/')) {
    return value.replace(/\/+$/, '')
  }
  return value || '/'
}

const resolveRoute = (pathname) => {
  const normalized = normalizePath(pathname)
  const config = ROUTES[normalized]
  if (config) {
    return {
      path: normalized,
      view: config.view,
      sectionId: config.sectionId,
      isKnown: true,
    }
  }

  return { path: normalized, view: 'not-found', sectionId: undefined, isKnown: false }
}

function useRouteState() {
  const [route, setRoute] = useState(() => resolveRoute(getInitialPath()))

  useEffect(() => {
    const handlePopState = () => {
      const next = resolveRoute(getInitialPath())
      setRoute(next)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (route.sectionId) {
      scrollToSection(route.sectionId)
    }
  }, [route.sectionId, route.path])

  const navigateToRoute = useCallback((nextPath) => {
    const resolved = resolveRoute(nextPath)
    setRoute(resolved)
    return resolved
  }, [])

  return useMemo(() => [route, navigateToRoute], [route, navigateToRoute])
}

function App() {
  const [route, navigateToRoute] = useRouteState()

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

        const targetPath = normalizePath(url.pathname || '/')
        const sectionId =
          ROUTES[targetPath]?.sectionId || (url.hash ? url.hash.replace('#', '') : undefined)

        if (!sectionId) {
          window.location.assign(url.href)
          return
        }

        window.history.pushState({}, '', targetPath)
        navigateToRoute(targetPath)
      } catch {
        window.location.assign(href)
      }
    },
    [navigateToRoute],
  )

  const handleNotFoundNavigate = useCallback(
    (event) => {
      if (event) {
        event.preventDefault()
      }

      if (typeof window === 'undefined') return

      window.history.pushState({}, '', '/')
      navigateToRoute('/')
    },
    [navigateToRoute],
  )

  const handlePortalNavigate = useCallback(
    (event, targetPath) => {
      if (event) {
        event.preventDefault()
      }

      if (!targetPath || typeof window === 'undefined') return

      window.history.pushState({}, '', targetPath)
      navigateToRoute(targetPath)
    },
    [navigateToRoute],
  )

  let mainContent

  if (!route.isKnown) {
    mainContent = (
      <NotFound onNavigateHome={handleNotFoundNavigate} resources={rehearsalResources} />
    )
  } else if (route.view === 'rehearsal-overview') {
    mainContent = (
      <section className="rehearsal-portal" aria-labelledby="rehearsal-portal-title">
        <header className="rehearsal-portal__intro">
          <p className="rehearsal-portal__eyebrow">Collaborator portal</p>
          <h2 id="rehearsal-portal-title">Plan the residency with the production team</h2>
          <p>
            Sign in to coordinate stage plots, download hospitality notes, and review the next call
            times with Gary’s production crew. Use the quick links below to dive into the resource
            library or reach the team directly.
          </p>
        </header>
        <RehearsalRoomSection logoutUri={import.meta.env.VITE_LOGOUT_URI}>
          <Welcome rehearsalResources={rehearsalResources} useAuthHook={useAuth}>
            <RehearsalPortalNavigation
              onNavigate={handlePortalNavigate}
              resources={rehearsalResources}
            />
          </Welcome>
        </RehearsalRoomSection>
      </section>
    )
  } else if (route.view === 'rehearsal-resources') {
    mainContent = (
      <section className="rehearsal-portal" aria-labelledby="rehearsal-resources-title">
        <header className="rehearsal-portal__intro">
          <p className="rehearsal-portal__eyebrow">Rehearsal library</p>
          <h2 id="rehearsal-resources-title">Upcoming call times &amp; download vault</h2>
          <p>
            Download the latest production assets, confirm call times, and subscribe to the shared
            calendar so every residency stays in sync.
          </p>
        </header>
        <RehearsalRoomSection logoutUri={import.meta.env.VITE_LOGOUT_URI}>
          <Welcome rehearsalResources={rehearsalResources} useAuthHook={useAuth}>
            <RehearsalResourcesLanding resources={rehearsalResources} />
          </Welcome>
        </RehearsalRoomSection>
      </section>
    )
  } else {
    mainContent = (
      <>
        <ProgramsHeroSection />
        <ConsultingSection />
        <RecordingsEducationSection />
        <AboutPressSection />
        <NewsletterSignupSection />
        <RehearsalRoomSection logoutUri={import.meta.env.VITE_LOGOUT_URI}>
          <Welcome rehearsalResources={rehearsalResources} useAuthHook={useAuth}>
            <RehearsalResourcesLanding resources={rehearsalResources} />
          </Welcome>
        </RehearsalRoomSection>
      </>
    )
  }

  return (
    <HeaderContextProvider defaultSettings={headerSettings}>
      <div className="app-shell" id="top">
        <Header activePath={route.path} onNavigate={handleNavigate} />

        <main className="app-main">{mainContent}</main>

        <Footer {...footerSettings} onNavigate={handleNavigate} id="contact">
          <div className="footer-contact">
            <h2>Bookings &amp; inquiries</h2>
            <p>
              Email <a href="mailto:hello@garygerber.com">hello@garygerber.com</a> or call{' '}
              <a href="tel:+16125550123">+1 (612) 555-0123</a> for availability and partnership
              details.
            </p>
            <p>Based in Minneapolis, performing worldwide.</p>
          </div>
        </Footer>
      </div>
    </HeaderContextProvider>
  )
}

export default App
