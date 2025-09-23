import Protected from '@guidogerb/components-pages-protected'
import { ErrorShell } from '@guidogerb/components-pages-public'
import { Footer } from '@guidogerb/footer'
import { Header, HeaderContextProvider } from '@guidogerb/header'
import { PublicRouter } from '@guidogerb/components-router-public'
import './App.css'
import headerSettings from './headerSettings.js'
import footerSettings from './footerSettings.js'
import Welcome from './website-components/welcome-page/index.jsx'
import { MARKETING_PATHS, useRegulatorNavigation } from './useRegulatorNavigation.js'

const heroMetrics = [
  {
    label: 'jurisdictions orchestrated',
    value: '48',
    description:
      'State and municipal agencies collaborate on unified licensing, compliance, and enforcement queues.',
  },
  {
    label: 'licensing decisions/day',
    value: '12K',
    description:
      'Queue automation, statutory guidance, and AI assistance keep determinations flowing under mandated SLAs.',
  },
  {
    label: 'availability',
    value: '99.98%',
    description:
      'Multi-region API Gateway, Lambda, and DynamoDB architecture engineered for government-grade resiliency.',
  },
]

const modernizationPillars = [
  {
    id: 'licensing',
    title: 'Licensing modernization',
    description:
      'Digitize application intake, automate triage, and coordinate reviews across agencies without paper packets.',
    highlights: [
      'Configurable workflows cover intake, investigations, renewals, and appeals with audit trails.',
      'Assignment intelligence balances workload and uncovers bottlenecks across geographies.',
      'Pre-built templates accelerate migration from legacy mainframes and spreadsheet trackers.',
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance & enforcement',
    description:
      'Surface risk signals, coordinate enforcement actions, and keep statutory responses within deadlines.',
    highlights: [
      'Real-time dashboards track complaint aging, penalties, and consent order execution.',
      'Incident command views synchronize field investigators, attorneys, and communications teams.',
      'Automated correspondence merges statutory language with agency-specific branding.',
    ],
  },
  {
    id: 'analytics',
    title: 'Oversight analytics',
    description:
      'Move from static reports to living analytics that forecast workload and identify compliance drift.',
    highlights: [
      'Outcome dashboards compare jurisdictions, industries, and equity measures with drill-down filters.',
      'Data lake exports keep BI partners and legislative stakeholders aligned on the same truth set.',
      'KPI guardrails trigger alerts before SLA breaches impact citizens or regulated entities.',
    ],
  },
]

const aiSupportHighlights = [
  {
    title: 'AI policy copilot',
    copy: 'Draft determinations, summarize case files, and transform guidance into citizen-ready explanations.',
  },
  {
    title: 'Responsible guardrails',
    copy: 'Human-in-the-loop reviews, auditable prompts, and jurisdiction-specific retention controls.',
  },
  {
    title: 'Training enablement',
    copy: 'Scenario-based learning accelerates onboarding for new analysts, examiners, and adjudicators.',
  },
]

const portalHighlights = [
  {
    title: 'Unified queue intelligence',
    copy: 'Monitor backlog, assignments, and SLA commitments across licensing and enforcement programs.',
  },
  {
    title: 'Collaboration timelines',
    copy: 'Coordinate multi-agency reviews with shared timelines, notes, and decision playbooks.',
  },
  {
    title: 'Digital evidence vault',
    copy: 'Secure uploads, versioned exhibits, and retention policies aligned with statutory obligations.',
  },
]

const portalSkeleton = {
  licensing: {
    title: 'Licensing workspace',
    description:
      'Configure digital intake, balance investigator workload, and finalize determinations with defensible audit trails.',
    bullets: [
      'Queue intelligence surfaces expiring credentials and cases pending supervisory review.',
      'Shared review notes eliminate email chains and preserve context for appeals.',
      'Bulk renewal tooling keeps agencies on schedule ahead of statutory deadlines.',
    ],
  },
  compliance: {
    title: 'Compliance operations',
    description:
      'Track complaints from initial tip through enforcement while safeguarding sensitive evidence.',
    bullets: [
      'Risk scoring blends historical outcomes with AI-detected anomalies.',
      'Command center view synchronizes field teams, legal, and communications.',
      'Consent order workflows ensure restitution, fines, and remediation are verified.',
    ],
  },
  analytics: {
    title: 'Analytics & oversight',
    description:
      'Measure performance, equity, and backlog reduction with live dashboards and export-ready datasets.',
    bullets: [
      'Legislative briefing kits summarize impact by district, industry, and time period.',
      'Data lake connectors keep Tableau, PowerBI, and open data portals in sync.',
      'Alerting policies detect compliance drift before SLA thresholds are breached.',
    ],
  },
  ai: {
    title: 'AI assistance program',
    description:
      'Deploy responsible AI helpers that accelerate drafting while honoring transparency and retention mandates.',
    bullets: [
      'Prompt templates tuned to statutory language and agency tone.',
      'Reviewer sign-off steps capture human approvals for every AI suggestion.',
      'Usage analytics expose training needs and detect anomalous activity.',
    ],
  },
}

const MAINTENANCE_PATH = '/maintenance'

const MARKETING_ROUTES = MARKETING_PATHS.map((path) => ({ path, element: <LandingRoute /> }))

const PORTAL_ROUTES = [
  { path: '/portal', element: <PortalRoute module="licensing" /> },
  { path: '/portal/licensing', element: <PortalRoute module="licensing" /> },
  { path: '/portal/compliance', element: <PortalRoute module="compliance" /> },
  { path: '/portal/analytics', element: <PortalRoute module="analytics" /> },
  { path: '/portal/ai', element: <PortalRoute module="ai" /> },
]

const routes = [
  ...MARKETING_ROUTES,
  ...PORTAL_ROUTES,
  { path: MAINTENANCE_PATH, element: <MaintenanceRoute /> },
]

function LandingRoute() {
  const { activePath, handleNavigate, navigateHome } = useRegulatorNavigation()

  return (
    <HeaderContextProvider defaultSettings={headerSettings}>
      <div className="ggp-shell" id="top">
        <Header activePath={activePath} onNavigate={handleNavigate} />

        <main className="ggp-main">
          <section className="ggp-hero" aria-labelledby="ggp-hero-heading">
            <div className="ggp-hero__content">
              <p className="ggp-hero__eyebrow">Government modernization without disruption</p>
              <h1 id="ggp-hero-heading">
                GGP Regulatory Platform unifies licensing, compliance, analytics, and AI assistance
                for state agencies.
              </h1>
              <p className="ggp-hero__lede">
                Coordinate cross-agency casework, shrink backlogs, and deliver transparent outcomes
                the public can trust—all on a secure cloud foundation validated for government
                workloads.
              </p>
              <div className="ggp-hero__actions" role="group" aria-label="Primary actions">
                <a
                  className="ggp-action ggp-action--primary"
                  href="https://calendly.com/ggp-regulation/modernization"
                  target="_blank"
                  rel="noreferrer"
                >
                  Schedule a modernization briefing
                </a>
                <a className="ggp-action ggp-action--ghost" href="mailto:innovation@ggp.llc">
                  Contact regulatory innovation
                </a>
              </div>
            </div>
            <dl className="ggp-hero__metrics" aria-label="Platform impact metrics">
              {heroMetrics.map(({ label, value, description }) => (
                <div key={label}>
                  <dt>{value}</dt>
                  <dd>
                    <p className="ggp-metric__label">{label}</p>
                    <p className="ggp-metric__description">{description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="ggp-modernization" aria-labelledby="ggp-modernization-heading">
            <div className="ggp-section__intro">
              <h2 id="ggp-modernization-heading">
                Operational pillars for every regulatory mandate
              </h2>
              <p>
                Modular capabilities let licensing, compliance, and oversight teams adopt modern
                workflows at their own pace—without losing statutory nuance or historical context.
              </p>
            </div>
            <div className="ggp-modernization__grid">
              {modernizationPillars.map((pillar) => (
                <article key={pillar.id} id={pillar.id} className="ggp-modernization__card">
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                  <ul>
                    {pillar.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="ggp-ai" id="ai-support" aria-labelledby="ggp-ai-heading">
            <div className="ggp-section__intro">
              <h2 id="ggp-ai-heading">Responsible AI that keeps humans in control</h2>
              <p>
                GGP’s AI assistance program is designed with policy, ethics, and transparency teams
                to ensure every suggestion is reviewable, explainable, and auditable.
              </p>
            </div>
            <div className="ggp-ai__grid">
              {aiSupportHighlights.map((item) => (
                <article key={item.title} className="ggp-ai__card">
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="ggp-portal" id="portal-preview" aria-labelledby="ggp-portal-heading">
            <div className="ggp-portal__copy">
              <h2 id="ggp-portal-heading">Portal preview: a secure home for regulators</h2>
              <p>
                Invite cross-agency collaborators into a shared workspace that keeps sensitive data
                protected, workflows transparent, and outcomes measurable. The portal aligns intake,
                investigations, and oversight in one place.
              </p>
              <ul className="ggp-portal__highlights">
                {portalHighlights.map((highlight) => (
                  <li key={highlight.title}>
                    <h3>{highlight.title}</h3>
                    <p>{highlight.copy}</p>
                  </li>
                ))}
              </ul>
              <a className="ggp-action ggp-action--secondary" href="/portal">
                Explore the regulator workspace
              </a>
            </div>
            <div className="ggp-portal__preview" role="presentation">
              <Protected
                logoutUri={import.meta.env.VITE_LOGOUT_URI}
                fallback={<div className="ggp-portal__loading">Loading regulator workspace…</div>}
              >
                <Welcome>
                  <p>
                    Coordinate licensing reviews, document enforcement actions, and share analytics
                    snapshots with leadership without leaving the secure workspace.
                  </p>
                </Welcome>
              </Protected>
            </div>
          </section>

          <section className="ggp-contact" id="contact" aria-labelledby="ggp-contact-heading">
            <div className="ggp-contact__card">
              <h2 id="ggp-contact-heading">Partner with the GGP modernization team</h2>
              <p>
                We work with CIOs, program directors, and policy leaders to deliver phased
                modernization that earns trust from frontline staff and the public.
              </p>
              <dl className="ggp-contact__details">
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href="mailto:innovation@ggp.llc">innovation@ggp.llc</a>
                  </dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href="tel:+12025550123">+1 (202) 555-0123</a>
                  </dd>
                </div>
                <div>
                  <dt>Headquarters</dt>
                  <dd>Washington, D.C. with regional delivery hubs nationwide.</dd>
                </div>
              </dl>
              <button type="button" className="ggp-action ggp-action--ghost" onClick={navigateHome}>
                Return to top
              </button>
            </div>
          </section>
        </main>

        <Footer {...footerSettings} onNavigate={handleNavigate} />
      </div>
    </HeaderContextProvider>
  )
}

function PortalRoute({ module = 'licensing' }) {
  const { activePath, handleNavigate } = useRegulatorNavigation()
  const content = portalSkeleton[module] ?? portalSkeleton.licensing

  return (
    <HeaderContextProvider defaultSettings={headerSettings}>
      <div className="ggp-portal-shell" id="portal">
        <Header activePath={activePath} onNavigate={handleNavigate} />
        <main className="ggp-portal-main">
          <section className="ggp-portal-hero" aria-labelledby="ggp-portal-title">
            <h1 id="ggp-portal-title">{content.title}</h1>
            <p>{content.description}</p>
          </section>
          <Protected
            logoutUri={import.meta.env.VITE_LOGOUT_URI}
            fallback={<div className="ggp-portal__loading">Preparing secure workspace…</div>}
          >
            <div className="ggp-portal-surface">
              <Welcome>
                <p>
                  Access queue intelligence, review statutory guidance, and coordinate with partner
                  agencies in one shared workspace. Upcoming releases will add deep links into
                  analytics, filings, and AI assistance.
                </p>
              </Welcome>
              <section className="ggp-portal-roadmap" aria-label="Upcoming workspace capabilities">
                <h2>Roadmap focus areas</h2>
                <ul>
                  {content.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </section>
            </div>
          </Protected>
        </main>
        <Footer {...footerSettings} onNavigate={handleNavigate} />
      </div>
    </HeaderContextProvider>
  )
}

function NotFoundRoute() {
  const { activePath, handleNavigate, navigateHome } = useRegulatorNavigation()

  return (
    <HeaderContextProvider defaultSettings={headerSettings}>
      <ErrorShell
        className="ggp-error-shell"
        statusCode={404}
        statusLabel="HTTP status code"
        title="Regulatory page unavailable"
        description="We couldn’t find the requested page inside the modernization workspace."
        actionsLabel="Continue exploring"
        actions={[
          {
            label: 'Return to modernization overview',
            href: '/',
            variant: 'primary',
            onClick: navigateHome,
          },
          {
            label: 'Email modernization support',
            href: 'mailto:innovation@ggp.llc?subject=Regulatory%20portal%20help',
          },
        ]}
        header={<Header activePath={activePath} onNavigate={handleNavigate} />}
        footer={<Footer {...footerSettings} onNavigate={handleNavigate} />}
      >
        <p>
          Double-check the link or head back to the regulatory platform overview to continue
          learning how GGP modernizes licensing, compliance, analytics, and AI assistance.
        </p>
      </ErrorShell>
    </HeaderContextProvider>
  )
}

function MaintenanceRoute() {
  const { activePath, handleNavigate, navigateHome } = useRegulatorNavigation()

  return (
    <HeaderContextProvider defaultSettings={headerSettings}>
      <ErrorShell
        className="ggp-error-shell"
        statusCode={503}
        statusLabel="Service status"
        title="Portal maintenance in progress"
        description="We’re applying compliance and security updates to the regulatory workspace."
        actionsLabel="Stay informed"
        actions={[
          {
            label: 'Check modernization overview',
            href: '/',
            variant: 'primary',
            onClick: navigateHome,
          },
          {
            label: 'Schedule a modernization briefing',
            href: 'https://calendly.com/ggp-regulation/modernization',
            external: true,
          },
        ]}
        header={<Header activePath={activePath} onNavigate={handleNavigate} />}
        footer={<Footer {...footerSettings} onNavigate={handleNavigate} />}
      >
        <p>
          Our team is briefly pausing access while we roll out new oversight tooling. Reach out at{' '}
          <a href="mailto:innovation@ggp.llc">innovation@ggp.llc</a> for regulatory updates or to
          request a dedicated status briefing.
        </p>
      </ErrorShell>
    </HeaderContextProvider>
  )
}

function App() {
  return <PublicRouter routes={routes} fallback={<NotFoundRoute />} />
}

export default App
