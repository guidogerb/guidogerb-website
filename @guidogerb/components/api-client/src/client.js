const DEFAULT_RETRYABLE_METHODS = new Set(['GET', 'HEAD'])
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])
const DEFAULT_RETRY = Object.freeze({ attempts: 3, delayMs: 250, factor: 2 })

const delay = (ms) =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve()

const ensureTrailingSlash = (url) => (url.endsWith('/') ? url : `${url}/`)

const toHeaders = (value) => {
  if (value instanceof Headers) {
    return value
  }

  const headers = new Headers()
  if (!value) return headers

  Object.entries(value).forEach(([key, val]) => {
    if (val === undefined || val === null) return
    headers.set(key, val)
  })
  return headers
}

const mergeHeaders = (target, source) => {
  if (!source) return target
  const headers = source instanceof Headers ? source.entries() : Object.entries(source)
  for (const [key, val] of headers) {
    if (val === undefined || val === null) continue
    target.set(key, val)
  }
  return target
}

const sanitizeHeaders = (headers) => {
  const snapshot = {}
  if (!headers) return snapshot
  const entries = headers instanceof Headers ? headers.entries() : Object.entries(headers)
  for (const [key, value] of entries) {
    if (key.toLowerCase() === 'authorization') {
      snapshot[key] = '***redacted***'
    } else {
      snapshot[key] = value
    }
  }
  return snapshot
}

const buildUrl = (baseUrl, path = '', searchParams) => {
  const base = ensureTrailingSlash(baseUrl)
  const isAbsolute = typeof path === 'string' && /^https?:\/\//i.test(path)
  const normalizedPath =
    !path || isAbsolute ? (path ?? '') : path.startsWith('/') ? path.slice(1) : path
  const url = new URL(normalizedPath || '', base)
  if (searchParams) {
    if (typeof searchParams === 'string') {
      url.search = searchParams.startsWith('?') ? searchParams : `?${searchParams}`
    } else if (searchParams instanceof URLSearchParams) {
      searchParams.forEach((value, key) => {
        if (value === undefined || value === null) return
        url.searchParams.set(key, value)
      })
    } else if (typeof searchParams === 'object') {
      Object.entries(searchParams).forEach(([key, raw]) => {
        if (raw === undefined || raw === null) return
        const values = Array.isArray(raw) ? raw : [raw]
        values.forEach((value) => {
          if (value === undefined || value === null) return
          url.searchParams.append(key, value)
        })
      })
    }
  }
  return url.toString()
}

const computeRetry = (method, retryOverride, defaultRetry) => {
  const baseConfig = defaultRetry ? { ...defaultRetry } : {}
  const overrideConfig = retryOverride ? { ...retryOverride } : null
  const merged = {
    ...DEFAULT_RETRY,
    ...baseConfig,
    ...(overrideConfig ?? {}),
  }

  const attempts = Math.max(1, merged.attempts ?? DEFAULT_RETRY.attempts)
  const delayMs = Math.max(0, merged.delayMs ?? DEFAULT_RETRY.delayMs)
  const factor = merged.factor && merged.factor > 1 ? merged.factor : DEFAULT_RETRY.factor
  const maxDelayMs = merged.maxDelayMs != null ? Math.max(0, merged.maxDelayMs) : null
  const jitterMs = merged.jitterMs != null ? Math.max(0, merged.jitterMs) : 0
  const timeoutMs = merged.timeoutMs ?? merged.timeout ?? null

  const allowed = new Set(DEFAULT_RETRYABLE_METHODS)
  if (merged.idempotent) {
    allowed.add('POST')
    allowed.add('PUT')
    allowed.add('PATCH')
  }

  const collectMethods = (source) => {
    if (!source || !Array.isArray(source.methods)) return
    for (const entry of source.methods) {
      if (!entry) continue
      allowed.add(String(entry).toUpperCase())
    }
  }

  collectMethods(baseConfig)
  collectMethods(overrideConfig)

  const methodUpper = method.toUpperCase()
  const enabled = attempts > 1 && allowed.has(methodUpper)

  return {
    enabled,
    attempts,
    delayMs,
    factor,
    maxDelayMs,
    jitterMs,
    timeoutMs,
    allowedMethods: allowed,
  }
}

const parseBody = async (response) => {
  if (response.status === 204) return undefined
  const contentLength = response.headers.get('content-length')
  if (contentLength === '0') return undefined

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const text = await response.text()
    if (!text) return undefined
    try {
      return JSON.parse(text)
    } catch (error) {
      throw new ApiError('Failed to parse JSON response', {
        status: response.status,
        statusText: response.statusText,
        data: text,
        response,
        cause: error,
      })
    }
  }

  return response.text()
}

const shouldRetryResponse = (response) => {
  if (!response) return false
  return RETRYABLE_STATUS_CODES.has(response.status)
}

const shouldRetryError = (error) => {
  if (!error) return false
  return error.name !== 'AbortError'
}

export class ApiError extends Error {
  constructor(message, { status, statusText, data, response, request, cause } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status ?? response?.status
    this.statusText = statusText ?? response?.statusText
    this.data = data
    this.response = response
    this.request = request
    if (cause) this.cause = cause
  }
}

