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
- `createCachePreferenceChannel` / `DEFAULT_CACHE_PREFERENCES` — observable cache governance helpers that persist toggles,
  broadcast updates via `BroadcastChannel`, and keep service worker subscribers in sync.

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
| Cache governance   | ✅ Cache preference channel that persists toggles and multicasts them to service worker helpers via `BroadcastChannel`. |
| Diagnostics        | ⏳ Optional logging hooks so apps can trace cache/storage mutations during development.                                                                       |

## Integration with `@guidogerb/components/sw`

The storage package now exposes `createCachePreferenceChannel`, a lightweight store that persists cache policy updates under a
single key and multicasts them through `BroadcastChannel`. Consumers can call `updatePreferences` with partial objects (for
example `{ assets: { enabled: false } }`) and every subscriber—including `@guidogerb/components-sw`—receives a structured event
with the merged preferences. The service worker helpers use the same channel name so toggles propagate immediately without a
redeploy.

```js
import {
  createCachePreferenceChannel,
  DEFAULT_CACHE_PREFERENCES,
} from '@guidogerb/components-storage/cache-preferences'

const cacheChannel = createCachePreferenceChannel({
  storageController,
  defaultPreferences: DEFAULT_CACHE_PREFERENCES,
})

cacheChannel.updatePreferences({
  assets: { enabled: false },
  api: { maxAgeSeconds: 120 },
})

cacheChannel.subscribe(({ origin, preferences }) => {
  console.info('Cache preferences changed by', origin, preferences)
})
```

## Testing roadmap

- Unit tests covering serialization fallbacks, cookie parsing, and feature detection for `localStorage`/`sessionStorage`.
- Contract tests that exercise the cache preference channel in tandem with mock service worker subscribers.
- Documentation-driven examples demonstrating SSR-safe usage and integration within consumer applications.
