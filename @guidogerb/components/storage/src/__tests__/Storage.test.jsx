import { useEffect } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import Storage, { useHasStoredValue, useStorage, useStoredValue } from '../Storage.jsx'

describe('Storage provider', () => {
  it('renders children and exposes configured controllers', async () => {
    function Example() {
      const storage = useStorage()
      const [greeting] = useStoredValue('greeting', { defaultValue: 'hi' })

      useEffect(() => {
        const controller = storage.getController('local')
        controller.set('greeting', 'hello')
      }, [storage])

      return (
        <div>
          <span data-testid="areas">{storage.areas.join(',')}</span>
          <span data-testid="greeting">{greeting}</span>
        </div>
      )
    }

    render(
      <Storage namespace="test" areas={[{ name: 'local' }, 'session']}>
        <Example />
      </Storage>,
    )

    expect(screen.getByTestId('areas').textContent.split(',')).toEqual(
      expect.arrayContaining(['local', 'session', 'memory']),
    )

    await waitFor(() => {
      expect(screen.getByTestId('greeting')).toHaveTextContent('hello')
    })
  })

  it('emits change events when underlying controllers mutate', async () => {
    const handleChange = vi.fn()

    function Example() {
      const storage = useStorage()

      useEffect(() => {
        const controller = storage.getController('local')
        const timer = setTimeout(() => {
          controller.set('feature', 'enabled')
          controller.remove('feature')
        })
        return () => clearTimeout(timer)
      }, [storage])

      return null
    }

    render(
      <Storage namespace="demo" onChange={handleChange}>
        <Example />
      </Storage>,
    )

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          area: 'local',
          type: 'set',
          key: 'feature',
          value: 'enabled',
          source: 'local',
        }),
      )
    })

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ area: 'local', type: 'remove', key: 'feature', source: 'local' }),
    )
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ area: 'local', type: 'set', key: 'feature', source: 'local' }),
    )
  })

  it('provides reactive helpers via useStoredValue', async () => {
    const user = userEvent.setup()

    function Example() {
      const [mode, setMode, clearMode] = useStoredValue('mode', { defaultValue: 'light' })

      return (
        <div>
          <span data-testid="mode">{mode}</span>
          <button type="button" onClick={() => setMode('dark')}>
            dark
          </button>
          <button type="button" onClick={() => setMode((previous) => `${previous}-custom`)}>
            customise
          </button>
          <button type="button" onClick={() => clearMode()}>
            reset
          </button>
        </div>
      )
    }

    render(
      <Storage namespace="demo">
        <Example />
      </Storage>,
    )

    const value = screen.getByTestId('mode')
    expect(value).toHaveTextContent('light')

    await user.click(screen.getByRole('button', { name: 'dark' }))
    expect(value).toHaveTextContent('dark')

    await user.click(screen.getByRole('button', { name: 'customise' }))
    expect(value).toHaveTextContent('dark-custom')

    await user.click(screen.getByRole('button', { name: 'reset' }))
    expect(value).toHaveTextContent('light')
  })

  it('exposes hasValue helpers to check storage state without reading fallbacks', async () => {
    const user = userEvent.setup()

    function Example() {
      const storage = useStorage()
      const [, setFlag, clearFlag] = useStoredValue('flag', { defaultValue: 'absent' })

      return (
        <div>
          <span data-testid="has-flag">{storage.hasValue('flag') ? 'yes' : 'no'}</span>
          <button type="button" onClick={() => setFlag('present')}>
            store
          </button>
          <button type="button" onClick={() => clearFlag()}>
            remove
          </button>
        </div>
      )
    }

    render(
      <Storage namespace="has-demo">
        <Example />
      </Storage>,
    )

    expect(screen.getByTestId('has-flag')).toHaveTextContent('no')

    await user.click(screen.getByRole('button', { name: 'store' }))
    await waitFor(() => {
      expect(screen.getByTestId('has-flag')).toHaveTextContent('yes')
    })

    await user.click(screen.getByRole('button', { name: 'remove' }))
    await waitFor(() => {
      expect(screen.getByTestId('has-flag')).toHaveTextContent('no')
    })
  })

  it('always provisions default and fallback areas even when omitted', async () => {
    const user = userEvent.setup()

    function Example() {
      const storage = useStorage()
      const [value] = useStoredValue('key', { defaultValue: 'missing', area: 'local' })
      const hasLocal = storage.hasController('local')

      return (
        <>
          <span data-testid="value">{value}</span>
          <span data-testid="has-local">{hasLocal ? 'yes' : 'no'}</span>
          <button type="button" onClick={() => storage.setValue('key', 'value', 'local')}>
            write
          </button>
        </>
      )
    }

    render(
      <Storage areas={['session']} defaultArea="session">
        <Example />
      </Storage>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('has-local')).toHaveTextContent('yes')
    })

    await user.click(screen.getByRole('button', { name: 'write' }))

    await waitFor(() => {
      expect(screen.getByTestId('value')).toHaveTextContent('value')
    })
  })

  it('logs warnings when controller cleanup fails during unmount', async () => {
    const subscribe = vi.fn(() => () => {
      throw new Error('cleanup failure')
    })
    const controllerFactory = vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      list: vi.fn(() => []),
      snapshot: vi.fn(() => ({})),
      subscribe,
    }))
    const warn = vi.fn()

    const { unmount } = render(
      <Storage
        namespace="logs"
        areas={['custom']}
        defaultArea="custom"
        controllerFactory={controllerFactory}
        logger={{ warn }}
        onChange={() => {}}
      >
        <div>child</div>
      </Storage>,
    )

    await waitFor(() => {
      expect(subscribe).toHaveBeenCalled()
    })

    unmount()

    await waitFor(() => {
      expect(warn).toHaveBeenCalledWith(
        '[storage] Listener cleanup failed',
        expect.any(Error),
      )
    })
  })

  it('allows subscribing to specific value changes with presence metadata', async () => {
    const user = userEvent.setup()
    const events = []
    const handleEvent = vi.fn((event) => {
      events.push(event)
    })

    function Example() {
      const storage = useStorage()
      const [, setFeature, removeFeature] = useStoredValue('feature', { defaultValue: 'off' })

      useEffect(() => storage.subscribeToValue('feature', handleEvent), [storage])

      return (
        <div>
          <button type="button" onClick={() => setFeature('enabled')}>
            enable
          </button>
          <button type="button" onClick={() => removeFeature()}>
            remove
          </button>
          <button type="button" onClick={() => storage.clearArea()}>
            clear
          </button>
        </div>
      )
    }

    render(
      <Storage namespace="subscribe-demo">
        <Example />
      </Storage>,
    )

    expect(handleEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'init', present: false, source: 'snapshot' }),
    )

    await user.click(screen.getByRole('button', { name: 'enable' }))
    await waitFor(() => {
      expect(handleEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'set', value: 'enabled', present: true, source: 'local' }),
      )
    })

    await user.click(screen.getByRole('button', { name: 'remove' }))
    await waitFor(() => {
      expect(handleEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'remove', present: false, source: 'local' }),
      )
    })

    await user.click(screen.getByRole('button', { name: 'enable' }))
    await waitFor(() => {
      expect(handleEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'set', present: true, source: 'local' }),
      )
    })

    await user.click(screen.getByRole('button', { name: 'clear' }))
    await waitFor(() => {
      expect(handleEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'clear', present: false, source: 'local' }),
      )
    })

    const eventTypes = events.map((event) => event.type)
    expect(eventTypes[0]).toBe('init')
    expect(eventTypes).toEqual(expect.arrayContaining(['set', 'remove', 'clear']))
  })

  it('tracks storage presence reactively via useHasStoredValue', async () => {
    const user = userEvent.setup()

    function Example() {
      const storage = useStorage()
      const hasToken = useHasStoredValue('session-token', { area: 'session' })
      const [, setToken, removeToken] = useStoredValue('session-token', {
        area: 'session',
        defaultValue: null,
      })

      return (
        <div>
          <span data-testid="presence">{hasToken ? 'yes' : 'no'}</span>
          <button type="button" onClick={() => setToken('value')}>
            store
          </button>
          <button type="button" onClick={() => removeToken()}>
            remove
          </button>
          <button type="button" onClick={() => storage.clearArea('session')}>
            clear
          </button>
        </div>
      )
    }

    render(
      <Storage namespace="presence-demo" areas={['local', 'session']}>
        <Example />
      </Storage>,
    )

    const presence = screen.getByTestId('presence')
    expect(presence).toHaveTextContent('no')

    await user.click(screen.getByRole('button', { name: 'store' }))
    await waitFor(() => {
      expect(presence).toHaveTextContent('yes')
    })

    await user.click(screen.getByRole('button', { name: 'remove' }))
    await waitFor(() => {
      expect(presence).toHaveTextContent('no')
    })

    await user.click(screen.getByRole('button', { name: 'store' }))
    await waitFor(() => {
      expect(presence).toHaveTextContent('yes')
    })

    await user.click(screen.getByRole('button', { name: 'clear' }))
    await waitFor(() => {
      expect(presence).toHaveTextContent('no')
    })
  })

  it('reacts to external storage events across browser tabs', async () => {
    window.localStorage.clear()
    const events = []

    function Example() {
      const storage = useStorage()
      const presence = useHasStoredValue('token')

      useEffect(() => storage.subscribeToValue('token', (event) => events.push(event)), [storage])

      return <span data-testid="presence">{presence ? 'yes' : 'no'}</span>
    }

    render(
      <Storage namespace="external-sync" areas={['local']} defaultArea="local">
        <Example />
      </Storage>,
    )

    expect(screen.getByTestId('presence')).toHaveTextContent('no')
    expect(events[0]).toMatchObject({ type: 'init', present: false, source: 'snapshot' })

    const dispatch = (init) =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          url: 'https://example.test',
          storageArea: window.localStorage,
          ...init,
        }),
      )

    await act(async () => {
      window.localStorage.setItem('external-sync::token', JSON.stringify('remote'))
      dispatch({ key: 'external-sync::token', oldValue: null, newValue: JSON.stringify('remote') })
    })

    await waitFor(() => {
      expect(screen.getByTestId('presence')).toHaveTextContent('yes')
      expect(events).toContainEqual(
        expect.objectContaining({ type: 'set', value: 'remote', source: 'external', present: true }),
      )
    })

    await act(async () => {
      window.localStorage.removeItem('external-sync::token')
      dispatch({
        key: 'external-sync::token',
        oldValue: JSON.stringify('remote'),
        newValue: null,
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('presence')).toHaveTextContent('no')
      expect(events).toContainEqual(
        expect.objectContaining({ type: 'remove', source: 'external', present: false }),
      )
    })

    await act(async () => {
      window.localStorage.setItem('external-sync::token', JSON.stringify('reset'))
      window.localStorage.clear()
      dispatch({ key: null, oldValue: null, newValue: null })
    })

    await waitFor(() => {
      expect(screen.getByTestId('presence')).toHaveTextContent('no')
      expect(events).toContainEqual(
        expect.objectContaining({ type: 'clear', source: 'external', present: false }),
      )
    })

    window.localStorage.clear()
  })
})
