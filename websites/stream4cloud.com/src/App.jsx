import { PublicRouter } from '@guidogerb/components-router-public'
import './App.css'
import Welcome from './website-components/welcome-page/index.jsx'

const heroStats = [
  {
    label: 'Global PoPs',
    value: '43',
    description: 'Multi-region ingest fabric keeps glass-to-glass latency under three seconds.',
  },
  {
    label: '99.995% uptime',
    value: 'SLA',
    description: 'Redundant CloudFront edges, Lambda control plane, and DynamoDB multi-AZ storage.',
  },
  {
    label: 'Zero-touch ad breaks',
    value: 'Automation',
    description: 'SCTE-35 markers trigger server-side ad insertion without local switchers.',
  },
]

const workflowHighlights = [
  {
    title: 'Control room orchestration',
    description:
      'Provision encoder profiles, schedule rehearsal windows, and publish redundant ingest targets in minutes.',
    bullets: [
      'AWS Elemental, OBS, and LiveU presets verified by Stream4Cloud engineers.',
      'Role-based runbooks keep production, ad operations, and network teams aligned.',
      'Instant test events confirm bitrate, captions, and failover before you go live.',
    ],
  },
  {
    title: 'Monetization and insights',
    description:
      'Attach SSAI policies, entitlement tiers, and sponsor takeovers while analytics capture true-time engagement.',
    bullets: [
      'Stripe-powered checkout for PPV, subscriptions, and donation drives.',
      'Granular cohorts, QoE dashboards, and alerting built on OpenSearch and CloudWatch.',
      'Export downstream events to your CRM, data lake, or measurement stack.',
    ],
  },
  {
    title: 'Audience-first viewing',
    description:
      'Deliver crystal-clear streams with DVR controls, multi-language captions, and device-optimized players.',
    bullets: [
      'CloudFront edge policies tailored for low-latency, global audiences.',
      'Offline fallbacks and background sync safeguard watch parties during spotty connectivity.',
      'Accessibility-first UI meets WCAG AA with keyboard and screen reader parity.',
    ],
  },
]

const partnerSignals = [
  {
    heading: 'Launch playbooks',
    copy: 'Follow curated timelines that align marketing, production, and sponsor activations with automated reminders.',
  },
  {
    heading: 'Incident response',
    copy: '24/7 partner success coordinates network operations, reroutes ingest, and communicates status updates.',
  },
  {
    heading: 'Compliance assured',
    copy: 'PCI SAQ-A boundaries, GDPR tooling, and KMS-encrypted storage meet enterprise procurement requirements.',
  },
]

const routes = [
  { path: '/', element: <LandingRoute /> },
  { path: '/offline', element: <OfflineRoute /> },
]

function LandingRoute() {
  return (
    <div className="landing" id="top">
      <section className="hero" aria-labelledby="stream4cloud-hero">
        <p className="eyebrow">Enterprise streaming without fire drills</p>
        <h1 id="stream4cloud-hero">
          Stream4Cloud orchestrates your live control room across ingest, monetization, and audience
          experience.
        </h1>
        <p className="lede">
          Spin up broadcasts in hours—not weeks. We bundle AWS-native infrastructure, automation,
          and partner success so crews can focus on storytelling while the platform keeps quality
          high and viewers engaged.
        </p>
        <div className="hero-actions" role="group" aria-label="Key actions">
          <a
            className="action action--primary"
            href="https://calendly.com/stream4cloud/demo"
            target="_blank"
            rel="noreferrer"
          >
            Book a control room tour
          </a>
          <a className="action action--secondary" href="mailto:partners@stream4cloud.com">
            Email partner success
          </a>
        </div>
        <dl className="hero-stats" aria-label="Stream4Cloud impact">
          {heroStats.map(({ label, value, description }) => (
            <div key={label}>
              <dt>{value}</dt>
              <dd>
                <p className="stat-label">{label}</p>
                <p className="stat-description">{description}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <nav aria-label="On-page sections" className="jump-links">
        <a href="#control-room-orchestration">Control room</a>
        <a href="#monetization-and-insights">Monetization</a>
        <a href="#audience-first-viewing">Audience experience</a>
        <a href="#partner">Partner hub</a>
      </nav>

      <section className="workflow" aria-labelledby="stream4cloud-workflow">
        <h2 id="stream4cloud-workflow">Broadcast workflow built for teams</h2>
        <div className="workflow-grid">
          {workflowHighlights.map(({ title, description, bullets }) => (
            <article key={title} id={toFragmentId(title)}>
              <h3>{title}</h3>
              <p>{description}</p>
              <ul>
                {bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="signals" aria-labelledby="stream4cloud-signals">
        <h2 id="stream4cloud-signals">Why broadcasters choose Stream4Cloud</h2>
        <div className="signals-grid">
          {partnerSignals.map(({ heading, copy }) => (
            <article key={heading}>
              <h3>{heading}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta" aria-labelledby="stream4cloud-cta">
        <div>
          <h2 id="stream4cloud-cta">Ready for the next live moment?</h2>
          <p>
            Tell us about your upcoming premiere, sports season, or benefit stream. We’ll align
            production, monetization, and audience targets so launch day is calm, measurable, and
            repeatable.
          </p>
        </div>
        <div className="cta-actions">
          <a
            className="action action--primary"
            href="https://stream4cloud.com/request-proposal"
            target="_blank"
            rel="noreferrer"
          >
            Request a proposal
          </a>
          <a className="action action--ghost" href="tel:+18005550135">
            Call +1 (800) 555-0135
          </a>
        </div>
      </section>

      <section className="partner-preview" aria-labelledby="stream4cloud-partner" id="partner">
        <div className="partner-copy">
          <h2 id="stream4cloud-partner">Partner success hub preview</h2>
          <p>
            Signed-in collaborators access rehearsal timelines, integration kits, and escalation
            contacts tailored to each production. Our service worker keeps critical playbooks ready
            even if connectivity drops at the venue.
          </p>
        </div>
        <div className="partner-panel" role="presentation">
          <Welcome />
        </div>
      </section>
    </div>
  )
}

function OfflineRoute() {
  return (
    <div className="offline" aria-labelledby="offline-heading">
      <section className="offline-card">
        <h1 id="offline-heading">You’re offline</h1>
        <p>
          Cached resources are available for critical broadcasts, but some analytics and
          configuration pages require an active connection. Reconnect to continue orchestrating your
          event.
        </p>
        <a className="action action--secondary" href="/">
          Return to Stream4Cloud home
        </a>
      </section>
    </div>
  )
}

function toFragmentId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function App({ router, routerOptions }) {
  return (
    <PublicRouter
      routes={routes}
      defaultFallback={{
        title: 'Stream4Cloud page unavailable',
        description:
          'The requested page may be offline or unpublished. Return to the control room overview or load the offline help center for quick links.',
        primaryAction: { label: 'Back to Stream4Cloud', href: '/' },
        secondaryAction: { label: 'Open offline support', href: '/offline' },
      }}
      router={router}
      routerOptions={routerOptions}
    />
  )
}

export default App
