import { render, screen } from '@testing-library/react'

import {
  GuidoGerbUI_Container,
  ResponsiveSlot,
  ResponsiveSlotProvider,
  responsiveSlotBreakpoints,
  baseResponsiveSlots,
} from '../src/responsive-slot/index.js'

describe('responsive-slot module exports', () => {
  it('aliases GuidoGerbUI_Container to the existing ResponsiveSlot component', () => {
    expect(ResponsiveSlot).toBe(GuidoGerbUI_Container)

    render(
      <ResponsiveSlotProvider defaultBreakpoint="lg">
        <GuidoGerbUI_Container slot="catalog.card" data-testid="slot">
          <div>Content</div>
        </GuidoGerbUI_Container>
      </ResponsiveSlotProvider>,
    )

    const slot = screen.getByTestId('slot')
    expect(slot.dataset.slotKey).toBe('catalog.card')
    expect(slot.dataset.slotLabel).toBe('Catalog Card')
  })

  it('exposes breakpoint descriptors and base presets', () => {
    const keys = responsiveSlotBreakpoints.map((entry) => entry.key)
    expect(keys).toContain('xs')
    expect(keys).toContain('xl')

    expect(baseResponsiveSlots['hero.banner']).toBeDefined()
    expect(baseResponsiveSlots['dashboard.panel']).toBeDefined()
  })
})
