import { useAuth } from '@guidogerb/components-auth'

const DEFAULT_COLLABORATOR_NAME = 'Regulator'

const RESOURCE_SECTIONS = [
  {
    title: 'Filings & compliance deadlines',
    description:
      'Track statutory deadlines, submit compliance packets, and coordinate multi-state reviews.',
    links: [
      {
        label: 'Review filing calendar',
        href: 'https://compliance.ggp.llc/filings/calendar',
      },
      {
        label: 'Submit annual compliance report',
        href: 'https://compliance.ggp.llc/forms/annual-report',
      },
      {
        label: 'Download emergency order toolkit',
        href: 'https://compliance.ggp.llc/resources/emergency-order-toolkit.pdf',
      },
    ],
  },
  {
    title: 'Licensing dashboards',
    description:
      'Monitor queue health, assignment load, and cross-agency collaboration for active licenses.',
    links: [
      {
        label: 'Open licensing cases',
        href: 'https://portal.ggp.llc/licensing/dashboard',
      },
      {
        label: 'Escalation review board',
        href: 'https://portal.ggp.llc/licensing/escalations',
      },
      {
        label: 'Renewal pipeline status',
        href: 'https://portal.ggp.llc/licensing/renewals',
      },
    ],
  },
  {
    title: 'AI assistance & training',
    description:
      'Leverage AI guidance for audit prep, drafting responses, and documenting statutory decisions.',
    links: [
      {
        label: 'Launch compliance co-pilot',
        href: 'https://ai.ggp.llc/copilot',
      },
      {
        label: 'AI audit trail guidelines',
        href: 'https://ai.ggp.llc/resources/audit-trail.pdf',
      },
      {
        label: 'Email regulatory innovation team',
        href: 'mailto:innovation@ggp.llc',
      },
    ],
  },
]

export default function Welcome({ children }) {
  const auth = useAuth()

  if (auth?.error) {
    return <div className="ggp-welcome__error">Sign-in failed: {auth.error.message}</div>
  }

  if (!auth?.isAuthenticated) {
    return <div className="ggp-welcome__loading">Loading regulator workspace…</div>
  }

  const profile = auth?.user?.profile ?? {}
  const name =
    profile.name ??
    profile['cognito:username'] ??
    profile.preferred_username ??
    DEFAULT_COLLABORATOR_NAME
  const email = profile.email
  const agency = profile['custom:agencyName']

  return (
    <section className="ggp-welcome" aria-label="GGP regulator welcome">
      <header className="ggp-welcome__header">
        <h3 className="ggp-welcome__title">Welcome {name}</h3>
        {agency ? <p className="ggp-welcome__meta">{agency} regulator workspace</p> : null}
        {email ? <p className="ggp-welcome__meta">Signed in as {email}</p> : null}
      </header>

      <p className="ggp-welcome__intro">
        Review licensing pipelines, collaborate on compliance responses, and surface AI guidance to
        keep multi-state filings on track.
      </p>

      <div className="ggp-welcome__sections">
        {RESOURCE_SECTIONS.map((section) => (
          <section key={section.title} className="ggp-welcome__section">
            <h4 className="ggp-welcome__section-title">{section.title}</h4>
            <p className="ggp-welcome__section-description">{section.description}</p>
            <ul className="ggp-welcome__links" role="list">
              {section.links.map((link) => (
                <li key={link.href} className="ggp-welcome__link-item">
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {children ? <div className="ggp-welcome__slot">{children}</div> : null}
    </section>
  )
}
