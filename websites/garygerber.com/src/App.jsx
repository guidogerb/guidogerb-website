import { useCallback, useEffect, useMemo, useState } from 'react'
import { Footer } from '@guidogerb/footer'
import { Header, HeaderContextProvider } from '@guidogerb/header'
import { useAuth } from '@guidogerb/components-auth'
import './App.css'
import headerSettings from './headerSettings.js'
import footerSettings from './footerSettings.js'
import rehearsalResources from './rehearsalResources.js'
import RehearsalResourcesLanding from './RehearsalResourcesLanding.jsx'
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

const SECTION_MAP = {
  '/': 'top',
  '/programs': 'programs',
  '/consulting': 'consulting',
  '/about': 'about',
  '/recordings': 'recordings',
  '/education': 'education',
  '/press': 'press',
  '/newsletter': 'newsletter',
  '/contact': 'contact',
  '/rehearsal': 'client-access',
  '/rehearsal/resources': 'client-access',
}

const AUXILIARY_PATHS = new Set(['/auth/callback'])

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
  const sectionId = SECTION_MAP[normalized]
  const isKnown = Boolean(sectionId) || AUXILIARY_PATHS.has(normalized)
  return { path: normalized, sectionId, isKnown }
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
          SECTION_MAP[targetPath] || (url.hash ? url.hash.replace('#', '') : undefined)

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

  return (
    <HeaderContextProvider defaultSettings={headerSettings}>
      <div className="app-shell" id="top">
        <Header activePath={route.path} onNavigate={handleNavigate} />

        <main className="app-main">
          {route.isKnown ? (
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
          ) : (
            <NotFound onNavigateHome={handleNotFoundNavigate} resources={rehearsalResources} />
          )}
        </main>

        <Footer {...footerSettings} onNavigate={handleNavigate} id="contact">
          <div className="footer-contact">
            <h2>Bookings &amp; inquiries</h2>
            <p>
              Email <a href="mailto:hello@garygerber.com">hello@garygerber.com</a> or call{' '}
              <a href="tel:+16125550123">+1 (612) 555-0123</a> for availability and partnership details.
            </p>
            <p>Based in Minneapolis, performing worldwide.</p>
          </div>
        </Footer>
      </div>
    </HeaderContextProvider>
  )
}

export default App
