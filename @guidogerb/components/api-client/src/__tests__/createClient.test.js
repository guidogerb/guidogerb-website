import { describe, expect, it, vi } from 'vitest'
import { createClient, ApiError } from '../../index.js'

const jsonResponse = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  })

const headersToObject = (headers) => {
  const entries = headers instanceof Headers ? headers.entries() : Object.entries(headers)
  return Array.from(entries).reduce((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, {})
}

describe('createClient', () => {
  it('builds requests with base url, search params, token injection, and user agent', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ status: 'ok' }))
    const logger = { debug: vi.fn(), warn: vi.fn() }

    const client = createClient({
      baseUrl: 'https://api.example.com/v1',
      getAccessToken: () => 'token-123',
      userAgent: 'guidogerb-web/1.0',
      defaultHeaders: { 'x-app-version': '1.2.3' },
      fetch,
      logger,
    })

    const data = await client.get('/health', { searchParams: { env: 'dev', empty: undefined } })

    expect(data).toEqual({ status: 'ok' })
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://api.example.com/v1/health?env=dev')
    const headers = headersToObject(init.headers)
    expect(headers.authorization).toBe('Bearer token-123')
    expect(headers['x-user-agent']).toBe('guidogerb-web/1.0')
    expect(headers['x-app-version']).toBe('1.2.3')
    expect(headers['content-type']).toBeUndefined()
    expect(logger.debug).toHaveBeenCalled()
  })

  it('retries GET requests on network failures and eventually succeeds', async () => {
    const fetch = vi.fn()
    fetch.mockRejectedValueOnce(new TypeError('network down'))
    fetch.mockResolvedValueOnce(jsonResponse({ status: 'ok' }))

    const client = createClient({
      baseUrl: 'https://api.example.com',
      fetch,
      retry: { attempts: 2, delayMs: 1 },
    })

    const data = await client.get('/health')
    expect(data).toEqual({ status: 'ok' })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('does not retry non-idempotent methods', async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse(
        { message: 'boom' },
        { status: 500, statusText: 'Internal Server Error' },
      ),
    )

    const client = createClient({
      baseUrl: 'https://api.example.com',
      fetch,
      retry: { attempts: 3, delayMs: 1 },
    })

    await expect(client.post('/things', { json: { foo: 'bar' } })).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      data: { message: 'boom' },
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('surfaces response metadata via request helper', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ status: 'ok' }, { status: 201 }))

    const client = createClient({ baseUrl: 'https://api.example.com', fetch })
    const { data, response } = await client.request('POST', '/things', { json: { hello: 'world' } })

    expect(data).toEqual({ status: 'ok' })
    expect(response.status).toBe(201)
  })

  it('wraps network failures in ApiError with request metadata', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('offline'))

    const client = createClient({
      baseUrl: 'https://api.example.com',
      fetch,
      retry: { attempts: 2, delayMs: 1 },
    })

    await expect(client.get('/health')).rejects.toMatchObject({
      name: 'ApiError',
      request: { method: 'GET', url: 'https://api.example.com/health' },
      cause: expect.objectContaining({ message: 'offline' }),
    })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('redacts sensitive headers in debug logs', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const logger = { debug: vi.fn(), warn: vi.fn() }

    const client = createClient({
      baseUrl: 'https://api.example.com',
      fetch,
      logger,
      getAccessToken: () => 'secret-token',
    })

    await client.get('/health')
    const requestLog = logger.debug.mock.calls.find((call) => call[0] === '[api-client] request')
    expect(requestLog).toBeDefined()
    const [, payload] = requestLog
    expect(payload.headers.authorization).toBe('***redacted***')
  })

  it('throws ApiError with response details for error statuses', async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: 'not allowed' },
        { status: 403, statusText: 'Forbidden' },
      ),
    )

    const client = createClient({ baseUrl: 'https://api.example.com', fetch })

    const error = await client
      .get('/secret')
      .then(() => null)
      .catch((err) => err)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(403)
    expect(error.statusText).toBe('Forbidden')
    expect(error.data).toEqual({ error: 'not allowed' })
  })
})
