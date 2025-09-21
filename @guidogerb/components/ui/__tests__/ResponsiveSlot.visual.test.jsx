import { cleanup, render } from '@testing-library/react'

import { ResponsiveSlot, ResponsiveSlotProvider } from '../src/ResponsiveSlot/ResponsiveSlot.jsx'

function createMatchMedia(width) {
  return vi.fn((query) => ({
    media: query,
    matches: !query.includes('min-width') || width >= Number(/\d+/.exec(query)?.[0] || 0),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
  }))
}

describe('ResponsiveSlot visual baselines', () => {
  const originalMatchMedia = window.matchMedia
  const originalResizeObserver = window.ResizeObserver

  beforeEach(() => {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  afterEach(() => {
    cleanup()
    window.matchMedia = originalMatchMedia
    window.ResizeObserver = originalResizeObserver
  })

  it('matches baseline markup for the default breakpoint', () => {
    window.matchMedia = createMatchMedia(1024)

    const { container } = render(
      <ResponsiveSlotProvider>
        <ResponsiveSlot slot="catalog.card">
          <div>Baseline</div>
        </ResponsiveSlot>
      </ResponsiveSlotProvider>,
    )

    expect(container.querySelector('[data-slot-key="catalog.card"]')).toMatchInlineSnapshot(`
      <div
        data-design-component="Catalog / Card"
        data-design-node="0:1"
        data-slot-default-variant="default"
        data-slot-description="Product tile used in merchandising grids and featured carousels."
        data-slot-key="catalog.card"
        data-slot-label="Catalog Card"
        data-slot-tags="commerce,grid"
        data-slot-variant="default"
        data-slot-variant-label="Default"
        role="presentation"
        style="--slot-inline-size: 24rem; --slot-block-size: 26rem; --slot-max-inline-size: none; --slot-max-block-size: none; --slot-min-inline-size: auto; --slot-min-block-size: auto; inline-size: var(--slot-inline-size); block-size: var(--slot-block-size); max-inline-size: var(--slot-max-inline-size); max-block-size: var(--slot-max-block-size); min-inline-size: var(--slot-min-inline-size); min-block-size: var(--slot-min-block-size); contain: layout paint style; display: grid; place-items: stretch; overflow: hidden auto; position: relative;"
      >
        <div>
          Baseline
        </div>
      </div>
    `)
  })

  it('matches baseline markup for the small breakpoint', () => {
    window.matchMedia = createMatchMedia(420)

    const { container } = render(
      <ResponsiveSlotProvider>
        <ResponsiveSlot slot="catalog.card">
          <div>Baseline</div>
        </ResponsiveSlot>
      </ResponsiveSlotProvider>,
    )

    expect(container.querySelector('[data-slot-key="catalog.card"]')).toMatchInlineSnapshot(`
      <div
        data-design-component="Catalog / Card"
        data-design-node="0:1"
        data-slot-default-variant="default"
        data-slot-description="Product tile used in merchandising grids and featured carousels."
        data-slot-key="catalog.card"
        data-slot-label="Catalog Card"
        data-slot-tags="commerce,grid"
        data-slot-variant="default"
        data-slot-variant-label="Default"
        role="presentation"
        style="--slot-inline-size: min(100%, 20rem); --slot-block-size: 24rem; --slot-max-inline-size: none; --slot-max-block-size: none; --slot-min-inline-size: auto; --slot-min-block-size: auto; inline-size: var(--slot-inline-size); block-size: var(--slot-block-size); max-inline-size: var(--slot-max-inline-size); max-block-size: var(--slot-max-block-size); min-inline-size: var(--slot-min-inline-size); min-block-size: var(--slot-min-block-size); contain: layout paint style; display: grid; place-items: stretch; overflow: hidden auto; position: relative;"
      >
        <div>
          Baseline
        </div>
      </div>
    `)
  })
})
