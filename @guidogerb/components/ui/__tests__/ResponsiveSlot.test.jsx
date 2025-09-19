import { act, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'

import { ResponsiveSlot, ResponsiveSlotProvider } from '../responsive-slot.jsx'

function createMatchMedia(initialWidth) {
  let width = initialWidth
  const descriptors = []

  const evaluate = (query) => {
    const min = /\(min-width:\s*(\d+)px\)/.exec(query)
    const max = /\(max-width:\s*(\d+)px\)/.exec(query)

    let matches = true

    if (min) {
      matches = matches && width >= Number(min[1])
    }

    if (max) {
      matches = matches && width <= Number(max[1])
    }

    return matches
  }

  const matchMedia = vi.fn((query) => {
    const listeners = new Set()
    const legacyListeners = new Set()

    const mql = {
      media: query,
      matches: evaluate(query),
      onchange: null,
      addEventListener: (event, listener) => {
        if (event === 'change') {
          listeners.add(listener)
        }
      },
      removeEventListener: (event, listener) => {
        if (event === 'change') {
          listeners.delete(listener)
        }
      },
      addListener: (listener) => {
        legacyListeners.add(listener)
      },
      removeListener: (listener) => {
        legacyListeners.delete(listener)
      },
    }

    descriptors.push({ query, mql, listeners, legacyListeners })

    return mql
  })

  matchMedia.setWidth = (nextWidth) => {
    width = nextWidth

    for (const descriptor of descriptors) {
      const { query, mql, listeners, legacyListeners } = descriptor
      const matches = evaluate(query)

      if (matches === mql.matches) continue

      mql.matches = matches
      const event = { matches, media: query }

      if (typeof mql.onchange === 'function') {
        mql.onchange(event)
      }

      for (const listener of listeners) {
        listener(event)
      }

      for (const listener of legacyListeners) {
        listener(event)
      }
    }
  }

  return matchMedia
}

describe('ResponsiveSlot', () => {
  it('renders deterministic sizes during SSR using the default breakpoint', () => {
    const markup = renderToString(
      <ResponsiveSlotProvider defaultBreakpoint="lg">
        <ResponsiveSlot slot="catalog.card">
          <div>Product</div>
        </ResponsiveSlot>
      </ResponsiveSlotProvider>,
    )

    expect(markup).toContain('--slot-inline-size:24rem')
    expect(markup).toContain('--slot-block-size:26rem')
    expect(markup).toContain('inline-size:var(--slot-inline-size)')
    expect(markup).toContain('role="presentation"')
  })

  it('updates CSS variables when the active breakpoint changes', async () => {
    const originalMatchMedia = window.matchMedia
    const mockMatchMedia = createMatchMedia(420)
    window.matchMedia = mockMatchMedia

    try {
      render(
        <ResponsiveSlotProvider>
          <ResponsiveSlot slot="catalog.card" data-testid="slot">
            <div>Product</div>
          </ResponsiveSlot>
        </ResponsiveSlotProvider>,
      )

      const slot = await screen.findByTestId('slot')

      await waitFor(() => {
        expect(slot.style.getPropertyValue('--slot-inline-size')).toBe('min(100%, 20rem)')
        expect(slot.style.getPropertyValue('--slot-block-size')).toBe('24rem')
      })

      act(() => {
        mockMatchMedia.setWidth(1300)
      })

      await waitFor(() => {
        expect(slot.style.getPropertyValue('--slot-inline-size')).toBe('24rem')
        expect(slot.style.getPropertyValue('--slot-block-size')).toBe('26rem')
      })
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })
})
