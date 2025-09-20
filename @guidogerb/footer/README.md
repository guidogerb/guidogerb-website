# @guidogerb/footer

A shared footer component for Guido & Gerber websites. It renders brand context, grouped navigation links, social profiles, and
legal metadata with a consistent layout that matches the shared header package.

## Installation

```bash
pnpm add @guidogerb/footer
```

## Usage

```tsx
import { Footer } from '@guidogerb/footer'

const footerSections = [
  {
    id: 'programs',
    title: 'Programs',
    links: [
      { label: 'Concerts', href: '/concerts' },
      { label: 'Workshops', href: '/workshops', description: 'Residencies & masterclasses' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    links: [
      { label: 'Email', href: 'mailto:hello@guidogerb.com' },
      { label: 'Partner portal', href: 'https://partners.guidogerb.com', external: true },
    ],
  },
]

function SiteFooter() {
  return (
    <Footer
      brand={{ name: 'GuidoGerb Studios', href: '/' }}
      description="Story-driven performances and publishing partners."
      sections={footerSections}
      socialLinks={[
        { label: 'Instagram', href: 'https://instagram.com/guidogerb', external: true },
      ]}
      legalLinks={[
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ]}
      copyright="© 2025 Guido & Gerber, LLC"
    />
  )
}
```

## Props

| Prop          | Type                                                                                | Description                                                                                             |
| ------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `brand`       | `{ name?: string; href?: string; logo?: ReactNode }`                                | Optional brand name and link rendered at the top of the footer.                                         |
| `description` | `string`                                                                            | Supporting copy below the brand name.                                                                   |
| `sections`    | `Array<{ id?: string; title?: string; description?: string; links: FooterLink[] }>` | Grouped navigation links. Empty titles are ignored.                                                     |
| `socialLinks` | `FooterLink[]`                                                                      | Rendered as icon/text buttons beneath the brand.                                                        |
| `legalLinks`  | `FooterLink[]`                                                                      | Inline links rendered in the meta row (privacy, terms, etc.).                                           |
| `copyright`   | `string`                                                                            | Small-print copyright text displayed beneath the legal links.                                           |
| `onNavigate`  | `(payload: { link: FooterLink; event: MouseEvent }) => void`                        | Called when any footer link is clicked. When provided, default navigation is prevented.                 |
| `children`    | `ReactNode`                                                                         | Optional extra content rendered between the link grid and the legal row (e.g., newsletter signup form). |

`FooterLink` objects accept the following fields:

```ts
interface FooterLink {
  id?: string
  label: string
  href: string
  description?: string
  external?: boolean
  rel?: string
  target?: string
  icon?: React.ReactNode
  badge?: string
  badgeTone?: 'info' | 'success' | 'warning' | 'danger'
}
```

## Testing

Run the package tests with:

```bash
pnpm --filter @guidogerb/footer test
```

## Icon defaults

The footer automatically assigns accessible SVG icons for common social networks and legal callouts when an explicit `icon`
value is not provided. Detection is based on each link's `label` and `href`, covering platforms like Instagram, TikTok,
LinkedIn, YouTube, Substack, Spotify, Bandcamp, Facebook, and X, along with legal targets such as Privacy, Terms, Cookies,
Accessibility, and Copyright.

You can also import the curated icon set directly:

```ts
import {
  DEFAULT_SOCIAL_ICONS,
  DEFAULT_LEGAL_ICONS,
  SOCIAL_ICON_COMPONENTS,
  LEGAL_ICON_COMPONENTS,
  getDefaultSocialIcon,
  getDefaultLegalIcon,
} from '@guidogerb/footer'

const instagramIcon = DEFAULT_SOCIAL_ICONS.instagram
const privacyIconNode = getDefaultLegalIcon({ label: 'Privacy', href: '/privacy' })
```

Each exported icon component accepts standard SVG props if you need to customise size or colour.
