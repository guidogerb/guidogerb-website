# @guidogerb/components-sw

Lightweight helpers for registering and unregistering the shared service worker bundle.
The package exists as a stop-gap until the full offline strategy described in the platform
SPEC ships.

## Usage

```ts
import { registerSW, unregisterSW } from '@guidogerb/components-sw'

registerSW({ url: '/sw.js' })

// Later, e.g., when logging out or toggling offline mode
await unregisterSW()
```

- `registerSW({ url })` waits for the `window` `load` event before attempting to register
  the worker and safely no-ops on platforms without service worker support.
- `unregisterSW()` removes every active registration for the current origin.

Future revisions will subscribe to cache preferences published by
`@guidogerb/components-storage` so tenants can toggle offline buckets at runtime.
