# @guidogerb/components/api-client

Typed HTTP client for the Phase‑1 API (API Gateway HTTP API).

## Features
- Fetch wrapper + JSON coercion
- **Auth token injection** via `@guidogerb/auth`
- Dev logging (redacted), GET retries with backoff
- Narrow types for `/health`; stubs for future endpoints

## Usage
```ts
import { createClient } from '@guidogerb/components/api-client'
import { getAccessToken } from '@guidogerb/auth'

export const api = createClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL!,
  getAccessToken,
  userAgent: 'guidogerb-web/1.0'
})
// Example
const health = await api.get('/health')
```
