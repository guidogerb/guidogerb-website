const COOKIE_NAME_PATTERN = /^(?:[!#$%&'*+.^_`|~0-9A-Za-z-]+)$/
const defaultEncode = (value) => encodeURIComponent(String(value))
const defaultDecode = (value) => decodeURIComponent(value)

const getDocument = (doc) => {
  if (doc && typeof doc.cookie === 'string') {
    return doc
  }

  if (typeof document !== 'undefined' && typeof document.cookie === 'string') {
    return document
  }

  return undefined
}

const safeDecode = (value, decode) => {
  if (value == null) {
    return ''
  }

  try {
    return decode(value)
  } catch (error) {
    return value
  }
}

const normalizeSameSite = (sameSite) => {
  if (sameSite == null) return undefined

  if (typeof sameSite === 'boolean') {
    return sameSite ? 'Strict' : undefined
  }

  const normalized = String(sameSite).trim().toLowerCase()
  if (!normalized) return undefined

  if (normalized === 'strict') return 'Strict'
  if (normalized === 'lax') return 'Lax'
  if (normalized === 'none') return 'None'

  return undefined
}

const normalizeExpires = (expires) => {
  if (!expires) return undefined

  const date = expires instanceof Date ? expires : new Date(expires)
  if (Number.isNaN(date.getTime())) return undefined

  return date.toUTCString()
}

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value)

export const serializeCookie = (name, value, options = {}) => {
  if (!name || !COOKIE_NAME_PATTERN.test(name)) {
    throw new TypeError('Invalid cookie name provided to serializeCookie')
  }

  const {
    encode = defaultEncode,
    domain,
    path,
    maxAge,
    expires,
    sameSite,
    secure = false,
    partitioned = false,
  } = options ?? {}

  const encodedValue = value == null ? '' : encode(String(value))
  let cookie = `${name}=${encodedValue}`

  if (domain) {
    cookie += `; Domain=${domain}`
  }

  if (path) {
    cookie += `; Path=${path}`
  }

  if (isFiniteNumber(maxAge)) {
    cookie += `; Max-Age=${Math.trunc(maxAge)}`
  }

  const expiresValue = normalizeExpires(expires)
  if (expiresValue) {
    cookie += `; Expires=${expiresValue}`
  }

  const sameSiteValue = normalizeSameSite(sameSite)
  if (sameSiteValue) {
    cookie += `; SameSite=${sameSiteValue}`
  }

  if (secure) {
    cookie += '; Secure'
  }

  if (partitioned) {
    cookie += '; Partitioned'
  }

  return cookie
}

export const parseCookies = (cookieString, options = {}) => {
  const { decode = defaultDecode, document: doc } = options ?? {}
  const source = typeof cookieString === 'string' ? cookieString : (getDocument(doc)?.cookie ?? '')

  const jar = {}
  if (!source) {
    return jar
  }

  const pairs = source.split(';')
  for (const entry of pairs) {
    const trimmed = entry.trim()
    if (!trimmed) continue

    const separatorIndex = trimmed.indexOf('=')
    const hasValue = separatorIndex >= 0
    const rawName = hasValue ? trimmed.slice(0, separatorIndex) : trimmed
    const rawValue = hasValue ? trimmed.slice(separatorIndex + 1) : ''

    if (!rawName) continue

    const name = safeDecode(rawName, decode).trim()
    if (!name) continue

    jar[name] = safeDecode(rawValue, decode)
  }

  return jar
}

export const getCookie = (name, options = {}) => {
  if (!name) return undefined
  const { cookies, ...rest } = options ?? {}
  const jar = parseCookies(cookies, rest)
  return Object.prototype.hasOwnProperty.call(jar, name) ? jar[name] : undefined
}

export const setCookie = (name, value, options = {}) => {
  const { document: doc, ...rest } = options ?? {}
  const cookie = serializeCookie(name, value, rest)
  const documentRef = getDocument(doc)

  if (documentRef) {
    documentRef.cookie = cookie
  }

  return cookie
}

export const removeCookie = (name, options = {}) => {
  const { document: doc, expires, maxAge, ...rest } = options ?? {}
  const removalOptions = {
    ...rest,
    expires: expires ?? new Date(0),
    maxAge: maxAge ?? 0,
  }

  return setCookie(name, '', { document: doc, ...removalOptions })
}

export default {
  serializeCookie,
  parseCookies,
  getCookie,
  setCookie,
  removeCookie,
}
