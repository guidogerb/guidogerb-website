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
        data-slot-breakpoint="lg"
        data-slot-buffer="B"
        data-slot-default-breakpoint="md"
        data-slot-default-variant="default"
        data-slot-description="Product tile used in merchandising grids and featured carousels."
        data-slot-key="catalog.card"
        data-slot-label="Catalog Card"
        data-slot-tags="commerce,grid"
        data-slot-variant="default"
        data-slot-variant-label="Default"
        role="presentation"
        style="--slot-inline-size-A: 22rem; --slot-block-size-A: 26rem; --slot-max-inline-size-A: 26rem; --slot-max-block-size-A: 30rem; --slot-min-inline-size-A: 18rem; --slot-min-block-size-A: 22rem; --slot-inline-A: 22rem; --slot-block-A: 26rem; --slot-max-inline-A: 26rem; --slot-max-block-A: 30rem; --slot-min-inline-A: 18rem; --slot-min-block-A: 22rem; --slot-inline-size-B: 24rem; --slot-block-size-B: 26rem; --slot-max-inline-size-B: 28rem; --slot-max-block-size-B: 30rem; --slot-min-inline-size-B: 20rem; --slot-min-block-size-B: 22rem; --slot-inline-B: 24rem; --slot-block-B: 26rem; --slot-max-inline-B: 28rem; --slot-max-block-B: 30rem; --slot-min-inline-B: 20rem; --slot-min-block-B: 22rem; --slot-inline-size: 24rem; --slot-block-size: 26rem; --slot-max-inline-size: 28rem; --slot-max-block-size: 30rem; --slot-min-inline-size: 20rem; --slot-min-block-size: 22rem; --slot-inline: 24rem; --slot-block: 26rem; --slot-max-inline: 28rem; --slot-max-block: 30rem; --slot-min-inline: 20rem; --slot-min-block: 22rem; inline-size: var(--slot-inline); block-size: var(--slot-block); max-inline-size: var(--slot-max-inline); max-block-size: var(--slot-max-block); min-inline-size: var(--slot-min-inline); min-block-size: var(--slot-min-block); contain: layout paint style; display: grid; place-items: stretch; overflow: hidden auto; position: relative; transition: box-shadow 120ms ease;"
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
        data-slot-breakpoint="xs"
        data-slot-buffer="B"
        data-slot-default-breakpoint="md"
        data-slot-default-variant="default"
        data-slot-description="Product tile used in merchandising grids and featured carousels."
        data-slot-key="catalog.card"
        data-slot-label="Catalog Card"
        data-slot-tags="commerce,grid"
        data-slot-variant="default"
        data-slot-variant-label="Default"
        role="presentation"
        style="--slot-inline-size-A: 22rem; --slot-block-size-A: 26rem; --slot-max-inline-size-A: 26rem; --slot-max-block-size-A: 30rem; --slot-min-inline-size-A: 18rem; --slot-min-block-size-A: 22rem; --slot-inline-A: 22rem; --slot-block-A: 26rem; --slot-max-inline-A: 26rem; --slot-max-block-A: 30rem; --slot-min-inline-A: 18rem; --slot-min-block-A: 22rem; --slot-inline-size-B: min(100%, 20rem); --slot-block-size-B: 24rem; --slot-max-inline-size-B: 24rem; --slot-max-block-size-B: 26rem; --slot-min-inline-size-B: 16rem; --slot-min-block-size-B: 20rem; --slot-inline-B: min(100%, 20rem); --slot-block-B: 24rem; --slot-max-inline-B: 24rem; --slot-max-block-B: 26rem; --slot-min-inline-B: 16rem; --slot-min-block-B: 20rem; --slot-inline-size: min(100%, 20rem); --slot-block-size: 24rem; --slot-max-inline-size: 24rem; --slot-max-block-size: 26rem; --slot-min-inline-size: 16rem; --slot-min-block-size: 20rem; --slot-inline: min(100%, 20rem); --slot-block: 24rem; --slot-max-inline: 24rem; --slot-max-block: 26rem; --slot-min-inline: 16rem; --slot-min-block: 20rem; inline-size: var(--slot-inline); block-size: var(--slot-block); max-inline-size: var(--slot-max-inline); max-block-size: var(--slot-max-block); min-inline-size: var(--slot-min-inline); min-block-size: var(--slot-min-block); contain: layout paint style; display: grid; place-items: stretch; overflow: hidden auto; position: relative; transition: box-shadow 120ms ease;"
      >
        <div>
          Baseline
        </div>
      </div>
    `)
  })
})
