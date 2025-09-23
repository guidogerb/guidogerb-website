import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Footer } from '@guidogerb/footer'
import { Header, HeaderContextProvider } from '@guidogerb/header'
import { useAuth } from '@guidogerb/components-auth'
import {
  DistributionSection,
  HeroSection,
  NewsletterSection,
  PartnerPortalSection,
  PlatformSection,
  ResourcesSection,
} from '@guidogerb/components-ui'
import './App.css'
import headerSettings from './headerSettings.js'
import footerSettings from './footerSettings.js'
import {
  fetchMarketingContent,
  getDefaultMarketingContent,
} from './marketingContent.js'
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

const normalizePathname = (pathname) => {
  if (!pathname) return '/'
  const trimmed = pathname.trim()
  if (!trimmed || trimmed === '/') return '/'
  return trimmed.replace(/\/+$/, '') || '/'
}

function scrollToSection(id) {
  if (!id || typeof document === 'undefined') return
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function useMarketingContentState() {
  const [content, setContent] = useState(() => getDefaultMarketingContent())
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    const baseUrl = import.meta.env?.VITE_API_BASE_URL
    const fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null

    if (!baseUrl || !fetchImpl) {
      return
    }

    const controller = new AbortController()
    let isMounted = true

    setStatus('loading')

    fetchMarketingContent({ baseUrl, fetchImpl, signal: controller.signal })
      .then((data) => {
        if (!isMounted) return
        setContent(data)
        setStatus('success')
      })
      .catch((error) => {
        if (controller.signal.aborted || !isMounted) return
        console.error('Failed to load publishing marketing content', error)
        setContent(getDefaultMarketingContent())
        setStatus('error')
      })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  return { content, status }
}

function SiteLayout({ activePath, onNavigate, children }) {
  return (
    <div className="app-shell" id="top">
      <Header activePath={activePath} onNavigate={onNavigate} />

      <main className="app-main">{children}</main>

      <Footer {...footerSettings} onNavigate={onNavigate} id="contact">
        <div className="footer-contact">
          <h2>Work with GuidoGerb Publishing</h2>
          <p>
            Email <a href="mailto:hello@guidogerbpublishing.com">hello@guidogerbpublishing.com</a> or call{' '}
            <a href="tel:+12125559876">+1 (212) 555-9876</a> to discuss catalog development, distribution, or rights
            management partnerships.
          </p>
          <p>Headquarters in New York with a distributed production and licensing team.</p>
        </div>
      </Footer>
    </div>
  )
}

function MarketingPage({ activePath, onNavigate, marketingContent, logoutUri }) {
  const { hero, platform, distribution, resources, newsletter } = marketingContent

  return (
    <SiteLayout activePath={activePath} onNavigate={onNavigate}>
      <HeroSection {...hero} />
      <PlatformSection columns={platform} />
      <DistributionSection columns={distribution} />
      <ResourcesSection columns={resources} />
      <NewsletterSection {...newsletter} />
      <PartnerPortalSection
        logoutUri={logoutUri}
        WelcomeComponent={Welcome}
        useAuthHook={useAuth}
      />
    </SiteLayout>
  )
}

function PartnerPortalPage({ activePath, onNavigate, logoutUri }) {
  return (
    <SiteLayout activePath={activePath} onNavigate={onNavigate}>
      <PartnerPortalSection
        logoutUri={logoutUri}
        WelcomeComponent={Welcome}
        useAuthHook={useAuth}
      />
    </SiteLayout>
  )
}

function AppRouter() {
  const location = useLocation()
  const navigate = useNavigate()
  const marketing = useMarketingContentState()
  const normalizedPath = useMemo(() => normalizePathname(location.pathname), [location.pathname])
  const [activePath, setActivePath] = useState(normalizedPath)
  const logoutUri = import.meta.env.VITE_LOGOUT_URI

  useEffect(() => {
    setActivePath(normalizedPath)
  }, [normalizedPath])

  useEffect(() => {
    const hashId = location.hash ? location.hash.replace('#', '') : undefined
    if (hashId) {
      scrollToSection(hashId)
      return
    }
    const sectionId = SECTION_MAP[normalizedPath]
    if (sectionId) {
      scrollToSection(sectionId)
    }
  }, [normalizedPath, location.hash])

  const handleNavigate = useCallback(
    ({ item }) => {
      const href = item?.href
      if (!href || typeof window === 'undefined') return

      const stringHref = String(href)

      if (stringHref.startsWith('mailto:') || stringHref.startsWith('tel:')) {
        window.location.href = stringHref
        return
      }

      if (stringHref.startsWith('#')) {
        scrollToSection(stringHref.replace('#', ''))
        return
      }

      try {
        const url = new URL(stringHref, window.location.origin)

        if (item.external || url.origin !== window.location.origin) {
          window.open(url.href, '_blank', 'noopener')
          return
        }

        const nextPath = normalizePathname(url.pathname)
        const nextHash = url.hash ? url.hash.replace('#', '') : undefined

        if (nextPath === normalizedPath) {
          if (nextHash) {
            scrollToSection(nextHash)
          } else {
            const sectionId = SECTION_MAP[nextPath]
            if (sectionId) {
              scrollToSection(sectionId)
            }
          }
          return
        }

        navigate(`${nextPath}${url.search}${url.hash}`)
      } catch {
        window.location.assign(stringHref)
      }
    },
    [navigate, normalizedPath],
  )

  return (
    <Routes>
      <Route
        path="/partner-portal"
        element={<PartnerPortalPage activePath={activePath} onNavigate={handleNavigate} logoutUri={logoutUri} />}
      />
      <Route
        path="/*"
        element={
          <MarketingPage
            activePath={activePath}
            onNavigate={handleNavigate}
            marketingContent={marketing.content}
            logoutUri={logoutUri}
          />
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <HeaderContextProvider defaultSettings={headerSettings}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </HeaderContextProvider>
  )
}

export default App
