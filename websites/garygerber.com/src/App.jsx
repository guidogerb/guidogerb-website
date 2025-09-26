import { useEffect } from 'react'
import { useAuth } from '@guidogerb/components-auth'
import {
  ProgramsHeroSection,
  ConsultingSection,
  RecordingsEducationSection,
  AboutPressSection,
  NewsletterSignupSection,
  RehearsalRoomSection,
  Welcome,
} from '@guidogerb/components-ui'
import RehearsalPortalNavigation from './RehearsalPortalNavigation.jsx'
import RehearsalResourcesLanding from './RehearsalResourcesLanding.jsx'
import rehearsalResources from './rehearsalResources.js'
import NotFound from './NotFound.jsx'
import './App.css'

const SECTION_SCROLL_BEHAVIOUR = { behavior: 'smooth', block: 'start' }

const scrollToSection = (id) => {
  if (!id || typeof document === 'undefined') return
  const element = document.getElementById(id)
  if (element?.scrollIntoView) {
    element.scrollIntoView(SECTION_SCROLL_BEHAVIOUR)
  }
}

export function MarketingLanding({
  focusSectionId,
  logoutUri,
  resources = rehearsalResources,
}) {
  useEffect(() => {
    if (focusSectionId) {
      scrollToSection(focusSectionId)
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [focusSectionId])

  return (
    <div className="gg-garygerber-marketing" id="top">
      <section id="programs" className="gg-garygerber-section" aria-labelledby="programs-title">
        <ProgramsHeroSection headingId="programs-title" />
      </section>
      <section
        id="consulting"
        className="gg-garygerber-section"
        aria-labelledby="consulting-title"
      >
        <ConsultingSection headingId="consulting-title" />
      </section>
      <section
        id="recordings"
        className="gg-garygerber-section"
        aria-labelledby="recordings-title"
      >
        <RecordingsEducationSection headingId="recordings-title" />
      </section>
      <section id="about" className="gg-garygerber-section" aria-labelledby="about-title">
        <AboutPressSection headingId="about-title" />
      </section>
      <section
        id="newsletter"
        className="gg-garygerber-section"
        aria-labelledby="newsletter-title"
      >
        <NewsletterSignupSection headingId="newsletter-title" />
      </section>
      <section id="client-access" className="gg-garygerber-section">
        <RehearsalRoomSection logoutUri={logoutUri}>
          <Welcome rehearsalResources={resources} useAuthHook={useAuth}>
            <RehearsalPortalNavigation resources={resources} />
          </Welcome>
        </RehearsalRoomSection>
      </section>
      <section id="contact" className="gg-garygerber-contact">
        <div>
          <p className="gg-garygerber-contact__eyebrow">Bookings &amp; inquiries</p>
          <h2>Bring Gary Gerber to your next residency</h2>
          <p>
            Email <a href="mailto:hello@garygerber.com">hello@garygerber.com</a> or call{' '}
            <a href="tel:+16125550123">+1 (612) 555-0123</a> to coordinate tour dates, workshops,
            and special performances.
          </p>
          <p>Based in Minneapolis and collaborating worldwide.</p>
        </div>
      </section>
    </div>
  )
}

export function RehearsalOverviewRoute({ logoutUri, resources = rehearsalResources }) {
  return (
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
      <RehearsalRoomSection logoutUri={logoutUri}>
        <Welcome rehearsalResources={resources} useAuthHook={useAuth}>
          <RehearsalPortalNavigation resources={resources} />
        </Welcome>
      </RehearsalRoomSection>
    </section>
  )
}

export function RehearsalResourcesRoute({ logoutUri, resources = rehearsalResources }) {
  return (
    <section className="rehearsal-portal" aria-labelledby="rehearsal-resources-title">
      <header className="rehearsal-portal__intro">
        <p className="rehearsal-portal__eyebrow">Rehearsal library</p>
        <h2 id="rehearsal-resources-title">Upcoming call times &amp; download vault</h2>
        <p>
          Download the latest production assets, confirm call times, and subscribe to the shared
          calendar so every residency stays in sync.
        </p>
      </header>
      <RehearsalRoomSection logoutUri={logoutUri}>
        <Welcome rehearsalResources={resources} useAuthHook={useAuth}>
          <RehearsalResourcesLanding resources={resources} />
        </Welcome>
      </RehearsalRoomSection>
    </section>
  )
}

export function NotFoundRoute({ resources = rehearsalResources, onNavigateHome }) {
  return <NotFound onNavigateHome={onNavigateHome} resources={resources} />
}

export default MarketingLanding
