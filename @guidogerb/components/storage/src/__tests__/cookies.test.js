import { describe, expect, beforeEach, afterEach, it } from 'vitest'

import { serializeCookie, parseCookies, getCookie, setCookie, removeCookie } from '../cookies.js'

const clearCookies = () => {
  const jar = document.cookie ? document.cookie.split(';') : []
  for (const entry of jar) {
    const name = entry.split('=')[0]?.trim()
    if (!name) continue
    document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/`
  }
}

describe('cookie utilities', () => {
  beforeEach(() => {
    clearCookies()
  })

  afterEach(() => {
    clearCookies()
  })

  it('serializes cookie attributes with normalised casing', () => {
    const expires = new Date('2025-01-01T00:00:00.000Z')
    const serialized = serializeCookie('session', 'value space', {
      domain: '.example.com',
      path: '/',
      maxAge: 3600,
      expires,
      sameSite: 'strict',
      secure: true,
      partitioned: true,
    })

    expect(serialized).toContain('session=value%20space')
    expect(serialized).toContain('Domain=.example.com')
    expect(serialized).toContain('Path=/')
    expect(serialized).toContain('Max-Age=3600')
    expect(serialized).toContain(`Expires=${expires.toUTCString()}`)
    expect(serialized).toContain('SameSite=Strict')
    expect(serialized).toContain('Secure')
    expect(serialized).toContain('Partitioned')
  })

  it('parses cookie strings using the provided decoder', () => {
    const source = 'theme=dark%20mode; session=abc123'
    const parsed = parseCookies(source)

    expect(parsed).toEqual({ theme: 'dark mode', session: 'abc123' })
  })

  it('reads cookies from document.cookie when no source is provided', () => {
    setCookie('theme', 'dark mode', { path: '/' })
    setCookie('session', 'abc123', { path: '/' })

    const parsed = parseCookies()
    expect(parsed.theme).toBe('dark mode')
    expect(parsed.session).toBe('abc123')
  })

  it('sets and retrieves cookies with decoding applied', () => {
    setCookie('token', 'hello world', { path: '/', sameSite: 'lax' })

    expect(document.cookie).toContain('token=hello%20world')
    expect(getCookie('token')).toBe('hello world')
  })

  it('returns undefined when a cookie is missing', () => {
    expect(getCookie('missing')).toBeUndefined()
  })

  it('removes cookies by expiring them', () => {
    setCookie('feature', 'enabled', { path: '/' })
    expect(getCookie('feature')).toBe('enabled')

    const removal = removeCookie('feature', { path: '/' })

    expect(removal).toContain('Max-Age=0')
    expect(getCookie('feature')).toBeUndefined()
  })
})
