import { render, screen } from '@testing-library/react'

import {
  GuidoGerbUI_Container,
  ResponsiveSlot,
  ResponsiveSlotProvider,
  responsiveSlotBreakpoints,
  baseResponsiveSlots,
} from '../src/responsive-slot/index.js'

describe('responsive-slot module exports', () => {
  it('renders equivalent markup via GuidoGerbUI_Container and ResponsiveSlot', () => {
    render(
      <ResponsiveSlotProvider defaultBreakpoint="lg">
        <div>
          <GuidoGerbUI_Container slot="catalog.card" data-testid="container">
            <div>Container child</div>
          </GuidoGerbUI_Container>
          <ResponsiveSlot slot="catalog.card" data-testid="legacy">
            <div>Legacy child</div>
          </ResponsiveSlot>
        </div>
      </ResponsiveSlotProvider>,
    )

    const container = screen.getByTestId('container')
    const legacy = screen.getByTestId('legacy')

    expect(container.dataset.slotKey).toBe('catalog.card')
    expect(container.dataset.slotLabel).toBe('Catalog Card')
    expect(container.dataset.slotDefaultVariant).toBe('default')

    expect(legacy.dataset.slotKey).toBe(container.dataset.slotKey)
    expect(legacy.dataset.slotLabel).toBe(container.dataset.slotLabel)
    expect(legacy.dataset.slotDefaultVariant).toBe(container.dataset.slotDefaultVariant)
  })

  it('exposes breakpoint descriptors and base presets', () => {
    const keys = responsiveSlotBreakpoints.map((entry) => entry.key)
    expect(keys).toContain('xs')
    expect(keys).toContain('xl')

    expect(baseResponsiveSlots['hero.banner']).toBeDefined()
    expect(baseResponsiveSlots['dashboard.panel']).toBeDefined()
  })
})
