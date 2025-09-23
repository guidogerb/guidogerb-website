import { useEffect } from 'react'
import { useAnalytics } from '@guidogerb/components-analytics'
import { useAuth } from '@guidogerb/components-auth'

const BROADCAST_DOCS = [
  {
    href: 'https://support.stream4cloud.com/docs/control-room-readiness',
    label: 'Control room readiness checklist',
    description:
      'Verify ingest endpoints, redundancy, and failover scenarios before every broadcast window.',
  },
  {
    href: 'https://support.stream4cloud.com/docs/ad-break-automation',
    label: 'Ad break automation playbook',
    description:
      'Coordinate SCTE-35 markers, server-side ad insertion, and regional blackout overrides.',
  },
  {
    href: 'https://support.stream4cloud.com/docs/latency-guardrails',
    label: 'Ultra-low latency guardrails',
    description:
      'Tune encoder buffers and edge preferences to maintain <3s glass-to-glass during live shows.',
  },
]

const INTEGRATION_GUIDES = [
  {
    href: 'https://support.stream4cloud.com/integrations/encoders',
    label: 'Encoder integration quick-start',
    description: 'Step-by-step profiles for LiveU, OBS, AWS Elemental, and hardware switchers.',
  },
  {
    href: 'https://support.stream4cloud.com/integrations/crm-to-stream',
    label: 'CRM to stream automation',
    description: 'Automate talent scheduling, metadata sync, and entitlement provisioning.',
  },
  {
    href: 'https://support.stream4cloud.com/integrations/analytics',
    label: 'Analytics instrumentation toolkit',
    description:
      'Wire custom dimensions for ratings, conversion goals, and monetization experiments.',
  },
]

const SUPPORT_CONTACTS = [
  {
    href: 'mailto:success@stream4cloud.com',
    label: 'Partner success desk',
    description: 'Email for run-of-show reviews, rehearsal staging, and SLA alignment questions.',
  },
  {
    href: 'tel:+18005550135',
    label: '24/7 network operations hotline',
    description: 'Call immediately for signal checks or rapid incident escalation.',
  },
  {
    href: 'https://calendly.com/stream4cloud/broadcaster-onboarding',
    label: 'Schedule a redundancy workshop',
    description:
      'Book time with solutions engineers to review failover, DR drills, and analytics goals.',
  },
]

const isExternalHref = (href) => /^https?:/i.test(href)

export default function Welcome({ children }) {
  const auth = useAuth()
  const analytics = useAnalytics()
  const isAuthenticated = Boolean(auth?.isAuthenticated)
  const profile = auth?.user?.profile ?? {}
  const collaboratorName = profile?.['cognito:username'] ?? profile?.name ?? 'userNotAvailable'

  useEffect(() => {
    if (!isAuthenticated) return
    if (typeof analytics?.trackEvent !== 'function') return

    analytics.trackEvent('stream4cloud.auth.sign_in_complete', {
      collaborator: collaboratorName,
    })
  }, [analytics, collaboratorName, isAuthenticated])

  if (auth?.error) return <div>Sign-in failed: {auth.error.message}</div>
  if (!isAuthenticated) return <div>Welcome Loading...</div>

  const name = collaboratorName

  return (
    <section aria-labelledby="stream4cloud-welcome-heading">
      <header>
        <h3 id="stream4cloud-welcome-heading">Welcome {name}</h3>
        <p>
          Your collaboration space is ready. Use the curated broadcast resources below to coordinate
          production, integrations, and support.
        </p>
      </header>

      <section aria-labelledby="stream4cloud-broadcast-docs">
        <h4 id="stream4cloud-broadcast-docs">Broadcast documentation</h4>
        <ul>
          {BROADCAST_DOCS.map(({ href, label, description }) => (
            <li key={href}>
              <a
                href={href}
                {...(isExternalHref(href) ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {label}
              </a>
              <p>{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stream4cloud-integration-guides">
        <h4 id="stream4cloud-integration-guides">Integration quick-starts</h4>
        <ul>
          {INTEGRATION_GUIDES.map(({ href, label, description }) => (
            <li key={href}>
              <a
                href={href}
                {...(isExternalHref(href) ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {label}
              </a>
              <p>{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stream4cloud-support-contacts">
        <h4 id="stream4cloud-support-contacts">Direct support</h4>
        <ul>
          {SUPPORT_CONTACTS.map(({ href, label, description }) => (
            <li key={href}>
              <a
                href={href}
                {...(isExternalHref(href) ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {label}
              </a>
              <p>{description}</p>
            </li>
          ))}
        </ul>
      </section>

      {children}
    </section>
  )
}
