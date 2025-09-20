# @guidogerb/components/storage

## Overview

`@guidogerb/components/storage` centralizes every browser-side persistence primitive the platform relies on. The package
provides a consistent API over `localStorage`, `sessionStorage`, and resilient in-memory fallbacks for server-side rendering.
It also owns the configuration switches that let applications enable, disable, or fine-tune the caching policies applied by
`@guidogerb/components/sw`.

## Exports

- `Storage` / `StorageProvider` — React context provider that provisions scoped storage controllers for the requested areas
  (local, session, or memory) and notifies listeners when values change.
- `useStorage` — hook for reading the underlying controllers, listing configured areas, and issuing imperative reads/writes.
- `useStoredValue` — stateful helper that keeps component state in sync with a key in the selected storage area and exposes
  setters/removers similar to `useState`.
- `createStorageController` — factory for constructing standalone controllers when direct access is needed outside React.

## Usage

```jsx
import { StorageProvider, useStoredValue } from '@guidogerb/components-storage'

function ThemeToggle() {
  const [theme, setTheme] = useStoredValue('theme', { defaultValue: 'light' })

  return (
    <button type="button" onClick={() => setTheme((mode) => (mode === 'light' ? 'dark' : 'light'))}>
      Current theme: {theme}
    </button>
  )
}

export function App() {
  return (
    <StorageProvider namespace="guidogerb.app" areas={['local', 'session']}>
      <ThemeToggle />
    </StorageProvider>
  )
}
```

## Responsibilities

- Expose a storage controller that abstracts serialization, schema validation, and feature detection for Web Storage APIs.
- Provide helpers to read, write, and expire cookies with full attribute support (domain, path, secure, same-site).
- Offer opt-in caching preferences that the service worker can subscribe to in order to adjust offline and runtime cache
  strategies.
- Supply mocks and adapters that consumers can use in tests without coupling to browser globals.

## Planned surface

| Area               | Goals                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storage controller | ✅ Available via `createStorageController`. Returns scoped accessors (`get`, `set`, `remove`, `list`) and gracefully falls back when `window` is unavailable. |
| Cookie utilities   | ⏳ Lightweight encoder/decoder helpers plus batched update support for multi-cookie workflows.                                                                |
| Cache governance   | ⏳ Shared channel (e.g., BroadcastChannel, event emitter, or observable store) that exposes caching preferences for the service worker to consume.            |
| Diagnostics        | ⏳ Optional logging hooks so apps can trace cache/storage mutations during development.                                                                       |

## Integration with `@guidogerb/components/sw`

The storage controller will publish cache policy updates (such as disabled asset caching, API cache TTL overrides, or prefetch
manifests) through the shared channel above. The service worker helpers will subscribe to those updates to adjust their caching
behaviour without requiring a redeploy. This keeps runtime toggles (for privacy modes, tenant-specific caching, etc.) in one
place while ensuring the worker always follows the latest settings.

## Testing roadmap

- Unit tests covering serialization fallbacks, cookie parsing, and feature detection for `localStorage`/`sessionStorage`.
- Contract tests that exercise the cache preference channel in tandem with mock service worker subscribers.
- Documentation-driven examples demonstrating SSR-safe usage and integration within consumer applications.
