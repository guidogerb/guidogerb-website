import { describe, it, expectTypeOf, expect } from 'vitest'

import { responsiveSlotBreakpoints, baseResponsiveSlots } from '../src/responsive-slot/index.js'
import type {
  BreakpointKey,
  SlotSizeMap,
  SlotSizeOverrides,
  Registry,
  GuidoGerbUI_ContainerProps,
  ResponsiveSlotSize,
} from '../src/responsive-slot'

describe('responsive-slot type definitions', () => {
  it('exposes the expected breakpoint union and responsive size type', () => {
    const keys = responsiveSlotBreakpoints.map((entry) => entry.key)
    expectTypeOf(keys[0]).toMatchTypeOf<BreakpointKey>()

    expectTypeOf<ResponsiveSlotSize>().toMatchTypeOf<{
      inline: string
      block: string
      breakpoint: BreakpointKey
    }>()
  })

  it('allows authoring registries with typed slot size maps', () => {
    const overrides: SlotSizeOverrides = {
      md: { inline: '20rem', block: 320 },
      xl: { maxInline: 'token:space-4' },
    }

    const registry: Registry = {
      'custom.slot': {
        sizes: overrides,
        meta: { label: 'Custom Slot' },
      },
    }

    expect(baseResponsiveSlots['catalog.card']).toBeDefined()
    expect(registry['custom.slot']).toBeDefined()
  })

  it('supports polymorphic container props with required slot key', () => {
    const props: GuidoGerbUI_ContainerProps<'section'> = {
      as: 'section',
      slot: 'catalog.card',
      sizes: {
        md: { inline: '30rem', block: '28rem' } satisfies SlotSizeMap,
      },
    }

    expect(props.slot).toBe('catalog.card')
  })
})
