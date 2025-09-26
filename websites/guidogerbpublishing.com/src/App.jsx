import { useEffect, useMemo, useState } from 'react'
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
import Welcome from './website-components/welcome-page/index.jsx'
import { fetchMarketingContent, getDefaultMarketingContent } from './marketingContent.js'
import './App.css'

const SECTION_SCROLL_BEHAVIOUR = { behavior: 'smooth', block: 'start' }

const scrollToSection = (id) => {
  if (!id || typeof document === 'undefined') return
  const element = document.getElementById(id)
  if (element?.scrollIntoView) {
    element.scrollIntoView(SECTION_SCROLL_BEHAVIOUR)
  }
}

export function useMarketingContentState() {
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

  return useMemo(() => ({ content, status }), [content, status])
}

export function MarketingLanding({ focusSectionId, logoutUri }) {
  const { content } = useMarketingContentState()

  useEffect(() => {
    if (focusSectionId) {
      scrollToSection(focusSectionId)
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [focusSectionId])

  const { hero, platform, distribution, resources, newsletter } = content

  return (
    <div className="gg-publishing-marketing" id="top">
      <section id="solutions" className="gg-publishing-section" aria-labelledby="solutions-title">
        <HeroSection headingId="solutions-title" {...hero} />
      </section>
      <section id="platform" className="gg-publishing-section" aria-labelledby="platform-title">
        <PlatformSection headingId="platform-title" columns={platform} />
      </section>
      <section
        id="distribution"
        className="gg-publishing-section"
        aria-labelledby="distribution-title"
      >
        <DistributionSection headingId="distribution-title" columns={distribution} />
      </section>
      <section id="resources" className="gg-publishing-section" aria-labelledby="resources-title">
        <ResourcesSection headingId="resources-title" columns={resources} />
      </section>
      <section id="newsletter" className="gg-publishing-section" aria-labelledby="newsletter-title">
        <NewsletterSection headingId="newsletter-title" {...newsletter} />
      </section>
      <section id="partner-portal" className="gg-publishing-section">
        <PartnerPortalSection logoutUri={logoutUri} WelcomeComponent={Welcome} useAuthHook={useAuth} />
      </section>
      <section id="contact" className="gg-publishing-contact">
        <div>
          <p className="gg-publishing-contact__eyebrow">Catalog partnerships</p>
          <h2>Work with GuidoGerb Publishing</h2>
          <p>
            Email <a href="mailto:hello@guidogerbpublishing.com">hello@guidogerbpublishing.com</a> or
            call <a href="tel:+12125559876">+1 (212) 555-9876</a> to discuss catalog development,
            distribution, or rights management partnerships.
          </p>
          <p>Headquarters in New York with a distributed production and licensing team.</p>
        </div>
      </section>
    </div>
  )
}

export function PartnerPortalRoute({ logoutUri }) {
  return (
    <section className="gg-publishing-protected" aria-labelledby="partner-portal-title">
      <h2 id="partner-portal-title">Partner operations portal</h2>
      <p className="gg-publishing-protected__copy">
        Signed-in partners can review royalty dashboards, download assets, and coordinate release
        plans with our production team.
      </p>
      <PartnerPortalSection logoutUri={logoutUri} WelcomeComponent={Welcome} useAuthHook={useAuth} />
    </section>
  )
}

function StatusLayout({
  statusCode,
  statusLabel,
  title,
  description,
  actions,
  children,
}) {
  return (
    <ErrorShell
      className="publishing-error-shell"
      statusCode={statusCode}
      statusLabel={statusLabel}
      title={title}
      description={description}
      actionsLabel="Explore other options"
      actions={actions}
    >
      {children}
    </ErrorShell>
  )
}

export function MaintenanceRoute() {
  return (
    <StatusLayout
      statusCode={503}
      statusLabel="Service status"
      title="Partner portal undergoing updates"
      description="We’re refreshing catalog resources and will be back online shortly."
      actions={[
        { label: 'Check publishing overview', href: '/' },
        {
          label: 'Request status update',
          href: 'mailto:partners@guidogerbpublishing.com?subject=Publishing%20status%20request',
        },
      ]}
    >
      <p>
        We’re applying production updates to the partner portal. Reach out to{' '}
        <a href="mailto:partners@guidogerbpublishing.com">partners@guidogerbpublishing.com</a> if
        you need catalog assets, submission timelines, or distribution reports while the refresh is in
        progress.
      </p>
    </StatusLayout>
  )
}

export function NotFoundRoute() {
  return (
    <StatusLayout
      statusCode={404}
      statusLabel="HTTP status code"
      title="Catalog page not found"
      description="We couldn’t locate the requested publishing page."
      actions={[
        { label: 'Return to publishing home', href: '/', variant: 'primary' },
        {
          label: 'Email catalog support',
          href: 'mailto:partners@guidogerbpublishing.com?subject=Publishing%20portal%20support',
        },
      ]}
    >
      <p>
        Double-check the link or head back to the publishing overview to browse services, partner
        resources, and submission details. Our team can help route you to the right catalog contact if
        you email{' '}
        <a href="mailto:partners@guidogerbpublishing.com">partners@guidogerbpublishing.com</a>.
      </p>
    </StatusLayout>
  )
}

export default MarketingLanding
