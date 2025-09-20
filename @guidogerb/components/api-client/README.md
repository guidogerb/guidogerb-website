# @guidogerb/components/api-client

Typed HTTP client for the Phase‑1 API (API Gateway HTTP API).

## Features

- Fetch wrapper + JSON coercion
- **Auth token injection** via `@guidogerb/auth`
- Dev logging (redacted), configurable retries with backoff + timeouts
- Narrow types for `/health`; stubs for future endpoints

## Usage

```ts
import { createClient } from '@guidogerb/components/api-client'
import { getAccessToken } from '@guidogerb/auth'

export const http = createClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL!,
  getAccessToken,
  userAgent: 'guidogerb-web/1.0',
})

const health = await http.get('/health')
```

## Typed endpoint helpers

The package also ships opinionated helpers that expose typed operations for
the Phase‑1 REST endpoints. The helpers build on `createClient` and surface
structured responses for catalog search, downloads, entitlements, checkout,
and admin workflows. TypeScript declaration files are bundled so consumers
receive rich type information without additional tooling.

```ts
import { createApi } from '@guidogerb/components/api-client'
import { getAccessToken } from '@guidogerb/auth'

export const api = createApi({
  baseUrl: import.meta.env.VITE_API_BASE_URL!,
  getAccessToken,
  userAgent: 'guidogerb-web/1.0',
})

const health = await api.health.check()
const search = await api.catalog.search({ query: 'ambient', limit: 20 })
const cart = await api.cart.create({
  items: [{ sku: 'album_123', quantity: 1 }],
  promoCode: 'FALL25',
})
```

When needed, the raw HTTP client used by the helpers is available via the
`api.http` property.

### Retry & timeout configuration

`createClient` exposes exponential backoff controls that apply globally or can
be overridden per-request:

```ts
const client = createClient({
  baseUrl: 'https://api.guidogerb.dev',
  retry: {
    attempts: 4,
    delayMs: 200,
    factor: 1.8,
    jitterMs: 100,
    maxDelayMs: 5_000,
    timeoutMs: 10_000,
    idempotent: true, // allow POST/PUT/PATCH retries
    methods: ['delete'], // extend retryable verbs
  },
})

await client.post('/carts', {
  json: { sku: 'album_123', quantity: 1 },
  retry: { idempotent: true, timeoutMs: 5_000 },
})
```

Timeouts leverage `AbortController` and propagate abort reasons so tests can
assert on the underlying error via `ApiError#cause`.
