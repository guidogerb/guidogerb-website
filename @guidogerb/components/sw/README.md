# @guidogerb/components-sw

Lightweight helpers for registering and unregistering the shared service worker bundle.
The package exists as a stop-gap until the full offline strategy described in the platform
SPEC ships.

## Usage

```ts
import { registerSW, unregisterSW } from '@guidogerb/components-sw'

const sw = registerSW({
  url: '/sw.js',
  onOfflineReady: () => console.log('Service worker installed for offline use.'),
  onUpdateReady: ({ registration, waiting }) => {
    // Trigger a toast/snackbar to inform the user new assets are ready.
    console.log('Update available for', registration.scope)
    waiting?.postMessage({ type: 'SKIP_WAITING' })
  },
})

await sw.ready

// Resolve when a refreshed worker finishes installing.
await sw.updateReady

// Later, e.g., when logging out or toggling offline mode
await unregisterSW()
```

- `registerSW(options)` waits for the `window` `load` event before attempting to register
  the worker and safely no-ops on platforms without service worker support. Pass
  `immediate: true` to bypass the `load` gate in testing environments.
  - `ready` resolves with the `ServiceWorkerRegistration` once registration succeeds
    (or `null` when registration fails).
  - `updateReady` resolves the first time a new worker installs while another
    controller is active so UI layers can prompt users to refresh.
  - `checkForUpdates()` calls `registration.update()` when available and returns
    `true` once the update request completes.
  - Lifecycle callbacks (`onRegistered`, `onUpdateFound`, `onOfflineReady`,
    `onUpdateReady`, `onControllerChange`, `onRegisterError`) surface registration
    milestones.
- `unregisterSW()` removes every active registration for the current origin.
- `createCachePreferenceSubscriber(options)` returns a read-only channel that listens to
  cache preference broadcasts from `@guidogerb/components-storage`. Subscribers receive
  merged preference objects and can optionally request an initial snapshot.

## Cache preferences

```ts
import {
  createCachePreferenceSubscriber,
  DEFAULT_CACHE_PREFERENCES,
} from '@guidogerb/components-sw'

const cachePreferences = createCachePreferenceSubscriber()

const unsubscribe = cachePreferences.subscribe(({ origin, preferences }) => {
  console.log('Cache settings updated by', origin, preferences)
})

// Access the latest merged view without waiting for an event
const snapshot = cachePreferences.getPreferences() ?? DEFAULT_CACHE_PREFERENCES

// Request an explicit resync (the subscriber automatically asks once on init)
cachePreferences.requestSync()

// Later, when the listener is no longer needed
unsubscribe()
cachePreferences.destroy()
```
