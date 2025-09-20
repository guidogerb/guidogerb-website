import { createClient } from './client.js'

const encodeSegment = (value) => {
  if (value === undefined || value === null) {
    throw new Error('Path segment value is required')
  }
  return encodeURIComponent(String(value))
}

const sanitizeSearchParams = (params) => {
  if (!params) return undefined
  const entries = Object.entries(params).filter(([_, value]) => {
    if (value === undefined || value === null) return false
    if (Array.isArray(value)) {
      return value.length > 0
    }
    if (typeof value === 'string') {
      return value.length > 0
    }
    return true
  })

  if (entries.length === 0) return undefined

  return entries.reduce((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, {})
}

const appendToMap = (map, key, value) => {
  if (value === undefined || value === null) return
  const existing = map.get(key)
  const stringValue = String(value)
  if (existing) {
    existing.push(stringValue)
  } else {
    map.set(key, [stringValue])
  }
}

const normalizeSearchParams = (value) => {
  if (!value) return undefined
  const map = new Map()

  if (value instanceof URLSearchParams) {
    value.forEach((val, key) => appendToMap(map, key, val))
  } else if (typeof value === 'string') {
    const params = new URLSearchParams(value.startsWith('?') ? value.slice(1) : value)
    params.forEach((val, key) => appendToMap(map, key, val))
  } else if (typeof value === 'object') {
    Object.entries(value).forEach(([key, raw]) => {
      if (raw === undefined || raw === null) return
      const values = Array.isArray(raw) ? raw : [raw]
      values.forEach((item) => appendToMap(map, key, item))
    })
  }

  return map.size > 0 ? map : undefined
}

const mergeSearchParams = (existing, additions) => {
  const existingMap = normalizeSearchParams(existing)
  const additionMap = normalizeSearchParams(additions)

  if (!existingMap) return additionMap
  if (!additionMap) return existingMap

  additionMap.forEach((values, key) => {
    existingMap.set(key, [...values])
  })
  return existingMap
}

const mapToSearchParamsInit = (map) => {
  if (!map || map.size === 0) return undefined
  const result = {}
  map.forEach((values, key) => {
    if (!values || values.length === 0) return
    result[key] = values.length === 1 ? values[0] : [...values]
  })
  return result
}

const applySearchParams = (options, searchParams) => {
  if (!searchParams) return options ?? {}
  const mergedMap = mergeSearchParams(options?.searchParams ?? options?.query, searchParams)
  if (!mergedMap) return options ?? {}
  const nextOptions = options ? { ...options } : {}
  if ('query' in nextOptions) {
    delete nextOptions.query
  }
  nextOptions.searchParams = mapToSearchParamsInit(mergedMap)
  return nextOptions
}

export const createApi = ({ client, ...options } = {}) => {
  const http = client ?? createClient(options)

  const health = {
    check: (requestOptions) => http.get('/health', requestOptions),
  }

  const catalog = {
    search: (params = {}, requestOptions) => {
      const searchParams = sanitizeSearchParams({
        q: params.query ?? params.q,
        type: params.type,
        tags: params.tags,
        cursor: params.cursor,
        limit: params.limit,
        sort: params.sort,
        tenant: params.tenantId ?? params.tenant,
        locale: params.locale,
      })
      return http.get('/public/catalog/search', applySearchParams(requestOptions, searchParams))
    },
    getItem: (id, params = {}, requestOptions) => {
      if (!id) {
        throw new Error('catalog.getItem requires an id')
      }
      const searchParams = sanitizeSearchParams({
        tenant: params.tenantId ?? params.tenant,
        locale: params.locale,
        includeRecommendations: params.includeRecommendations,
      })
      return http.get(
        `/public/catalog/items/${encodeSegment(id)}`,
        applySearchParams(requestOptions, searchParams),
      )
    },
    getArtist: (slug, params = {}, requestOptions) => {
      if (!slug) {
        throw new Error('catalog.getArtist requires a slug')
      }
      const searchParams = sanitizeSearchParams({
        tenant: params.tenantId ?? params.tenant,
        locale: params.locale,
      })
      return http.get(
        `/public/artist/${encodeSegment(slug)}`,
        applySearchParams(requestOptions, searchParams),
      )
    },
  }

  const downloads = {
    createLink: (payload, requestOptions) => {
      if (!payload || !Array.isArray(payload.assetIds) || payload.assetIds.length === 0) {
        throw new Error('downloads.createLink requires assetIds')
      }
      return http.post('/downloads/link', { ...(requestOptions ?? {}), json: payload })
    },
  }

  const me = {
    getEntitlements: (params = {}, requestOptions) => {
      const searchParams = sanitizeSearchParams({
        tenant: params.tenantId ?? params.tenant,
        status: params.status,
        cursor: params.cursor,
        limit: params.limit,
      })
      return http.get('/me/entitlements', applySearchParams(requestOptions, searchParams))
    },
    getInvoices: (params = {}, requestOptions) => {
      const searchParams = sanitizeSearchParams({
        tenant: params.tenantId ?? params.tenant,
        cursor: params.cursor,
        limit: params.limit,
        status: params.status,
      })
      return http.get('/me/invoices', applySearchParams(requestOptions, searchParams))
    },
  }

  const cart = {
    create: (payload, requestOptions) => {
      if (!payload || !Array.isArray(payload.items)) {
        throw new Error('cart.create requires an items array')
      }
      return http.post('/cart', { ...(requestOptions ?? {}), json: payload })
    },
  }

  const checkout = {
    createSession: (payload, requestOptions) => {
      if (!payload?.successUrl || !payload?.cancelUrl) {
        throw new Error('checkout.createSession requires successUrl and cancelUrl')
      }
      return http.post('/checkout/create-session', { ...(requestOptions ?? {}), json: payload })
    },
  }

  const admin = {
    catalog: {
      import: (payload, requestOptions) => {
        if (!payload?.source) {
          throw new Error('admin.catalog.import requires a source')
        }
        return http.post('/admin/catalog/import', { ...(requestOptions ?? {}), json: payload })
      },
    },
    domains: {
      create: (payload, requestOptions) => {
        if (!payload?.domain || !payload?.tenantId) {
          throw new Error('admin.domains.create requires domain and tenantId')
        }
        return http.post('/admin/domains', { ...(requestOptions ?? {}), json: payload })
      },
    },
    users: {
      updateRoles: (userId, payload, requestOptions) => {
        if (!userId) {
          throw new Error('admin.users.updateRoles requires a userId')
        }
        if (!payload || !Array.isArray(payload.roles) || payload.roles.length === 0) {
          throw new Error('admin.users.updateRoles requires roles array')
        }
        return http.post(`/admin/users/${encodeSegment(userId)}/roles`, {
          ...(requestOptions ?? {}),
          json: payload,
        })
      },
    },
    stores: {
      create: (payload, requestOptions) => {
        if (!payload?.name || !payload?.tenantId || !payload?.defaultCurrency) {
          throw new Error('admin.stores.create requires name, tenantId, and defaultCurrency')
        }
        return http.post('/store/create', { ...(requestOptions ?? {}), json: payload })
      },
      createProduct: (storeId, payload, requestOptions) => {
        if (!storeId) {
          throw new Error('admin.stores.createProduct requires a storeId')
        }
        if (!payload?.title || !payload?.price) {
          throw new Error('admin.stores.createProduct requires title and price')
        }
        return http.post(`/store/${encodeSegment(storeId)}/products`, {
          ...(requestOptions ?? {}),
          json: payload,
        })
      },
    },
  }

  return {
    http,
    health,
    catalog,
    downloads,
    me,
    cart,
    checkout,
    admin,
  }
}

export default createApi
