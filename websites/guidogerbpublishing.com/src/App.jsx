import { useCallback, useEffect, useState } from 'react'
import { Footer } from '@guidogerb/footer'
import { Header, HeaderContextProvider } from '@guidogerb/header'
import './App.css'
import headerSettings from './headerSettings.js'
import footerSettings from './footerSettings.js'
import {
  DistributionSection,
  HeroSection,
  NewsletterSection,
  PartnerPortalSection,
  PlatformSection,
  ResourcesSection,
} from './website-components/sections/index.js'

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
          <HeroSection />
          <PlatformSection />
          <DistributionSection />
          <ResourcesSection />
          <NewsletterSection />
          <PartnerPortalSection logoutUri={import.meta.env.VITE_LOGOUT_URI} />
        </main>

        <Footer {...footerSettings} onNavigate={handleNavigate} id="contact">
          <div className="footer-contact">
            <h2>Work with GuidoGerb Publishing</h2>
            <p>
              Email <a href="mailto:hello@guidogerbpublishing.com">hello@guidogerbpublishing.com</a>{' '}
              or call <a href="tel:+12125559876">+1 (212) 555-9876</a> to discuss catalog
              development, distribution, or rights management partnerships.
            </p>
            <p>Headquarters in New York with a distributed production and licensing team.</p>
          </div>
        </Footer>
      </div>
    </HeaderContextProvider>
  )
}

export default App