export const createClient = ({
  baseUrl,
  getAccessToken,
  fetch = globalThis.fetch?.bind(globalThis),
  logger = console,
  retry: defaultRetry = DEFAULT_RETRY,
  defaultHeaders,
  userAgent,
} = {}) => {
  if (!baseUrl) {
    throw new Error('createClient requires a baseUrl')
  }
  if (typeof fetch !== 'function') {
    throw new Error('createClient requires a fetch implementation')
  }

  const base = ensureTrailingSlash(baseUrl)
  const baseHeaders = toHeaders(defaultHeaders)
  const logDebug = typeof logger?.debug === 'function' ? logger.debug.bind(logger) : () => {}
  const logWarn = typeof logger?.warn === 'function' ? logger.warn.bind(logger) : logDebug

  const send = async (method, path, options = {}) => {
    const methodUpper = method.toUpperCase()
    const retryConfig = options.retry ?? null
    const {
      enabled,
      attempts,
      delayMs,
      factor,
      maxDelayMs,
      jitterMs,
      timeoutMs,
    } = computeRetry(methodUpper, retryConfig, defaultRetry)
    const url = buildUrl(base, path, options.searchParams ?? options.query)

    const requestHeaders = new Headers(baseHeaders)
    mergeHeaders(requestHeaders, options.headers)
    if (userAgent) {
      requestHeaders.set('x-user-agent', userAgent)
    }

    let body
    let requestBody
    if (options.json !== undefined) {
      body = JSON.stringify(options.json)
      if (!requestHeaders.has('content-type')) {
        requestHeaders.set('content-type', 'application/json')
      }
    } else if (options.body !== undefined) {
      body = options.body
    }

    if (typeof getAccessToken === 'function') {
      try {
        const token = await Promise.resolve(getAccessToken())
        if (token) {
          requestHeaders.set('authorization', `Bearer ${token}`)
        }
      } catch (error) {
        logWarn('[api-client] Failed to retrieve access token', error)
      }
    }

    const requestInit = {
      method: methodUpper,
      headers: requestHeaders,
      signal: options.signal,
    }

    if (body !== undefined && DEFAULT_RETRYABLE_METHODS.has(methodUpper) && !retryConfig?.idempotent) {
      logWarn('[api-client] Ignoring body on idempotent request', {
        method: methodUpper,
        url,
      })
    } else if (body !== undefined) {
      requestInit.body = body
      requestBody = body
    }

    let attempt = 0
    let lastError

    const calculateDelay = (currentAttempt) => {
      const exponent = Math.max(0, currentAttempt - 1)
      const baseDelay = delayMs * factor ** exponent
      const jitter = jitterMs > 0 ? Math.random() * jitterMs : 0
      const total = baseDelay + jitter
      return maxDelayMs != null ? Math.min(maxDelayMs, total) : total
    }

    const createSignal = () => {
      if (!timeoutMs && !options.signal) {
        return { signal: options.signal, cleanup: () => {} }
      }

      const controller = new AbortController()
      let timeoutId

      const handleAbort = (event) => {
        controller.abort(event?.target?.reason ?? options.signal?.reason)
      }

      if (options.signal) {
        if (options.signal.aborted) {
          controller.abort(options.signal.reason)
        } else {
          options.signal.addEventListener('abort', handleAbort, { once: true })
        }
      }

      if (timeoutMs && timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          controller.abort(new Error('Request timed out'))
        }, timeoutMs)
      }

      return {
        signal: controller.signal,
        cleanup: () => {
          if (timeoutId) clearTimeout(timeoutId)
          if (options.signal) {
            options.signal.removeEventListener('abort', handleAbort)
          }
        },
      }
    }

    const bodySnapshot = requestBody

    while (attempt < attempts) {
      attempt += 1
      logDebug('[api-client] request', {
        attempt,
        method: methodUpper,
        url,
        headers: sanitizeHeaders(requestHeaders),
      })

      const { signal, cleanup } = createSignal()
      if (signal) {
        requestInit.signal = signal
      } else {
        delete requestInit.signal
      }
      if (bodySnapshot !== undefined) {
        requestInit.body = bodySnapshot
      } else if ('body' in requestInit) {
        delete requestInit.body
      }

      try {
        const response = await fetch(url, requestInit)
        logDebug('[api-client] response', {
          attempt,
          method: methodUpper,
          url,
          status: response.status,
        })

        if (!response.ok) {
          if (enabled && shouldRetryResponse(response) && attempt < attempts) {
            logWarn('[api-client] retrying request after response', {
              attempt,
              method: methodUpper,
              url,
              status: response.status,
            })
            cleanup()
            await delay(calculateDelay(attempt))
            continue
          }

          const data = await parseBody(response)
          throw new ApiError(`Request failed with status ${response.status}`, {
            status: response.status,
            statusText: response.statusText,
            data,
            response,
            request: { method: methodUpper, url },
          })
        }

        const data = await parseBody(response)
        cleanup()
        return { data, response }
      } catch (error) {
        cleanup()
        if (error instanceof ApiError) throw error
        lastError = error
        if (enabled && shouldRetryError(error) && attempt < attempts) {
          logWarn('[api-client] retrying request after error', {
            attempt,
            method: methodUpper,
            url,
            error: error?.message,
          })
          await delay(calculateDelay(attempt))
          continue
        }

        throw new ApiError('Network request failed', {
          request: { method: methodUpper, url },
          cause: error,
        })
      }
    }

    throw new ApiError('Network request failed', {
      request: { method: methodUpper, url },
      cause: lastError,
    })
  }

  return {
    request: send,
    get: async (path, options) => {
      const result = await send('GET', path, options)
      return result.data
    },
    post: async (path, options) => {
      const result = await send('POST', path, options)
      return result.data
    },
    put: async (path, options) => {
      const result = await send('PUT', path, options)
      return result.data
    },
    patch: async (path, options) => {
      const result = await send('PATCH', path, options)
      return result.data
    },
    delete: async (path, options) => {
      const result = await send('DELETE', path, options)
      return result.data
    },
  }
}

export default createClient
