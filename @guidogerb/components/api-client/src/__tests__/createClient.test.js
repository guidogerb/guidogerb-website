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
    const fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ message: 'boom' }, { status: 500, statusText: 'Internal Server Error' }),
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
    const fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: 'not allowed' }, { status: 403, statusText: 'Forbidden' }),
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

  it('logs a warning when access token retrieval fails and continues without auth header', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const logger = { debug: vi.fn(), warn: vi.fn() }

    const client = createClient({
      baseUrl: 'https://api.example.com',
      fetch,
      getAccessToken: () => {
        throw new Error('token error')
      },
      logger,
    })

    await client.get('/profile')

    expect(logger.warn).toHaveBeenCalledWith(
      '[api-client] Failed to retrieve access token',
      expect.any(Error),
    )

    const [, init] = fetch.mock.calls[0]
    const headers = headersToObject(init.headers)
    expect(headers.authorization).toBeUndefined()
  })

  it('skips bodies on idempotent requests and warns when json is provided for GET', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const logger = { debug: vi.fn(), warn: vi.fn() }

    const client = createClient({ baseUrl: 'https://api.example.com', fetch, logger })

    const data = await client.get('/items', { json: { foo: 'bar' } })

    expect(data).toEqual({ ok: true })
    expect(logger.warn).toHaveBeenCalledWith(
      '[api-client] Ignoring body on idempotent request',
      expect.objectContaining({ method: 'GET', url: 'https://api.example.com/items' }),
    )
    const [, init] = fetch.mock.calls[0]
    expect(init.body).toBeUndefined()
  })

  it('retries retryable status codes before succeeding', async () => {
    const failing = jsonResponse({ message: 'busy' }, { status: 503, statusText: 'Unavailable' })
    const success = jsonResponse({ status: 'ok' })
    const fetch = vi.fn().mockResolvedValueOnce(failing).mockResolvedValueOnce(success)
    const logger = { debug: vi.fn(), warn: vi.fn() }

    const client = createClient({
      baseUrl: 'https://api.example.com',
      fetch,
      logger,
      retry: { attempts: 2, delayMs: 0 },
    })

    const data = await client.get('/health')
    expect(data).toEqual({ status: 'ok' })
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(logger.warn).toHaveBeenCalledWith(
      '[api-client] retrying request after response',
      expect.objectContaining({
        method: 'GET',
        url: 'https://api.example.com/health',
        status: 503,
      }),
    )
  })

  it('exposes raw response data when JSON parsing fails', async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(
        new Response('not-json', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )

    const client = createClient({ baseUrl: 'https://api.example.com', fetch })

    await client.get('/bad-json').catch((error) => {
      expect(error).toBeInstanceOf(ApiError)
      expect(error.message).toBe('Failed to parse JSON response')
      expect(error.data).toBe('not-json')
      expect(error.cause).toBeInstanceOf(SyntaxError)
    })
  })

  it('supports diverse search param inputs and header sources', async () => {
    const fetch = vi.fn(() => Promise.resolve(jsonResponse({ ok: true })))
    const headers = new Headers({ 'x-default': '1' })
    const client = createClient({
      baseUrl: 'https://api.example.com/v1/',
      fetch,
      defaultHeaders: headers,
      userAgent: 'guidogerb-tests/1.0',
    })

    await client.get('reports', { searchParams: '?foo=1&bar=2' })
    await client.get('reports', {
      query: { foo: '1', tags: ['a', 'b'], empty: undefined },
    })

    expect(fetch).toHaveBeenCalledTimes(2)
    const [firstUrl, firstInit] = fetch.mock.calls[0]
    expect(firstUrl).toBe('https://api.example.com/v1/reports?foo=1&bar=2')
    expect(headersToObject(firstInit.headers)['x-default']).toBe('1')
    expect(headersToObject(firstInit.headers)['x-user-agent']).toBe('guidogerb-tests/1.0')

    const [secondUrl] = fetch.mock.calls[1]
    expect(secondUrl).toBe('https://api.example.com/v1/reports?foo=1&tags=a&tags=b')
  })

  it('treats empty responses as undefined for 204 and zero content-length payloads', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response('', {
          status: 200,
          headers: { 'content-type': 'application/json', 'content-length': '0' },
        }),
      )

    const client = createClient({ baseUrl: 'https://api.example.com', fetch })

    await expect(client.get('/no-content')).resolves.toBeUndefined()
    await expect(client.get('/empty-json')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('returns text bodies untouched for non-JSON responses', async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(
        new Response('plain text payload', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        }),
      ),
    )

    const client = createClient({ baseUrl: 'https://api.example.com', fetch })

    const data = await client.get('/text-response')
    expect(data).toBe('plain text payload')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not retry aborted requests and surfaces the abort cause', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    const fetch = vi.fn().mockRejectedValue(abortError)

    const client = createClient({
      baseUrl: 'https://api.example.com',
      fetch,
      retry: { attempts: 5, delayMs: 0 },
    })

    await expect(client.get('/resource')).rejects.toMatchObject({
      name: 'ApiError',
      cause: abortError,
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('sends provided body payloads without JSON serialization', async () => {
    const fetch = vi.fn(() => Promise.resolve(jsonResponse({ ok: true })))
    const body = new Uint8Array([1, 2, 3])

    const client = createClient({ baseUrl: 'https://api.example.com', fetch })

    await client.post('/upload', {
      body,
      headers: { 'content-type': 'application/octet-stream' },
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [, init] = fetch.mock.calls[0]
    expect(init.body).toBe(body)
    const headers = headersToObject(init.headers)
    expect(headers['content-type']).toBe('application/octet-stream')
  })
})
