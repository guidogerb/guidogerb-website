# @guidogerb/components/storage

## Overview

`@guidogerb/components/storage` centralizes every browser-side persistence primitive the platform relies on. The package
provides a consistent API over `localStorage`, `sessionStorage`, and resilient in-memory fallbacks for server-side rendering.
It also owns the configuration switches that let applications enable, disable, or fine-tune the caching policies applied by
`@guidogerb/components/sw`.

## Exports

- `Storage` / `StorageProvider` — React context provider that provisions scoped storage controllers for the requested areas
  (local, session, or memory), exposes helpers such as `hasValue`/`setValue`, and notifies listeners when values change.
- `useStorage` — hook for reading the underlying controllers, listing configured areas, and issuing imperative reads/writes.
- `useStoredValue` — stateful helper that keeps component state in sync with a key in the selected storage area and exposes
  setters/removers similar to `useState`.
- `createStorageController` — factory for constructing standalone controllers when direct access is needed outside React,
  now including a lightweight `has(key)` helper for existence checks without triggering deserialization.
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

The storage context also exposes imperative helpers when you need to check whether a key has been persisted without
consuming the fallback value:

```jsx
import { StorageProvider, useStorage } from '@guidogerb/components-storage'

function AuthGate() {
  const storage = useStorage()
  return storage.hasValue('auth.token') ? <Dashboard /> : <SignIn />
}

export function App() {
  return (
    <StorageProvider namespace="guidogerb.app">
      <AuthGate />
    </StorageProvider>
  )
}
```

When a component needs to react to changes in persistence state without manually wiring event listeners, the
`useHasStoredValue` hook offers a declarative wrapper around those checks:

```jsx
import { StorageProvider, useHasStoredValue, useStoredValue } from '@guidogerb/components-storage'

function FeatureFlagToggle() {
  const hasFlag = useHasStoredValue('flags.beta', { area: 'session' })
  const [, setFlag, clearFlag] = useStoredValue('flags.beta', { area: 'session' })

  return (
    <div>
      <p>Beta flag stored? {hasFlag ? 'yes' : 'no'}</p>
      <button type="button" onClick={() => setFlag('enabled')}>
        Enable
      </button>
      <button type="button" onClick={() => clearFlag()}>
        Disable
      </button>
    </div>
  )
}

export function App() {
  return (
    <StorageProvider namespace="guidogerb.app">
      <FeatureFlagToggle />
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
- Surface optional diagnostics hooks so applications can trace storage mutations during development.

## Planned surface

| Area               | Goals |
| ------------------ | ----- |
| Storage controller | ✅ Available via `createStorageController`. Returns scoped accessors (`get`, `set`, `remove`, `list`, `has`) and gracefully falls back when `window` is unavailable. |
| Cookie utilities   | ✅ Cookie parsing and mutation helpers covering domain/path/same-site attributes. |
| Cache governance   | ✅ Cache preference channel that persists toggles and multicasts them to service worker helpers via `BroadcastChannel`. |
| Diagnostics        | ✅ Diagnostics hooks so apps can trace storage mutations during development. |
## Integration with `@guidogerb/components/sw`

The storage package now exposes `createCachePreferenceChannel`, a lightweight store that persists cache policy updates under a
single key and multicasts them through `BroadcastChannel`. Consumers can call `updatePreferences` with partial objects (for
example `{ assets: { enabled: false } }`) and every subscriber—including `@guidogerb/components-sw`—receives a structured event
with the merged preferences. The service worker helpers use the same channel name so toggles propagate immediately without a
redeploy.

Channels can also service sync requests from peers that cannot access the persisted storage (e.g., the service worker). Call
`requestSync()` from a read-only channel—`createCachePreferenceSubscriber` does this automatically—and the provider will
re-broadcast the latest merged preferences so every runtime converges on the same configuration.

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

## Cookie helpers

```js
import {
  setCookie,
  getCookie,
  removeCookie,
  serializeCookie,
} from '@guidogerb/components-storage'

// Persist a cookie with explicit attributes
setCookie('theme', 'dark', { path: '/', sameSite: 'Lax', secure: true })

// Read the merged cookie jar (uses document.cookie by default)
const activeTheme = getCookie('theme') ?? 'light'

// Generate a raw Set-Cookie string for server-side rendering scenarios
const serialized = serializeCookie('session', 'abc123', {
  path: '/',
  sameSite: 'Strict',
  secure: true,
})

// Remove the cookie by setting an expired value
removeCookie('theme', { path: '/' })
```

The helpers handle URL encoding, domain/path overrides, `SameSite` normalisation, and secure attributes so consumer code can
operate on cookies without manipulating `document.cookie` manually.

## Diagnostics

`createStorageController` accepts an optional `diagnostics` callback (or object map) that receives structured events whenever the
controller mutates storage or notifies subscribers. This is useful for instrumentation and debugging during development.

```js
import { createStorageController } from '@guidogerb/components-storage'

const events = []

const controller = createStorageController({
  namespace: 'demo',
  diagnostics: (event) => events.push(event),
})

controller.set('feature', 'enabled')
controller.remove('feature')

// events now include objects such as:
// { type: 'set', key: 'feature', value: 'enabled', previousValue: undefined, timestamp: 1730000000000 }
```

Instead of a single function you can provide an object with `onSet`, `onRemove`, `onClear`, `onNotify`, or `onFallback` handlers
to subscribe to specific event types.

## Testing roadmap

- Unit tests covering serialization fallbacks, cookie parsing, and feature detection for `localStorage`/`sessionStorage`.
- Contract tests that exercise the cache preference channel in tandem with mock service worker subscribers.
- Documentation-driven examples demonstrating SSR-safe usage and integration within consumer applications.
