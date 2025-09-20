import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import Storage, { useStorage, useStoredValue } from '../Storage.jsx'

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
        expect.objectContaining({ area: 'local', type: 'set', key: 'feature', value: 'enabled' }),
      )
    })

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ area: 'local', type: 'remove', key: 'feature' }),
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
})
