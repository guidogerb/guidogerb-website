import { describe, expect, it, vi } from 'vitest'
import { createApi, createClient } from '../../index.js'

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

describe('createApi', () => {
  it('uses a provided client instance and exposes the http transport', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ status: 'ok' }))
    const http = createClient({ baseUrl: 'https://api.example.com', fetch })

    const api = createApi({ client: http })
    expect(api.http).toBe(http)

    const result = await api.health.check()
    expect(result).toEqual({ status: 'ok' })
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://api.example.com/health')
    expect(init.method).toBe('GET')
  })

  it('builds catalog search URLs with typed filters', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], pageInfo: { total: 0, hasNextPage: false } }))

    const api = createApi({ baseUrl: 'https://api.example.com/v1', fetch })

    await api.catalog.search({
      query: 'jazz',
      type: ['album', 'book'],
      tags: ['vinyl'],
      limit: 10,
      sort: 'featured',
      tenantId: 'tenant-123',
    })

    const [url, init] = fetch.mock.calls[0]
    expect(init.method).toBe('GET')
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/v1/public/catalog/search')
    expect(parsed.searchParams.get('q')).toBe('jazz')
    expect(parsed.searchParams.getAll('type')).toEqual(['album', 'book'])
    expect(parsed.searchParams.getAll('tags')).toEqual(['vinyl'])
    expect(parsed.searchParams.get('limit')).toBe('10')
    expect(parsed.searchParams.get('sort')).toBe('featured')
    expect(parsed.searchParams.get('tenant')).toBe('tenant-123')
  })

  it('merges typed filters with request-level search params without mutating inputs', async () => {
    const fetch = vi.fn()
    fetch.mockImplementationOnce(() =>
      Promise.resolve(jsonResponse({ items: [], pageInfo: { total: 0, hasNextPage: false } })),
    )
    fetch.mockImplementationOnce(() =>
      Promise.resolve(jsonResponse({ items: [], pageInfo: { total: 0, hasNextPage: false } })),
    )

    const api = createApi({ baseUrl: 'https://api.example.com', fetch })

    const providedParams = new URLSearchParams('foo=bar&limit=5')
    await api.catalog.search(
      { query: 'ambient', limit: 10 },
      { searchParams: providedParams, headers: { 'x-debug': '1' } },
    )

    let [url] = fetch.mock.calls[0]
    let parsed = new URL(url)
    expect(parsed.searchParams.getAll('limit')).toEqual(['10'])
    expect(parsed.searchParams.get('foo')).toBe('bar')
    expect(providedParams.getAll('limit')).toEqual(['5'])

    await api.catalog.search(
      { tags: ['vinyl'], sort: 'featured' },
      { query: '?tenant=tenant-1&sort=outdated' },
    )
    ;[url] = fetch.mock.calls[1]
    parsed = new URL(url)
    expect(parsed.searchParams.getAll('tags')).toEqual(['vinyl'])
    expect(parsed.searchParams.get('sort')).toBe('featured')
    expect(parsed.searchParams.get('tenant')).toBe('tenant-1')
  })

  it('encodes catalog identifiers and rejects missing values', async () => {
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ id: 'prod-1' })))
    const api = createApi({ baseUrl: 'https://api.example.com', fetch })

    await api.catalog.getItem('prod/123', {
      includeRecommendations: true,
      tenant: 'tenant-1',
    })

    let call = fetch.mock.calls.at(-1)
    let [url, init] = call
    expect(init.method).toBe('GET')
    const parsedItemUrl = new URL(url)
    expect(parsedItemUrl.pathname).toBe('/public/catalog/items/prod%2F123')
    expect(parsedItemUrl.searchParams.get('includeRecommendations')).toBe('true')
    expect(parsedItemUrl.searchParams.get('tenant')).toBe('tenant-1')

    await api.catalog.getArtist('artist/name', { tenantId: 'tenant-2' })
    call = fetch.mock.calls.at(-1)
    ;[url, init] = call
    expect(init.method).toBe('GET')
    const parsedArtistUrl = new URL(url)
    expect(parsedArtistUrl.pathname).toBe('/public/artist/artist%2Fname')
    expect(parsedArtistUrl.searchParams.get('tenant')).toBe('tenant-2')

    expect(() => api.catalog.getItem('', {})).toThrow('catalog.getItem requires an id')
    expect(() => api.catalog.getArtist('', {})).toThrow('catalog.getArtist requires a slug')
  })

  it('creates download links and validates payloads', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ url: 'https://downloads.example.com/file' }))
    const api = createApi({ baseUrl: 'https://api.example.com', fetch })

    const payload = { assetIds: ['asset-1'], tenantId: 'tenant-1' }
    await api.downloads.createLink(payload)
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://api.example.com/downloads/link')
    expect(init.method).toBe('POST')
    const headers = headersToObject(init.headers)
    expect(headers['content-type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual(payload)

    expect(() => api.downloads.createLink({ assetIds: [] })).toThrow(
      'downloads.createLink requires assetIds',
    )
  })

  it('forwards tenant filters for account resources', async () => {
    const fetch = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(jsonResponse({ items: [], cursor: null, hasNextPage: false })),
      )
    const api = createApi({ baseUrl: 'https://api.example.com', fetch })

    await api.me.getEntitlements({
      tenantId: 'tenant-1',
      status: ['ACTIVE', 'PENDING'],
      cursor: 'next-cursor',
      limit: 25,
    })
    const [entitlementsUrl] = fetch.mock.calls[0]
    const entitlementsParams = new URL(entitlementsUrl).searchParams
    expect(entitlementsParams.get('tenant')).toBe('tenant-1')
    expect(entitlementsParams.getAll('status')).toEqual(['ACTIVE', 'PENDING'])
    expect(entitlementsParams.get('cursor')).toBe('next-cursor')
    expect(entitlementsParams.get('limit')).toBe('25')

    await api.me.getInvoices({ tenant: 'tenant-9', limit: 5 })
    const [invoicesUrl] = fetch.mock.calls[1]
    const invoicesParams = new URL(invoicesUrl).searchParams
    expect(invoicesParams.get('tenant')).toBe('tenant-9')
    expect(invoicesParams.get('limit')).toBe('5')
  })

  it('posts cart payloads and checkout sessions with required fields', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'cart-1',
          items: [],
          totals: { subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0, currency: 'USD' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ sessionId: 'sess_1', expiresAt: '2024-01-01T00:00:00Z' }),
      )

    const api = createApi({ baseUrl: 'https://api.example.com', fetch })

    await api.cart.create({ items: [{ sku: 'sku-1', quantity: 1 }] })
    let [, init] = fetch.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ items: [{ sku: 'sku-1', quantity: 1 }] })

    await api.checkout.createSession({
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    })
    ;[, init] = fetch.mock.calls[1]
    expect(init.method).toBe('POST')

    expect(() => api.cart.create({})).toThrow('cart.create requires an items array')
    expect(() =>
      api.checkout.createSession({ successUrl: 'https://example.com', cancelUrl: '' }),
    ).toThrow('checkout.createSession requires successUrl and cancelUrl')
  })

  it('supports admin workflows with validation and correctly scoped paths', async () => {
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })))
    const api = createApi({ baseUrl: 'https://api.example.com', fetch })

    await api.admin.catalog.import({ source: 's3://bucket/catalog.json' })
    await api.admin.domains.create({ domain: 'shop.example.com', tenantId: 'tenant-1' })
    await api.admin.users.updateRoles('user-1', { tenantId: 'tenant-1', roles: ['admin'] })
    await api.admin.stores.create({
      name: 'Main Store',
      tenantId: 'tenant-1',
      defaultCurrency: 'USD',
    })
    await api.admin.stores.createProduct('store-1', {
      title: 'Album',
      price: { amount: 1999, currency: 'USD' },
    })

    const paths = fetch.mock.calls.map(([url]) => new URL(url).pathname)
    expect(paths).toEqual([
      '/admin/catalog/import',
      '/admin/domains',
      '/admin/users/user-1/roles',
      '/store/create',
      '/store/store-1/products',
    ])

    const bodies = fetch.mock.calls.map(([, init]) => (init.body ? JSON.parse(init.body) : null))
    expect(bodies[0]).toEqual({ source: 's3://bucket/catalog.json' })
    expect(bodies[1]).toEqual({ domain: 'shop.example.com', tenantId: 'tenant-1' })
    expect(bodies[2]).toEqual({ tenantId: 'tenant-1', roles: ['admin'] })
    expect(bodies[3]).toEqual({ name: 'Main Store', tenantId: 'tenant-1', defaultCurrency: 'USD' })
    expect(bodies[4]).toEqual({ title: 'Album', price: { amount: 1999, currency: 'USD' } })

    expect(() => api.admin.catalog.import({})).toThrow('admin.catalog.import requires a source')
    expect(() => api.admin.domains.create({ domain: 'x.com' })).toThrow(
      'admin.domains.create requires domain and tenantId',
    )
    expect(() => api.admin.users.updateRoles('', { roles: ['admin'] })).toThrow(
      'admin.users.updateRoles requires a userId',
    )
    expect(() => api.admin.users.updateRoles('user-1', { roles: [] })).toThrow(
      'admin.users.updateRoles requires roles array',
    )
    expect(() => api.admin.stores.create({ name: 'Store' })).toThrow(
      'admin.stores.create requires name, tenantId, and defaultCurrency',
    )
    expect(() =>
      api.admin.stores.createProduct('store-1', { price: { amount: 1000, currency: 'USD' } }),
    ).toThrow('admin.stores.createProduct requires title and price')
  })
})
