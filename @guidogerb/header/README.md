# @guidogerb/header

Shared header state store and React context helpers used by tenant applications to coordinate
brand, navigation, and localized metadata.

## Usage

```tsx
import {
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
  showAuthControls: false,
})

export function AppShell({ children }) {
  return (
    <HeaderContextProvider defaultSettings={tenantSettings}>
      {children}
    </HeaderContextProvider>
  )
}

function BrandTitle() {
  const { settings } = useHeaderContext()
  return <span>{settings.brand.title}</span>
}
```

### Helpers

- `createHeaderSettings(overrides, base)` – merge overrides with defaults to
  produce a normalized settings object.
- `setHeaderSettings(partial)` / `updateHeaderSettings(updater)` – update the
  global store (used by the provider effect).
- `getHeaderSettings()` / `getDefaultHeaderSettings()` – read the active or
  default configuration.
- `resetHeaderSettings()` – restore defaults (helpful in tests).
