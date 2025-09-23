import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PublicRouter } from '@guidogerb/components-router-public'
import { ErrorShell } from '@guidogerb/components-pages-public'
import { useAuth } from '@guidogerb/components-auth'
import Welcome from './website-components/welcome-page/index.jsx'
import './App.css'
import storyCircle from './assets/story-circle.svg'

const COMMUNITY_HIGHLIGHTS = [
  {
    title: 'Story circles',
    description:
      'Weekly gatherings that pair facilitators with accessible prompts so every voice has room to unfold.',
    bullets: [
      'Neighborhood-hosted spaces with ASL interpretation and language access partners.',
      'Childcare stipends, transit passes, and meals for every participant.',
      'Audio engineers capturing archival-quality recordings that storytellers control.',
    ],
  },
  {
    title: 'Mobile oral history studio',
    description:
      'A traveling recording setup that visits libraries, shelters, and community centers across the region.',
    bullets: [
      'On-site coaching and release-form support for first-time storytellers.',
      'Instant transcripts with large-print review copies for accessibility.',
      'Secure cloud libraries with playlists that can be shared with families and partners.',
    ],
  },
  {
    title: 'Story coaching for organizers',
    description:
      'Workshops that equip mutual aid teams with narrative strategy and trauma-informed facilitation skills.',
    bullets: [
      'Collective care practices that center healing and informed consent.',
      'Media kits, press outreach templates, and social copy to amplify calls to action.',
      'Micro-grants that fund community showcases and pop-up listening sessions.',
    ],
  },
]

function StorytellerStudioSection({ auth }) {
  const teaser = (
    <div className="studio-teaser" aria-labelledby="studio-teaser-heading">
      <h3 id="studio-teaser-heading">Join the storyteller studio</h3>
      <p>
        Sign in to reserve recording time, collaborate with producers, and publish new stories into the
        community archive.
      </p>
      <ul>
        <li>Downloadable interview roadmaps and caption templates for every story format.</li>
        <li>Quarterly critique circles with guest editors, ASL interpreters, and accessibility coaches.</li>
        <li>Mutual aid micro-grants that cover childcare, transit, and assistive technology needs.</li>
      </ul>
      <a className="studio-signin" href="/auth/sign-in">
        Sign in to share your story
      </a>
    </div>
  )

  if (auth?.error) {
    return (
      <div className="studio-error" role="alert">
        <h3>We could not load your storyteller studio</h3>
        <p>Sign-in failed: {auth.error.message}</p>
        <p>Please refresh the page or try again in a few minutes.</p>
      </div>
    )
  }

  if (auth?.isAuthenticated) {
    const profile = auth?.user?.profile ?? {}
    const email =
      profile.email ??
      profile.contact ??
      profile['custom:contactEmail'] ??
      profile['cognito:username'] ??
      null

    return (
      <Welcome>
        <p className="studio-account">
          {email ? `Signed in as ${email}.` : 'Signed in through your storyteller account.'}
        </p>

        <div className="studio-portal-grid">
          <div className="studio-resources">
            <h3>Production toolkit</h3>
            <p>Everything you need to take a draft story from outline to broadcast-ready audio.</p>
            <ul>
              <li>
                <a href="https://stories.this-is-my-story.org/resources/release-form.pdf">
                  Download story release form
                </a>
              </li>
              <li>
                <a href="https://stories.this-is-my-story.org/schedule">
                  Schedule studio time with a producer
                </a>
              </li>
              <li>
                <a href="https://stories.this-is-my-story.org/pitch">Pitch your next episode idea</a>
              </li>
            </ul>
          </div>

          <div className="studio-updates">
            <h3>Upcoming workshops</h3>
            <p>Members receive priority registration and travel support for every cohort.</p>
            <ul>
              <li>Story circle facilitation lab — February 12, hybrid with captioned livestream.</li>
              <li>Mutual aid storytelling clinic — March 8, featuring neighborhood organizers.</li>
              <li>Digital archiving sprint — April 3, collaboration with the public library.</li>
            </ul>
          </div>
        </div>
      </Welcome>
    )
  }

  return teaser
}

