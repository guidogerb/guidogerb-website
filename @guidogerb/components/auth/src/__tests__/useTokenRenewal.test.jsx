import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import useTokenRenewal from '../useTokenRenewal.js'

vi.mock('react-oidc-context', () => ({
  useAuth: vi.fn(),
}))

const { useAuth } = await import('react-oidc-context')

function createMockEvents() {
  const listeners = {
    expiring: new Set(),
    expired: new Set(),
    userLoaded: new Set(),
    silentError: new Set(),
  }

  return {
    addAccessTokenExpiring: (fn) => listeners.expiring.add(fn),
    removeAccessTokenExpiring: (fn) => listeners.expiring.delete(fn),
    addAccessTokenExpired: (fn) => listeners.expired.add(fn),
    removeAccessTokenExpired: (fn) => listeners.expired.delete(fn),
    addUserLoaded: (fn) => listeners.userLoaded.add(fn),
    removeUserLoaded: (fn) => listeners.userLoaded.delete(fn),
    addSilentRenewError: (fn) => listeners.silentError.add(fn),
    removeSilentRenewError: (fn) => listeners.silentError.delete(fn),
    emitExpiring: () => listeners.expiring.forEach((fn) => fn()),
    emitExpired: () => listeners.expired.forEach((fn) => fn()),
    emitUserLoaded: () => listeners.userLoaded.forEach((fn) => fn()),
    emitSilentError: (err) => listeners.silentError.forEach((fn) => fn(err)),
  }
}

function createMockAuth({ expiresIn = 120_000 } = {}) {
  const events = createMockEvents()
  const signinSilent = vi.fn().mockResolvedValue({ refreshed: true })

  const auth = {
    user:
      expiresIn != null
        ? {
            expires_at: Math.floor((Date.now() + expiresIn) / 1000),
            profile: { name: 'Test User' },
          }
        : null,
    events,
    signinSilent,
    isAuthenticated: Boolean(expiresIn != null),
  }

  auth.__setExpiresIn = (ms) => {
    auth.user =
      ms != null
        ? {
            expires_at: Math.floor((Date.now() + ms) / 1000),
            profile: { name: 'Test User' },
          }
        : null
  }

  return auth
}

function Harness({ stateRef, options }) {
  const state = useTokenRenewal(options)
  stateRef.current = state

  return (
    <div
      data-testid="status"
      data-expiring={state.isExpiringSoon ? 'true' : 'false'}
      data-expired={state.isExpired ? 'true' : 'false'}
      data-should-renew={state.shouldRenew ? 'true' : 'false'}
      data-renewing={state.isRenewing ? 'true' : 'false'}
      data-error={state.error ? state.error.message : ''}
      data-last-renewal={state.lastRenewal ? state.lastRenewal.toISOString() : ''}
      data-expires-at={state.expiresAt ? state.expiresAt.toISOString() : ''}
      data-expires-in={state.expiresIn ?? ''}
    />
  )
}

describe('useTokenRenewal', () => {
  beforeEach(() => {
    vi.useRealTimers()
    useAuth.mockReset()
  })

  it('exposes expiration metadata and triggers early warnings', async () => {
    const stateRef = { current: null }
    const auth = createMockAuth({ expiresIn: 4000 })
    useAuth.mockReturnValue(auth)

    render(<Harness stateRef={stateRef} options={{ earlyRefreshMs: 2000 }} />)

    const status = screen.getByTestId('status')
    expect(status.dataset.expired).toBe('false')

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2100))
    })
    await waitFor(() => expect(status.dataset.expiring).toBe('true'))
    await waitFor(() => expect(status.dataset.shouldRenew).toBe('true'))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2100))
    })
    await waitFor(() => expect(status.dataset.expired).toBe('true'))
    expect(status.dataset.renewing).toBe('false')
    expect(status.dataset.error).toBe('')
  })

  it('invokes signinSilent when renew is called', async () => {
    const auth = createMockAuth({ expiresIn: 90_000 })
    let resolveRenew
    auth.signinSilent.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRenew = () => resolve({ refreshed: true })
        }),
    )
    useAuth.mockReturnValue(auth)

    const { result } = renderHook(() => useTokenRenewal({ earlyRefreshMs: 30_000 }))

    let pending
    await act(async () => {
      pending = result.current.renew()
    })

    expect(result.current.isRenewing).toBe(true)

    resolveRenew()
    await act(async () => {
      await pending
    })

    expect(auth.signinSilent).toHaveBeenCalledTimes(1)
    expect(result.current.isRenewing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.lastRenewal).not.toBeNull()
  })

  it('surfaces errors when silent renew fails', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-03T00:00:00Z'))
    const auth = createMockAuth({ expiresIn: 60_000 })
    auth.signinSilent.mockRejectedValue(new Error('network down'))
    useAuth.mockReturnValue(auth)

    const stateRef = { current: null }
    render(<Harness stateRef={stateRef} options={{ earlyRefreshMs: 20_000 }} />)

    const status = screen.getByTestId('status')

    await act(async () => {
      await expect(stateRef.current.renew()).rejects.toThrow('network down')
    })

    expect(status.dataset.renewing).toBe('false')
    expect(status.dataset.error).toBe('network down')
  })

  it('reacts to OIDC events for expiring and refreshed tokens', () => {
    const auth = createMockAuth({ expiresIn: 120_000 })
    useAuth.mockReturnValue(auth)

    const stateRef = { current: null }
    render(<Harness stateRef={stateRef} options={{ earlyRefreshMs: 50_000 }} />)

    const status = screen.getByTestId('status')
    expect(status.dataset.expiring).toBe('false')

    act(() => {
      auth.events.emitExpiring()
    })

    expect(status.dataset.expiring).toBe('true')

    act(() => {
      auth.events.emitSilentError(new Error('silent failed'))
    })

    expect(status.dataset.error).toBe('silent failed')

    act(() => {
      auth.__setExpiresIn(200_000)
      auth.events.emitUserLoaded()
    })

    expect(status.dataset.expiring).toBe('false')
    expect(status.dataset.error).toBe('')
    expect(status.dataset.lastRenewal).not.toBe('')
  })

  it('returns neutral state when no session is active', () => {
    const auth = createMockAuth({ expiresIn: null })
    useAuth.mockReturnValue(auth)

    const stateRef = { current: null }
    render(<Harness stateRef={stateRef} options={{ earlyRefreshMs: 60_000 }} />)

    const status = screen.getByTestId('status')
    expect(status.dataset.expiring).toBe('false')
    expect(status.dataset.expired).toBe('false')
    expect(status.dataset.expiresAt).toBe('')
    expect(status.dataset.expiresIn).toBe('')
    expect(status.dataset.lastRenewal).toBe('')
  })
})

