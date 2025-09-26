import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

const { routerMocks } = vi.hoisted(() => {
  let currentPath = '/'
  const navigateSpy = vi.fn()

  return {
    routerMocks: {
      module: {
        useLocation: () => ({ pathname: currentPath }),
        useNavigate: () => navigateSpy,
      },
      navigateSpy,
      setCurrentPath(path) {
        currentPath = path
      },
    },
  }
})

vi.mock('react-router-dom', () => routerMocks.module)

const navigateSpy = routerMocks.navigateSpy
const setCurrentPath = (path) => routerMocks.setCurrentPath(path)

import { useMarketingNavigation } from '../useMarketingNavigation.js'

const scrollSpy = vi.fn()
const originalLocation = window.location

function setupDom() {
  const doc = globalThis.document
  if (!doc) {
    return () => {}
  }

  const originalDescriptor = Object.getOwnPropertyDescriptor(doc, 'getElementById')
  const stub = vi.fn(() => ({ scrollIntoView: scrollSpy }))

  Object.defineProperty(doc, 'getElementById', {
    configurable: true,
    enumerable: true,
    value: stub,
    writable: true,
  })

  return () => {
    if (originalDescriptor) {
      Object.defineProperty(doc, 'getElementById', originalDescriptor)
    } else {
      delete doc.getElementById
    }
  }
}

let lastNav // holds latest hook return
function TestComponent() {
  lastNav = useMarketingNavigation()
  return null
}

describe('useMarketingNavigation', () => {
  let restoreDoc
  let originalHrefDescriptor
  let openSpy
  let assignSpyGlobal

  beforeEach(() => {
    restoreDoc = setupDom()
    scrollSpy.mockClear()
    navigateSpy.mockClear()
    setCurrentPath('/')
    vi.useFakeTimers()
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    const locationMock = {
      origin: originalLocation.origin,
      href: originalLocation.href,
      assign: vi.fn(),
    }

    Object.defineProperty(window, 'location', {
      configurable: true,
      enumerable: true,
      value: locationMock,
    })

    assignSpyGlobal = locationMock.assign
  })

  afterEach(() => {
    if (originalHrefDescriptor) {
      Object.defineProperty(window.location, 'href', originalHrefDescriptor)
      originalHrefDescriptor = undefined
    }
    openSpy?.mockRestore()
    Object.defineProperty(window, 'location', {
      configurable: true,
      enumerable: true,
      value: originalLocation,
    })
    assignSpyGlobal = undefined
    restoreDoc?.()
    vi.runAllTimers()
    vi.useRealTimers()
  })

  it('does not auto-scroll on initial load for root but scrolls when path changes to a section path', () => {
    const { rerender } = render(<TestComponent />)
    expect(scrollSpy).not.toHaveBeenCalled()

    setCurrentPath('/events')
    rerender(<TestComponent />)

    expect(scrollSpy).toHaveBeenCalledTimes(1)
  })

  it('navigates to a new section path preserving hash/search and triggers immediate + scheduled scrolls', () => {
    render(<TestComponent />)
    const { handleNavigate } = lastNav

    handleNavigate({ href: '/market#daily' })

    expect(navigateSpy).toHaveBeenCalledWith('/market#daily')
    expect(scrollSpy).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(16)

    expect(scrollSpy.mock.calls.length).toBeGreaterThanOrEqual(3)
  })

  it('scrolls current section without navigating if already on target path', () => {
    setCurrentPath('/market')
    render(<TestComponent />)
    scrollSpy.mockClear()
    navigateSpy.mockClear()
    const { handleNavigate } = lastNav

    handleNavigate({ href: '/market#offers' })

    expect(navigateSpy).not.toHaveBeenCalled()
    expect(scrollSpy).toHaveBeenCalledTimes(1)
  })

  it('handles mailto links by assigning window.location.href (or calling assign) and not calling navigate', () => {
    render(<TestComponent />)
    const { handleNavigate } = lastNav

    let hrefSetter
    let localAssignSpy

    try {
      originalHrefDescriptor = Object.getOwnPropertyDescriptor(window.location, 'href')
      hrefSetter = vi.fn()
      Object.defineProperty(window.location, 'href', {
        configurable: true,
        set: hrefSetter,
      })
    } catch {
      localAssignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    }

    handleNavigate({ href: 'mailto:test@example.com' })

    if (hrefSetter) {
      expect(hrefSetter).toHaveBeenCalledWith('mailto:test@example.com')
    } else if (localAssignSpy) {
      expect(localAssignSpy).toHaveBeenCalledWith('mailto:test@example.com')
      localAssignSpy.mockRestore()
    }

    expect(navigateSpy).not.toHaveBeenCalled()
    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('handles tel links similarly to mailto', () => {
    render(<TestComponent />)
    const { handleNavigate } = lastNav
    let hrefSetter
    try {
      originalHrefDescriptor = Object.getOwnPropertyDescriptor(window.location, 'href')
      hrefSetter = vi.fn()
      Object.defineProperty(window.location, 'href', { configurable: true, set: hrefSetter })
    } catch {
      /* ignore: jsdom environment may not allow redefining href */
    }

    handleNavigate({ href: 'tel:+15551234567' })

    if (hrefSetter) {
      expect(hrefSetter).toHaveBeenCalledWith('tel:+15551234567')
    } else {
      expect(assignSpyGlobal).toHaveBeenCalledWith('tel:+15551234567')
    }
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('accepts payload shape { item: { href } }', () => {
    render(<TestComponent />)
    const { handleNavigate } = lastNav

    handleNavigate({ item: { href: '/events#agenda' } })
    expect(navigateSpy).toHaveBeenCalledWith('/events#agenda')
    expect(scrollSpy).toHaveBeenCalledTimes(1)
  })

  it('opens external links in a new window when external flag set', () => {
    render(<TestComponent />)
    const { handleNavigate } = lastNav

    handleNavigate({ href: 'https://example.com/cheese', external: true })
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('treats different-origin URLs as external automatically', () => {
    render(<TestComponent />)
    const { handleNavigate } = lastNav
    handleNavigate({ href: 'https://another-origin.test/path' })
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('falls back to location.assign on invalid URL strings', () => {
    render(<TestComponent />)
    const { handleNavigate } = lastNav
    handleNavigate({ href: 'http://exa mple.com' })
    expect(assignSpyGlobal).toHaveBeenCalledWith('http://exa mple.com')
  })

  it('preserves search and hash when navigating to a section path', () => {
    render(<TestComponent />)
    const { handleNavigate } = lastNav

    handleNavigate({ href: '/market?sort=asc#offers' })
    expect(navigateSpy).toHaveBeenCalledWith('/market?sort=asc#offers')
  })

  it('navigateHome navigates to root when not already on root', () => {
    setCurrentPath('/market')
    render(<TestComponent />)
    scrollSpy.mockClear()
    navigateSpy.mockClear()
    const { navigateHome } = lastNav
    const prevent = vi.fn()
    navigateHome({ preventDefault: prevent })
    expect(prevent).toHaveBeenCalledTimes(1)
    expect(navigateSpy).toHaveBeenCalledWith('/')
    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('navigateHome scrolls to top when already on root', () => {
    setCurrentPath('/')
    render(<TestComponent />)
    scrollSpy.mockClear()
    navigateSpy.mockClear()
    const { navigateHome } = lastNav
    navigateHome()
    expect(navigateSpy).not.toHaveBeenCalled()
    expect(scrollSpy).toHaveBeenCalledTimes(1)
    // Ensure top element was requested
    expect(globalThis.document.getElementById).toHaveBeenCalledWith('top')
  })
})
