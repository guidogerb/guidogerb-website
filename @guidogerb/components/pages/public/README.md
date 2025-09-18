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

## Usage

```jsx
import { MarketingShell } from '@guidogerb/components-pages-public'
import { Header } from '@guidogerb/header'
import { Footer } from '@guidogerb/footer'

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
      media={<img alt="Gary at the piano" src="/piano.jpg" />}
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
