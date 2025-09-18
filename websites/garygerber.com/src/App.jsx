import { useCallback, useEffect, useState } from 'react'
import Protected from '@guidogerb/components-pages-protected'
import { Header, HeaderContextProvider } from '@guidogerb/header'
import './App.css'
import headerSettings from './headerSettings.js'
import Welcome from './website-components/welcome-page/index.jsx'

const SECTION_MAP = {
  '/': 'top',
  '/programs': 'programs',
  '/consulting': 'consulting',
  '/about': 'about',
  '/recordings': 'recordings',
  '/education': 'education',
  '/press': 'press',
  '/newsletter': 'newsletter',
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
        const sectionId = SECTION_MAP[targetPath] || (url.hash ? url.hash.replace('#', '') : undefined)

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
          <section className="hero" id="programs">
            <p className="eyebrow">Seasonal programs crafted for story-driven concerts</p>
            <h1>Gary Gerber shapes performances that stay with audiences long after the final encore.</h1>
            <p className="lede">
              From symphony halls to intimate salons, Gary partners with presenters to build immersive concerts,
              residencies, and education series that highlight local composers and community voices.
            </p>
            <dl className="hero-highlights" aria-label="Program highlights">
              <div>
                <dt>30+</dt>
                <dd>orchestral and chamber premieres across North America</dd>
              </div>
              <div>
                <dt>12</dt>
                <dd>artist-in-residence collaborations with universities and conservatories</dd>
              </div>
              <div>
                <dt>100k+</dt>
                <dd>listeners reached through live broadcasts and streaming performances</dd>
              </div>
            </dl>
          </section>

          <section className="content-grid" id="consulting">
            <article>
              <h2>Residencies &amp; masterclasses</h2>
              <p>
                Partner with Gary to curate multi-day engagements that pair public performances with student workshops,
                collaborative rehearsals, and composer roundtables tailored to your campus or festival.
              </p>
            </article>
            <article>
              <h2>Program development</h2>
              <p>
                Need a fresh recital concept or community outreach program? Gary works alongside artistic directors to
                develop thematic concerts, interactive talks, and outreach experiences that resonate with your audience.
              </p>
            </article>
          </section>

          <section className="content-grid" id="recordings">
            <article>
              <h2>Latest recordings</h2>
              <ul className="feature-list">
                <li>
                  <h3>"Northern Lights"</h3>
                  <p>Atmospheric piano works inspired by Nordic folklore, featuring collaborations with string quartet Pulse.</p>
                </li>
                <li>
                  <h3>"Stories in Transit"</h3>
                  <p>A live album captured during the 2024 Rail Lines residency, blending improvisation with commuter soundscapes.</p>
                </li>
                <li>
                  <h3>"Field Notes"</h3>
                  <p>Commissioned pieces for wind ensemble documenting national park sound walks with student composers.</p>
                </li>
              </ul>
            </article>
            <article id="education">
              <h2>Studio resources</h2>
              <p>
                Access curriculum guides, repertoire suggestions, and rehearsal exercises crafted from decades of teaching
                in conservatories and community programs.
              </p>
              <ul className="feature-list">
                <li>Weekly warm-up sequences for mixed-ability ensembles</li>
                <li>Improvisation prompts for student composers</li>
                <li>Lesson plans that connect repertoire to local history</li>
              </ul>
            </article>
          </section>

          <section className="content-grid" id="about">
            <article>
              <h2>About Gary</h2>
              <p>
                Gary Gerber is an award-winning composer and pianist whose work bridges classical traditions with
                contemporary storytelling. He has collaborated with the Minnesota Orchestra, Banff Centre for Arts and
                Creativity, and community ensembles around the globe.
              </p>
            </article>
            <article id="press">
              <h2>Press highlights</h2>
              <p className="quote">“Gerber’s performances invite the audience into the score—equal parts virtuosity and welcome.”</p>
              <p className="quote-attribution">— The Chronicle of Chamber Music</p>
            </article>
          </section>

          <section className="newsletter" id="newsletter">
            <div>
              <h2>Join the studio letter</h2>
              <p>
                Get quarterly notes on upcoming programs, new recordings, and behind-the-scenes stories from Gary’s
                collaborations with composers, dancers, and filmmakers.
              </p>
            </div>
            <form
              className="newsletter-form"
              aria-label="Newsletter sign up"
              onSubmit={(event) => event.preventDefault()}
            >
              <label htmlFor="newsletter-email" className="visually-hidden">
                Email address
              </label>
              <input id="newsletter-email" type="email" name="email" placeholder="you@example.com" autoComplete="email" />
              <button type="submit">Notify me</button>
            </form>
          </section>

          <section className="protected" id="client-access">
            <h2>Client rehearsal room</h2>
            <p className="protected-copy">
              Presenters and collaborators can review rehearsal notes, download scores, and coordinate logistics once
              signed in.
            </p>
            <Protected logoutUri={import.meta.env.VITE_LOGOUT_URI}>
              <Welcome />
            </Protected>
          </section>
        </main>

        <footer className="site-footer" id="contact">
          <div>
            <h2>Bookings &amp; inquiries</h2>
            <p>
              Email <a href="mailto:hello@garygerber.com">hello@garygerber.com</a> or call{' '}
              <a href="tel:+16125550123">+1 (612) 555-0123</a> for availability and partnership details.
            </p>
          </div>
          <div className="footer-meta">
            <p>© {new Date().getFullYear()} Gary Gerber. All rights reserved.</p>
            <p>
              Based in Minneapolis, performing worldwide. Follow along on{' '}
              <a href="https://instagram.com" target="_blank" rel="noreferrer noopener">
                Instagram
              </a>{' '}
              and{' '}
              <a href="https://youtube.com" target="_blank" rel="noreferrer noopener">
                YouTube
              </a>
              .
            </p>
          </div>
        </footer>
      </div>
    </HeaderContextProvider>
  )
}

export default App
