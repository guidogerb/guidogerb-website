import { MarketingShell } from '../MarketingShell.jsx'

const meta = {
  title: 'Components/Pages/Public/MarketingShell',
  component: MarketingShell,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

const sharedHeader = (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      background: 'linear-gradient(135deg, #111827, #1f2937)',
      color: 'white',
      fontSize: '1rem',
      fontWeight: 600,
    }}
  >
    <span>Guidogerb Studio</span>
    <nav aria-label="Utility navigation" style={{ display: 'flex', gap: '1.5rem' }}>
      <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>
        Features
      </a>
      <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>
        Pricing
      </a>
      <a href="#support" style={{ color: 'inherit', textDecoration: 'none' }}>
        Support
      </a>
    </nav>
  </div>
)

const sharedFooter = (
  <div
    style={{
      padding: '1.5rem',
      background: '#0f172a',
      color: 'white',
      textAlign: 'center',
      fontSize: '0.875rem',
    }}
  >
    © {new Date().getFullYear()} Guidogerb Media Network
  </div>
)

export const DefaultHero = {
  render: () => (
    <MarketingShell
      header={sharedHeader}
      footer={sharedFooter}
      eyebrow="Broadcast toolkit"
      title="Amplify your reach with Stream4Cloud"
      description="Launch simulcasts, backstage interviews, and watch parties from a single workspace."
      actions={[
        { label: 'Start free trial' },
        { label: 'Book a demo', variant: 'secondary' },
      ]}
    >
      <p>
        See how studios orchestrate multi-channel launches with shareable runbooks, guest portals,
        and on-demand analytics that surface the next best action for every broadcast.
      </p>
      <p>
        Integrates with your existing CDN, ticketing providers, and auth stack with zero-downtime
        migrations.
      </p>
    </MarketingShell>
  ),
}

export const MediaSpotlight = {
  render: () => (
    <MarketingShell
      header={sharedHeader}
      footer={sharedFooter}
      eyebrow="Hybrid showcases"
      title="Bring your festival to every screen"
      description="Pair cinematic capture with immersive watch parties using curated overlays and realtime chat."
      media={
        <div
          role="img"
          aria-label="Concert crowd celebrating a headline performance"
          style={{
            background: 'radial-gradient(circle at top, #f472b6, #7c3aed)',
            color: 'white',
            padding: '3rem',
            borderRadius: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          Live from the main stage
        </div>
      }
      aside={
        <div>
          <h2 style={{ marginTop: 0 }}>What’s included</h2>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6 }}>
            <li>Guided presets for stage, lobby, and greenroom spaces</li>
            <li>Realtime run-of-show synchronization</li>
            <li>Sponsor overlays with automated rotation schedules</li>
          </ul>
        </div>
      }
      actions={[
        { label: 'Explore packages' },
        {
          label: 'Download media kit',
          href: '/media-kit.pdf',
          variant: 'secondary',
          download: true,
        },
      ]}
      actionsLabel="Showcase actions"
    >
      <p>
        Orchestrate green room takeovers with modular layouts, lower thirds, and remote interviewer
        feeds while keeping latency budgets predictable.
      </p>
    </MarketingShell>
  ),
}

export const LongFormNarrative = {
  render: () => (
    <MarketingShell
      header={sharedHeader}
      footer={sharedFooter}
      eyebrow="Stories that travel"
      title="Your catalog, curated for every platform"
      description="Give superfans, educators, and syndication partners a narrative that feels handcrafted without sacrificing automation."
      actions={[
        { label: 'Read customer stories', variant: 'secondary' },
        { label: 'Talk with production', variant: 'ghost' },
        { label: 'Watch highlight reel', href: '#highlight-reel', variant: 'link' },
      ]}
      actionsLabel="Narrative calls to action"
      heroProps={{
        style: {
          background: 'linear-gradient(120deg, rgba(14,116,144,0.15), rgba(59,130,246,0.2))',
          paddingBottom: '2.5rem',
        },
      }}
    >
      <p>
        Bundle episodic releases, exclusive arrangements, and master classes into themed journeys
        that adapt based on a visitor’s interests and entitlements.
      </p>
      <p>
        Use fine-grained analytics to highlight where audiences rewatch segments, request
        transcripts, or share spotlight tracks.
      </p>
      <blockquote style={{ marginInlineStart: 0, borderLeft: '4px solid #0ea5e9', paddingLeft: '1rem' }}>
        “The marketing shell let us preview season arcs with key art, embedded audio, and regional
        dates in a single shareable link.”
      </blockquote>
    </MarketingShell>
  ),
}
