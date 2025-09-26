import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

let currentPath = '/'
const navigateSpy = vi.fn()

const mockRouterModule = {
  useLocation: () => ({ pathname: currentPath }),
  useNavigate: () => navigateSpy,
}
vi.mock('react-router-dom', () => mockRouterModule)
// Explicit reference to ensure ESLint treats properties as used
void mockRouterModule.useLocation

import { useMarketingNavigation } from '../useMarketingNavigation.js'

const scrollSpy = vi.fn()

function setupDom() {
  const original = globalThis.document
  globalThis.document = {
    getElementById: vi.fn(() => ({ scrollIntoView: scrollSpy })),
  }
  return () => {
    globalThis.document = original
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
    currentPath = '/'
    vi.useFakeTimers()
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    assignSpyGlobal = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
  })

  afterEach(() => {
    if (originalHrefDescriptor) {
      Object.defineProperty(window.location, 'href', originalHrefDescriptor)
      originalHrefDescriptor = undefined
    }
    openSpy?.mockRestore()
    assignSpyGlobal?.mockRestore()
    restoreDoc?.()
    vi.runAllTimers()
    vi.useRealTimers()
  })

  it('does not auto-scroll on initial load for root but scrolls when path changes to a section path', () => {
    const { rerender } = render(<TestComponent />)
    expect(scrollSpy).not.toHaveBeenCalled()

    currentPath = '/events'
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
    currentPath = '/market'
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
    handleNavigate({ href: '::::not-a-valid-url' })
    expect(assignSpyGlobal).toHaveBeenCalledWith('::::not-a-valid-url')
  })

  it('preserves search and hash when navigating to a section path', () => {
    render(<TestComponent />)
    const { handleNavigate } = lastNav

    handleNavigate({ href: '/market?sort=asc#offers' })
    expect(navigateSpy).toHaveBeenCalledWith('/market?sort=asc#offers')
  })

  it('navigateHome navigates to root when not already on root', () => {
    currentPath = '/market'
    render(<TestComponent />)
    const { navigateHome } = lastNav
    const prevent = vi.fn()
    navigateHome({ preventDefault: prevent })
    expect(prevent).toHaveBeenCalledTimes(1)
    expect(navigateSpy).toHaveBeenCalledWith('/')
    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('navigateHome scrolls to top when already on root', () => {
    currentPath = '/'
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