function LandingRoute() {
  const auth = useAuth()

  return (
    <div className="story-app">
      <header className="hero" id="top">
        <p className="hero-eyebrow">Community Storytelling Cooperative</p>
        <h1>Amplify the voices shaping our neighborhoods</h1>
        <p className="hero-lede">
          We partner with grassroots organizers, mutual aid teams, and youth media labs to document lived
          experiences. Every story is captured with consent, archived responsibly, and delivered back to the
          communities that created it.
        </p>
        <div className="hero-cta">
          <a className="hero-cta-primary" href="#programs">
            Explore our programs
          </a>
          <a className="hero-cta-secondary" href="#studio">
            Join the storyteller studio
          </a>
        </div>
      </header>

      <main className="app-main">
        <section className="programs" id="programs">
          <h2>Community storytelling programs</h2>
          <div className="programs-grid" role="list">
            {COMMUNITY_HIGHLIGHTS.map((highlight) => (
              <article key={highlight.title} className="program-card" role="listitem">
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
                <ul>
                  {highlight.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="highlight" aria-labelledby="highlight-heading">
          <div className="highlight-text">
            <h2 id="highlight-heading">Stories that travel further</h2>
            <p>
              Our digital studio pairs storytellers with editors, illustrators, and audio producers. Together we
              craft immersive pieces that honor the storyteller and equip partners to take action.
            </p>
            <p>
              Every project receives an accessibility review and descriptive metadata so archives stay searchable
              for generations. We share the final stories through community radio, pop-up galleries, and partner
              newsletters.
            </p>
          </div>
          <figure className="highlight-figure">
            <img src={storyCircle} alt="Collage of storytellers sharing their experiences" loading="lazy" />
          </figure>
        </section>

        <section className="studio" id="studio">
          <div className="studio-header">
            <h2>Storyteller studio</h2>
            <p>
              Members collaborate with producers to turn lived experiences into episodes, zines, and interactive
              archives. Studio membership is free for community organizers, caregivers, and youth reporters.
            </p>
          </div>
          <StorytellerStudioSection auth={auth} />
        </section>
      </main>
    </div>
  )
}

function useNavigateHome() {
  const navigate = useNavigate()
  return useCallback(
    (event) => {
      if (event?.preventDefault) {
        event.preventDefault()
      }
      navigate('/')
    },
    [navigate],
  )
}

function NotFoundRoute() {
  const navigateHome = useNavigateHome()

  return (
    <ErrorShell
      className="story-error-shell"
      statusCode={404}
      statusLabel="HTTP status code"
      title="Story not found in the archive"
      description="We couldn’t locate that page in the storytelling library."
      actionsLabel="Try these options"
      actions={[
        { label: 'Return to storyteller hub', href: '/', variant: 'primary', onClick: navigateHome },
        {
          label: 'Email the community team',
          href: 'mailto:care@this-is-my-story.org?subject=Storyteller%20portal%20support',
        },
      ]}
    >
      <p>
        Double-check the link or head back to the storyteller hub to explore featured programs, studio
        resources, and ways to collaborate with our mutual aid partners.
      </p>
    </ErrorShell>
  )
}

function MaintenanceRoute() {
  const navigateHome = useNavigateHome()

  return (
    <ErrorShell
      className="story-error-shell"
      statusCode={503}
      statusLabel="Service status"
      title="Storyteller studio is preparing updates"
      description="We’re refreshing portal resources and will reopen the studio shortly."
      actionsLabel="While you wait"
      actions={[
        { label: 'Return to storyteller hub', href: '/', variant: 'primary', onClick: navigateHome },
        {
          label: 'Request a community update',
          href: 'mailto:care@this-is-my-story.org?subject=Community%20storytelling%20updates',
        },
      ]}
    >
      <p>
        Reach out if you need accessibility resources or recording support while we finish this release. Our team
        will send fresh timelines and workshop invitations as soon as the studio doors open again.
      </p>
    </ErrorShell>
  )
}

const routes = [
  { path: '/', element: <LandingRoute /> },
  { path: '/maintenance', element: <MaintenanceRoute /> },
]

function App({ router, routerOptions }) {
  return (
    <PublicRouter
      routes={routes}
      fallback={<NotFoundRoute />}
      router={router}
      routerOptions={routerOptions}
    />
  )
}

export default App
