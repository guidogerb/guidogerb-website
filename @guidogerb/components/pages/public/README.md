# @guidogerb/components/pages/public

Accessible layout primitives for public-facing pages. These components focus on
composing existing header/footer implementations and providing consistent hero
sections for marketing and error scenarios.

## Exports

- `PublicShell` – Wraps public content with optional header/footer slots and a
  centered main column.
- `MarketingShell` – Builds on `PublicShell` with an opinionated hero section,
  action bar, and optional media/aside regions.
- `ErrorShell` – Announces friendly error messages with optional call-to-action
  links.
- `renderAction(s)` – Helper utilities used by the shells to normalize CTA data
  into buttons/links.
- `StorytellingIllustration`, `ConnectionsIllustration`,
  `AnalyticsIllustration` – Accessible SVG artwork that follows Guidogerb
  branding and ships with sensible alt text defaults.

## Usage

```jsx
import { MarketingShell } from '@guidogerb/components-pages-public'
import { Header } from '@guidogerb/header'
import { Footer } from '@guidogerb/footer'
import { StorytellingIllustration } from '@guidogerb/components-pages-public'

function LandingPage() {
  return (
    <MarketingShell
      header={<Header />}
      footer={<Footer />}
      eyebrow="For presenters"
      title="Story-driven performances"
      description="Immersive residencies, recordings, and education programs tailored to your community."
      actions={[
        { label: 'Schedule a call', href: '/contact' },
        { label: 'Download programs', href: '/press-kit.pdf', download: true },
      ]}
      media={<StorytellingIllustration />}
      aside={<p>Residency dates available for spring and summer engagements.</p>}
    >
      <section>
        <h2>Residencies</h2>
        <p>Design interactive workshops and performances for universities or festivals.</p>
      </section>
    </MarketingShell>
  )
}
```

### Illustrations

The packaged illustrations are lightweight React components that render inline
SVG. They expose `title`, `description`, and `palette` props so tenants can
control the accessible name and align colours with custom themes:

```jsx
import { ConnectionsIllustration, AnalyticsIllustration } from '@guidogerb/components-pages-public'

function Preview() {
  return (
    <div className="marketing-preview">
      <ConnectionsIllustration
        title="Editorial collaboration"
        palette={{ nodePrimary: '#9333ea', hub: '#f59e0b' }}
      />
      <AnalyticsIllustration description="Weekly performance metrics" />
    </div>
  )
}
```

Each component defaults to descriptive copy that functions as alt text, and the
`palette` prop can override any of the documented colour tokens.
