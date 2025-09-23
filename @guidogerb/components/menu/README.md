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
    <NavigationMenu items={items} label="Main navigation" activePath={window.location.pathname} />
  )
}
```

### Props

| Prop          | Type                                 | Default                 | Description                                             |
| ------------- | ------------------------------------ | ----------------------- | ------------------------------------------------------- |
| `items`       | `HeaderNavItem[]`                    | `[]`                    | Menu configuration. Child items render as nested lists. |
| `orientation` | `'horizontal' \| 'vertical'`         | `'horizontal'`          | Applies semantic data attributes and modifier classes.  |
| `label`       | `string`                             | `'Primary navigation'`  | Accessible label for the `<nav>` landmark.              |
| `activePath`  | `string`                             | —                       | Marks the matching link with `aria-current="page"`.     |
| `onNavigate`  | `({ item, event }) => void`          | —                       | Fired when a link is activated.                         |
| `renderLink`  | `({ item, linkProps }) => ReactNode` | Default anchor renderer | Custom renderer for links/buttons.                      |
| `listProps`   | `Record<string, unknown>`            | —                       | Additional props forwarded to the top-level `<ul>`.     |

The component emits structural class names (e.g., `gg-navigation-menu__item`)
so consuming apps can style the menu without overriding behavior.

### Keyboard interactions

`NavigationMenu` manages a roving `tabindex` so arrow keys can cycle focus without
leaving the navigation landmark. Built-in behaviour includes:

- **Horizontal menus** — `ArrowRight`/`ArrowLeft` move between top-level items,
  while `ArrowDown` enters a child list when one exists.
- **Vertical menus** — `ArrowDown`/`ArrowUp` move within the current list and
  `ArrowRight` dives into nested menus.
- **Nested menus** — `ArrowLeft` or `Escape` return focus to the parent trigger
  without escaping the navigation region.
- **Home/End** — Jump to the first or last item within the active list.

Custom renderers should spread the provided `linkProps` onto the interactive
element so these keyboard affordances remain intact.

## Theming with CSS custom properties

Pair the menu with `@guidogerb/css/tokens.css` to gain access to custom
properties that describe interactive states. Every menu instance exposes the
following tokens:

- `--gg-navigation-menu-link-hover-background`
- `--gg-navigation-menu-link-hover-color`
- `--gg-navigation-menu-link-focus-background`
- `--gg-navigation-menu-link-focus-color`
- `--gg-navigation-menu-link-focus-ring`
- `--gg-navigation-menu-link-active-background`
- `--gg-navigation-menu-link-active-color`
- `--gg-navigation-menu-link-active-ring`

Use the tokens from your stylesheet to align hover/focus/current states across
tenants:

```css
.gg-navigation-menu__link {
  display: flex;
  gap: var(--gg-navigation-menu-link-gap);
  padding-block: var(--gg-navigation-menu-link-padding-block);
  padding-inline: var(--gg-navigation-menu-link-padding-inline);
  border-radius: var(--gg-navigation-menu-item-radius);
  color: var(--gg-navigation-menu-link-color);
  background: var(--gg-navigation-menu-link-background);
  transition: background 150ms ease;
}

.gg-navigation-menu__link:hover {
  color: var(--gg-navigation-menu-link-hover-color);
  background: var(--gg-navigation-menu-link-hover-background);
}

.gg-navigation-menu__link:focus-visible {
  color: var(--gg-navigation-menu-link-focus-color);
  background: var(--gg-navigation-menu-link-focus-background);
  box-shadow: var(--gg-navigation-menu-link-focus-ring);
}

.gg-navigation-menu__item--active .gg-navigation-menu__link {
  color: var(--gg-navigation-menu-link-active-color);
  background: var(--gg-navigation-menu-link-active-background);
  box-shadow: var(--gg-navigation-menu-link-active-ring);
}
```

Override the custom properties on `.gg-navigation-menu` (or a parent element)
to brand the navigation component per tenant.
