# @guidogerb/header

Shared header state store, React context helpers, and a presentational `<Header />` component
used by tenant applications to coordinate brand, navigation, and localized metadata.

## Usage

```tsx
import {
  Header,
  HeaderContextProvider,
  createHeaderSettings,
  useHeaderContext,
} from '@guidogerb/header'

const tenantSettings = createHeaderSettings({
  brand: {
    title: 'PickleCheeze',
    tagline: 'Fermented delights delivered',
    href: '/',
  },
  primaryLinks: [
    { label: 'Menu', href: '/menu' },
    { label: 'Order', href: '/order' },
  ],
  actions: [
    { label: 'Order now', href: '/order', variant: 'primary' },
  ],
})

export function AppShell({ children }) {
  return (
    <HeaderContextProvider defaultSettings={tenantSettings}>
      <Header activePath={typeof window === 'undefined' ? '/' : window.location.pathname} />
      {children}
    </HeaderContextProvider>
  )
}

function BrandTitle() {
  const { settings } = useHeaderContext()
  return <span>{settings.brand.title}</span>
}
```

Pass custom renderers (for auth controls, theme toggles, tenant switchers, or call-to-action
buttons) through the `<Header />` props to inject tenant-specific UI while keeping the shared
layout consistent.

### Helpers

- `createHeaderSettings(overrides, base)` – merge overrides with defaults to
  produce a normalized settings object.
- `setHeaderSettings(partial)` / `updateHeaderSettings(updater)` – update the
  global store (used by the provider effect).
- `getHeaderSettings()` / `getDefaultHeaderSettings()` – read the active or
  default configuration.
- `resetHeaderSettings()` – restore defaults (helpful in tests).
