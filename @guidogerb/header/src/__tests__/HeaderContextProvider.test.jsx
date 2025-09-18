import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeaderContextProvider } from '../HeaderContextProvider.jsx'
import { useHeaderContext } from '../useHeaderContext.js'
import { getHeaderSettings, resetHeaderSettings, setHeaderSettings } from '../settings.js'

function ContextProbe({ onRender }) {
  const value = useHeaderContext()

  useEffect(() => {
    onRender?.(value)
  }, [onRender, value])

  return (
    <>
      <span data-testid="brand-title">{value.settings.brand.title}</span>
      <span data-testid="primary-count">{String(value.settings.primaryLinks.length)}</span>
      <button
        type="button"
        data-testid="mutate"
        onClick={() =>
          value.setSettings((draft) => {
            draft.brand.title = 'Updated Title'
            draft.primaryLinks.push({ label: 'Docs', href: '/docs' })
          })
        }
      >
        mutate
      </button>
    </>
  )
}

describe('HeaderContextProvider', () => {
  beforeEach(() => {
    resetHeaderSettings()
  })

  it('hydrates the context with overrides and syncs the shared store', async () => {
    const onRender = vi.fn()
    const overrides = {
      brand: { title: 'Tenant', tagline: 'Stories worth sharing', href: '/tenant' },
      primaryLinks: [
        { label: 'Home', href: '/' },
      ],
      showTenantSwitcher: true,
    }

    render(
      <HeaderContextProvider defaultSettings={overrides}>
        <ContextProbe onRender={onRender} />
      </HeaderContextProvider>,
    )

    await waitFor(() => expect(onRender).toHaveBeenCalled())

    expect(screen.getByTestId('brand-title').textContent).toBe('Tenant')
    expect(screen.getByTestId('primary-count').textContent).toBe('1')

    await waitFor(() => {
      const stored = getHeaderSettings()
      expect(stored.brand).toMatchObject({ title: 'Tenant', href: '/tenant', tagline: 'Stories worth sharing' })
      expect(stored.primaryLinks).toHaveLength(1)
      expect(stored.showTenantSwitcher).toBe(true)
    })

    const user = userEvent.setup()
    await user.click(screen.getByTestId('mutate'))

    await waitFor(() => {
      const stored = getHeaderSettings()
      expect(stored.brand.title).toBe('Updated Title')
      expect(stored.primaryLinks).toHaveLength(2)
    })

    const lastRender = onRender.mock.calls.at(-1)?.[0]
    expect(lastRender.settingsRef.current.brand.title).toBe('Updated Title')
  })

  it('falls back to the global store when overrides are not provided', async () => {
    setHeaderSettings({ brand: { title: 'Global Title' } })

    render(
      <HeaderContextProvider>
        <ContextProbe />
      </HeaderContextProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('brand-title').textContent).toBe('Global Title')
    })
  })
})
