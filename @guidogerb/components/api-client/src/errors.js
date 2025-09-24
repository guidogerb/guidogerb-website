import { ApiError } from './client.js'

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]'

const toArray = (value) => {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

const coerceString = (value) => {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return null
}

const REQUEST_ID_HEADER_CANDIDATES = [
  'x-request-id',
  'x-correlation-id',
  'x-amzn-requestid',
  'x-amzn-trace-id',
  'x-b3-traceid',
]

const getHeaderValue = (headers, candidate) => {
  if (!headers) return null

  try {
    if (typeof headers.get === 'function') {
      return coerceString(headers.get(candidate))
    }
  } catch (error) {
    // Ignore environments where `headers.get` throws (e.g., plain objects masquerading as headers).
  }

  if (typeof headers === 'object') {
    const lowerCandidate = candidate.toLowerCase()
    for (const [key, value] of Object.entries(headers)) {
      if (typeof key !== 'string') continue
      if (key.toLowerCase() !== lowerCandidate) continue

      if (Array.isArray(value)) {
        for (const entry of value) {
          const normalized = coerceString(entry)
          if (normalized) return normalized
        }
      }

      const normalized = coerceString(value)
      if (normalized) return normalized
    }
  }

  return null
}

const extractRequestIdFromHeaders = (headers) => {
  for (const candidate of REQUEST_ID_HEADER_CANDIDATES) {
    const value = getHeaderValue(headers, candidate)
    if (value) {
      return value
    }
  }
  return null
}

const normalizeDetail = (detail) => {
  if (!detail) return null

  if (typeof detail === 'string' || typeof detail === 'number' || typeof detail === 'boolean') {
    const message = coerceString(detail)
    return message ? { message, code: null, field: null, path: null } : null
  }

  if (!isPlainObject(detail)) {
    return { message: String(detail), code: null, field: null, path: null }
  }

  const message =
    coerceString(detail.message) ??
    coerceString(detail.title) ??
    coerceString(detail.description) ??
    coerceString(detail.detail) ??
    coerceString(detail.reason) ??
    coerceString(detail.error) ??
    'Unknown error'

  const codeCandidate =
    coerceString(detail.code) ??
    coerceString(detail.errorCode) ??
    (coerceString(detail.error) && coerceString(detail.error) !== message
      ? coerceString(detail.error)
      : null) ??
    coerceString(detail.type) ??
    null

  const pathValue = detail.path ?? detail.pointer ?? detail.location ?? detail.source?.pointer
  const path = Array.isArray(pathValue)
    ? pathValue
        .map((part) => coerceString(part))
        .filter(Boolean)
        .join('.')
    : coerceString(pathValue)

  const fieldPath = Array.isArray(detail.fieldPath)
    ? detail.fieldPath
        .map((part) => coerceString(part))
        .filter(Boolean)
        .join('.')
    : null

  const field = coerceString(detail.field) ?? coerceString(detail.name) ?? fieldPath ?? path ?? null

  return { message, code: codeCandidate, field, path }
}

const pushDetail = (details, candidate, overrides = {}) => {
  for (const value of toArray(candidate)) {
    const normalized = normalizeDetail(
      isPlainObject(value) ? { ...value, ...overrides } : { ...overrides, message: value },
    )
    if (normalized) {
      details.push(normalized)
    }
  }
}

const extractDetails = (data) => {
  if (!data) return []
  const details = []

  if (Array.isArray(data)) {
    data.forEach((entry) => {
      const normalized = normalizeDetail(entry)
      if (normalized) details.push(normalized)
    })
    return details
  }

  if (!isPlainObject(data)) {
    return details
  }

  if (!isPlainObject(data.errors)) {
    pushDetail(details, data.errors)
  }

  if (isPlainObject(data.errors)) {
    for (const [field, entry] of Object.entries(data.errors)) {
      pushDetail(details, entry, { field })
    }
  }

  pushDetail(details, data.details)
  pushDetail(details, data.violations)
  pushDetail(details, data.messages)
  pushDetail(details, data.reasons)

  if (typeof data.detail === 'string' || isPlainObject(data.detail)) {
    pushDetail(details, data.detail)
  }

  if (isPlainObject(data.fieldErrors)) {
    for (const [field, entry] of Object.entries(data.fieldErrors)) {
      pushDetail(details, entry, { field })
    }
  } else {
    pushDetail(details, data.fieldErrors)
  }

  if (isPlainObject(data.meta?.errors)) {
    for (const [field, entry] of Object.entries(data.meta.errors)) {
      pushDetail(details, entry, { field })
    }
  }

  return details
}

const DEFAULT_MESSAGE = 'Unknown API error'

export const normalizeApiError = (error) => {
  if (!error) {
    return {
      message: DEFAULT_MESSAGE,
      status: undefined,
      statusText: undefined,
      code: null,
      details: [],
      fieldErrors: {},
      hasFieldErrors: false,
      data: undefined,
      cause: undefined,
      isApiError: false,
      original: error,
      requestId: null,
    }
  }

  const isApiErrorInstance = error instanceof ApiError
  const status = error.status ?? error.response?.status
  const statusText = coerceString(error.statusText ?? error.response?.statusText)
  const data = isApiErrorInstance ? error.data : (error.data ?? error.body ?? error.response?.data)

  let message = coerceString(error.message) ?? DEFAULT_MESSAGE

  if (typeof data === 'string') {
    message = coerceString(data) ?? message
  } else if (isPlainObject(data)) {
    message =
      coerceString(data.message) ??
      coerceString(data.error_description) ??
      coerceString(data.errorMessage) ??
      coerceString(data.error) ??
      coerceString(data.title) ??
      coerceString(data.detail) ??
      coerceString(data.reason) ??
      message
  }

  const details = extractDetails(data)
  const fieldErrors = {}

  for (const detail of details) {
    const key = detail.field ?? detail.path
    if (!key) continue
    if (!fieldErrors[key]) {
      fieldErrors[key] = []
    }
    fieldErrors[key].push(detail.message)
  }

  let code = null
  if (isPlainObject(data)) {
    code =
      coerceString(data.code) ??
      coerceString(data.errorCode) ??
      (coerceString(data.error) && coerceString(data.error) !== message
        ? coerceString(data.error)
        : null)
  }

  let requestId =
    extractRequestIdFromHeaders(error.response?.headers ?? error.headers) ??
    coerceString(error.requestId ?? error.requestID ?? error.correlationId ?? error.correlationID)

  if (!requestId && isPlainObject(data)) {
    requestId =
      coerceString(data.requestId) ??
      coerceString(data.request_id) ??
      coerceString(data.requestID) ??
      coerceString(data.traceId) ??
      coerceString(data.trace_id) ??
      coerceString(data.correlationId) ??
      coerceString(data.correlation_id)
  }

  return {
    message,
    status,
    statusText,
    code,
    details,
    fieldErrors,
    hasFieldErrors: Object.keys(fieldErrors).length > 0,
    data,
    cause: error.cause,
    isApiError: isApiErrorInstance,
    original: error,
    requestId: requestId ?? null,
  }
}

export default normalizeApiError
