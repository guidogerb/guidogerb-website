import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Footer } from '@guidogerb/footer'
import { Header, HeaderContextProvider } from '@guidogerb/header'
import { useAuth } from '@guidogerb/components-auth'
import { ErrorShell } from '@guidogerb/components-pages-public'
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
import { fetchMarketingContent, getDefaultMarketingContent } from './marketingContent.js'
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

const MARKETING_PATHS = Object.keys(SECTION_MAP).filter((path) => path !== '/partner-portal')
const AUXILIARY_ROUTES = ['/auth/callback']
const MARKETING_ROUTE_PATHS = Array.from(new Set([...MARKETING_PATHS, ...AUXILIARY_ROUTES]))

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

function PublishingFooter({ onNavigate }) {
  return (
    <Footer {...footerSettings} onNavigate={onNavigate} id="contact">
      <div className="footer-contact">
        <h2>Work with GuidoGerb Publishing</h2>
        <p>
          Email <a href="mailto:hello@guidogerbpublishing.com">hello@guidogerbpublishing.com</a> or
          call <a href="tel:+12125559876">+1 (212) 555-9876</a> to discuss catalog development,
          distribution, or rights management partnerships.
        </p>
        <p>Headquarters in New York with a distributed production and licensing team.</p>
      </div>
    </Footer>
  )
}

function SiteLayout({ activePath, onNavigate, children }) {
  return (
    <div className="app-shell" id="top">
      <Header activePath={activePath} onNavigate={onNavigate} />

      <main className="app-main">{children}</main>

      <PublishingFooter onNavigate={onNavigate} />
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
    if (SECTION_MAP[normalizedPath]) {
      setActivePath(normalizedPath)
    } else {
      setActivePath('/')
    }
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

  const navigateHome = useCallback(
    (event) => {
      if (event?.preventDefault) {
        event.preventDefault()
      }
      navigate('/')
    },
    [navigate],
  )

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
      {MARKETING_ROUTE_PATHS.map((path) => (
        <Route
          key={path}
          path={path}
          element={
            <MarketingPage
              activePath={activePath}
              onNavigate={handleNavigate}
              marketingContent={marketing.content}
              logoutUri={logoutUri}
            />
          }
        />
      ))}
      <Route
        path="/partner-portal"
        element={
          <PartnerPortalPage
            activePath={activePath}
            onNavigate={handleNavigate}
            logoutUri={logoutUri}
          />
        }
      />
      <Route
        path="/maintenance"
        element={
          <MaintenancePage
            activePath={activePath}
            onNavigate={handleNavigate}
            onNavigateHome={navigateHome}
          />
        }
      />
      <Route
        path="*"
        element={
          <NotFoundPage
            activePath={activePath}
            onNavigate={handleNavigate}
            onNavigateHome={navigateHome}
          />
        }
      />
    </Routes>
  )
}

function StatusPage({
  activePath,
  onNavigate,
  statusCode,
  statusLabel,
  title,
  description,
  actions,
  actionsLabel,
  children,
}) {
  const footer = <PublishingFooter onNavigate={onNavigate} />
  const header = <Header activePath={activePath} onNavigate={onNavigate} />

  return (
    <ErrorShell
      className="publishing-error-shell"
      statusCode={statusCode}
      statusLabel={statusLabel}
      title={title}
      description={description}
      actionsLabel={actionsLabel}
      actions={actions}
      header={header}
      footer={footer}
    >
      {children}
    </ErrorShell>
  )
}

function NotFoundPage({ activePath, onNavigate, onNavigateHome }) {
  return (
    <StatusPage
      activePath={activePath}
      onNavigate={onNavigate}
      statusCode={404}
      statusLabel="HTTP status code"
      title="Catalog page not found"
      description="We couldn’t locate the requested publishing page."
      actionsLabel="Explore other options"
      actions={[
        {
          label: 'Return to publishing home',
          href: '/',
          variant: 'primary',
          onClick: onNavigateHome,
        },
        {
          label: 'Email catalog support',
          href: 'mailto:partners@guidogerbpublishing.com?subject=Publishing%20portal%20support',
        },
      ]}
    >
      <p>
        Double-check the link or head back to the publishing overview to browse services, partner
        resources, and submission details. Our team can help route you to the right catalog contact
        if you email{' '}
        <a href="mailto:partners@guidogerbpublishing.com">partners@guidogerbpublishing.com</a>.
      </p>
    </StatusPage>
  )
}

function MaintenancePage({ activePath, onNavigate, onNavigateHome }) {
  return (
    <StatusPage
      activePath={activePath}
      onNavigate={onNavigate}
      statusCode={503}
      statusLabel="Service status"
      title="Partner portal undergoing updates"
      description="We’re refreshing catalog resources and will be back online shortly."
      actionsLabel="Stay connected"
      actions={[
        {
          label: 'Check publishing overview',
          href: '/',
          variant: 'primary',
          onClick: onNavigateHome,
        },
        {
          label: 'Request status update',
          href: 'mailto:partners@guidogerbpublishing.com?subject=Publishing%20status%20request',
        },
      ]}
    >
      <p>
        We’re applying production updates to the partner portal. Reach out to{' '}
        <a href="mailto:partners@guidogerbpublishing.com">partners@guidogerbpublishing.com</a> if
        you need catalog assets, submission timelines, or distribution reports while the refresh is
        in progress.
      </p>
    </StatusPage>
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
