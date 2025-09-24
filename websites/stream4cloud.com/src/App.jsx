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

const broadcasterOutcomes = [
  {
    title: 'Expedite launch windows',
    description:
      'Templatized runbooks align ticketing, marketing, and production so international premieres go live on schedule.',
    cta: { label: 'Plan your next premiere', href: 'https://stream4cloud.com/launch' },
  },
  {
    title: 'Grow monetization velocity',
    description:
      'Bundle SSAI policies, sponsorship takeovers, and paywall tiers while analytics surface conversion pivots in real time.',
    cta: { label: 'Explore revenue playbooks', href: 'https://stream4cloud.com/monetization' },
  },
  {
    title: 'Protect show-day confidence',
    description:
      'Integrated rehearsal sandboxes, telemetry alerts, and escalation protocols keep every broadcast calm and measurable.',
    cta: {
      label: 'Schedule a readiness review',
      href: 'https://calendly.com/stream4cloud/readiness',
    },
  },
]

const operationsPillars = [
  {
    title: 'Signal uptime commitments',
    bullets: [
      'Active-active ingest orchestrated across AWS Regions with automatic failover.',
      'Edge health scoring reroutes viewers before QoE dips below broadcast thresholds.',
      'Live incident dashboards keep production, ad ops, and partners aligned in minutes.',
    ],
  },
  {
    title: 'Automated broadcast logistics',
    bullets: [
      'Rehearsal staging provisions encoders, captions, and ad markers in a single click.',
      'Calendar sync keeps talent, sponsorships, and marketing launches coordinated.',
      'Role-based workflows ensure approvals and notifications never block go-live.',
    ],
  },
  {
    title: 'Audience trust and compliance',
    bullets: [
      'WCAG AA viewer experience with multilingual captions and keyboard parity.',
      'GDPR tooling, KMS encryption, and PCI SAQ-A boundaries for procurement reviews.',
      'Audit-ready logs stream into your SIEM or data lake with zero manual exports.',
    ],
  },
]

const broadcastTimeline = [
  {
    title: 'Align the launch blueprint',
    description:
      'Kick off production, marketing, and sponsor workflows with one shared source of truth and automated reminders.',
    milestones: [
      'Scope talent, entitlement tiers, and blackout windows using templated control-room checklists.',
      'Distribute approval deadlines and review assignments with Slack or Teams sync to keep crews aligned.',
      'Confirm signal paths, redundancy tiers, and venue connectivity requirements with partners and vendors.',
    ],
  },
  {
    title: 'Rehearse with automation',
    description:
      'Provision rehearsal sandboxes that mirror production so every encoder, marker, and alert is validated before go-live.',
    milestones: [
      'Spin up encoder presets, captions, and SSAI markers from the playbook in minutes instead of days.',
      'Trigger rehearsal reminders and run-of-show updates for talent, ad operations, and partner success.',
      'Capture rehearsal metrics and incident notes that roll directly into the live broadcast dashboard.',
    ],
  },
  {
    title: 'Go live with shared telemetry',
    description:
      'Operate from one command center where ingest, monetization, and support see the same live health signals.',
    milestones: [
      'Monitor glass-to-glass latency, ad decisioning, and audience growth from unified dashboards.',
      'Escalate incidents instantly with pre-routed paging, playbooks, and partner communication templates.',
      'Streamline sponsor takeovers and merchandising pivots with consent-aware analytics instrumentation.',
    ],
  },
  {
    title: 'Measure and optimise the next season',
    description:
      'Close the loop with exports, benchmarking, and experiment planning that accelerate the following broadcast window.',
    milestones: [
      'Schedule KPI digests, incident summaries, and sponsor conversion reports to land in stakeholder inboxes.',
      'Feed post-event learnings into catalog, monetisation, and partner success workstreams automatically.',
      'Archive timelines and approvals so procurement, compliance, and legal reviews are audit-ready.',
    ],
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
        <a href="#broadcast-timeline">Timeline</a>
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

      <section className="broadcaster-outcomes" aria-labelledby="stream4cloud-outcomes">
        <div className="broadcaster-outcomes__intro">
          <h2 id="stream4cloud-outcomes">Broadcast partner outcomes</h2>
          <p>
            Stream orchestration, monetization, and partner success operate as one playbook so your
            control room can focus on the story instead of stitching together tools.
          </p>
        </div>
        <div className="broadcaster-outcomes__grid">
          {broadcasterOutcomes.map(({ title, description, cta }) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
              <a className="broadcaster-outcomes__cta" href={cta.href}>
                {cta.label}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="operations" aria-labelledby="stream4cloud-operations">
        <div className="operations__intro">
          <h2 id="stream4cloud-operations">Operational guardrails engineered for broadcast</h2>
          <p>
            Automation and telemetry keep your team ahead of spikes in demand, ad inventory shifts,
            or venue connectivity surprises.
          </p>
        </div>
        <div className="operations__grid">
          {operationsPillars.map(({ title, bullets }) => (
            <article key={title}>
              <h3>{title}</h3>
              <ul>
                {bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="timeline" aria-labelledby="stream4cloud-timeline" id="broadcast-timeline">
        <div className="timeline__intro">
          <h2 id="stream4cloud-timeline">Broadcast readiness timeline</h2>
          <p>
            Follow the runbook our partner success team uses to take every premiere from first brief
            to wrap-up reporting. Each phase keeps production, monetization, and analytics crews on
            the same cadence.
          </p>
        </div>
        <ol className="timeline__list" aria-label="Broadcast readiness steps">
          {broadcastTimeline.map(({ title, description, milestones }, index) => (
            <li key={title} className="timeline__item">
              <span className="timeline__marker" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="timeline__content">
                <h3>{title}</h3>
                <p>{description}</p>
                <ul className="timeline__milestones">
                  {milestones.map((milestone) => (
                    <li key={milestone}>{milestone}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
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
