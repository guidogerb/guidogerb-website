import { useEffect, useRef } from 'react'
import { useAnalytics } from '@guidogerb/components-analytics'
import { useAuth } from '@guidogerb/components-auth'

const STORY_PROMPTS = [
  {
    title: "Begin with today's sensory detail",
    description:
      'Describe the sound, scent, or scene that framed your day so collaborators feel present with you.',
  },
  {
    title: 'Celebrate a supporting voice',
    description:
      'Share a quote from someone who encouraged you this week and how it shaped your next steps.',
  },
  {
    title: 'Mark a turning point',
    description:
      'Capture the moment something shifted—what you felt before, during, and after the change.',
  },
]

const RESOURCE_GUIDES = [
  {
    href: 'https://support.this-is-my-story.org/guides/audio-diary',
    label: 'Audio diary setup checklist',
    description:
      'Set levels, reduce background noise, and choose the right format for archival-quality recordings.',
  },
  {
    href: 'https://support.this-is-my-story.org/templates/story-map',
    label: 'Story map template',
    description: 'Plot chapters, characters, and artifacts to keep long-form narratives organized.',
  },
  {
    href: 'https://support.this-is-my-story.org/workshops/memory-capture',
    label: 'Memory capture workshop replay',
    description:
      'Replay the latest coaching session on blending photos, letters, and voice notes into one chapter.',
  },
]

const CARE_TEAM_CONNECTIONS = [
  {
    href: 'mailto:stories@this-is-my-story.org',
    label: 'Email the editorial desk',
    description: 'Request feedback on drafts or ask for help shaping sensitive passages.',
  },
  {
    href: 'https://calendly.com/this-is-my-story/story-coach',
    label: 'Book a coaching session',
    description:
      'Meet with a story coach to outline interviews, structure scenes, or plan recordings.',
  },
  {
    href: 'tel:+18005551234',
    label: 'Care team hotline',
    description: 'Call for day-of support when you are preparing to share a new chapter live.',
  },
]

const isExternalHref = (href) => /^https?:/i.test(href ?? '')

export default function Welcome({ children }) {
  const auth = useAuth()
  const analytics = useAnalytics()
  const lastLoggedPayloadRef = useRef(null)

  const profile = auth?.user?.profile ?? {}
  const storytellerName = profile?.['cognito:username'] ?? profile?.name ?? 'storyteller'
  const isAuthenticated = Boolean(auth?.isAuthenticated)

  useEffect(() => {
    if (typeof analytics?.trackEvent !== 'function') return

    const status = auth?.error ? 'error' : isAuthenticated ? 'authenticated' : 'loading'

    const eventPayload = {
      status,
      isAuthenticated,
      hasError: Boolean(auth?.error),
      storyteller: storytellerName,
    }

    if (auth?.error?.code) {
      eventPayload.errorCode = auth.error.code
    }

    if (auth?.error?.message) {
      eventPayload.errorMessage = auth.error.message
    }

    const serializedPayload = JSON.stringify(eventPayload)
    if (lastLoggedPayloadRef.current === serializedPayload) return
    lastLoggedPayloadRef.current = serializedPayload

    analytics.trackEvent('thisismystory.auth.context_change', eventPayload)
  }, [analytics, auth, isAuthenticated, storytellerName])

  if (auth?.error) return <div>Sign-in failed: {auth.error.message}</div>
  if (!isAuthenticated) return <div>Welcome Loading...</div>

  const name = storytellerName

  return (
    <section aria-labelledby="this-is-my-story-welcome-heading">
      <header>
        <h3 id="this-is-my-story-welcome-heading">Welcome {name}</h3>
        <p>
          The storyteller studio is ready whenever inspiration strikes. Capture fresh memories,
          document your voice, and share the milestones your community is waiting to celebrate.
        </p>
      </header>

      <section aria-labelledby="this-is-my-story-prompts-heading">
        <h4 id="this-is-my-story-prompts-heading">Jump-start today's chapter</h4>
        <ul>
          {STORY_PROMPTS.map(({ title, description }) => (
            <li key={title}>
              <p>
                <strong>{title}.</strong> {description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="this-is-my-story-resources-heading">
        <h4 id="this-is-my-story-resources-heading">Storyteller resources</h4>
        <ul>
          {RESOURCE_GUIDES.map(({ href, label, description }) => (
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

      <section aria-labelledby="this-is-my-story-care-team-heading">
        <h4 id="this-is-my-story-care-team-heading">Stay connected with your care team</h4>
        <ul>
          {CARE_TEAM_CONNECTIONS.map(({ href, label, description }) => (
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
