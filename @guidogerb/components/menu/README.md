# @guidogerb/components/menu

Accessible, data-driven navigation primitives shared across tenant frontends.

## `NavigationMenu`

A lightweight React component that renders hierarchical navigation lists. It
accepts the same item shape used by `@guidogerb/header` settings so apps can
pipe tenant configuration straight into the menu.

```tsx
import { NavigationMenu } from '@guidogerb/components-menu'

const items = [
  { label: 'Home', href: '/' },
  {
    label: 'Catalog',
    href: '/catalog',
    description: 'Browse music, books, and video',
    children: [
      { label: 'Music', href: '/catalog/music' },
      { label: 'Books', href: '/catalog/books' },
    ],
  },
  { label: 'Blog', href: 'https://blog.example.com', external: true },
]

export function PrimaryNav() {
  return (
    <NavigationMenu
      items={items}
      label="Main navigation"
      activePath={window.location.pathname}
    />
  )
}
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `HeaderNavItem[]` | `[]` | Menu configuration. Child items render as nested lists. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Applies semantic data attributes and modifier classes. |
| `label` | `string` | `'Primary navigation'` | Accessible label for the `<nav>` landmark. |
| `activePath` | `string` | — | Marks the matching link with `aria-current="page"`. |
| `onNavigate` | `({ item, event }) => void` | — | Fired when a link is activated. |
| `renderLink` | `({ item, linkProps }) => ReactNode` | Default anchor renderer | Custom renderer for links/buttons. |
| `listProps` | `Record<string, unknown>` | — | Additional props forwarded to the top-level `<ul>`. |

The component emits structural class names (e.g., `gg-navigation-menu__item`)
so consuming apps can style the menu without overriding behavior.
