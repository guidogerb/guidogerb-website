import { render, screen, waitFor } from '@testing-library/react'

import {
  GuidoGerbUI_Container,
  ResponsiveSlotProvider,
} from '../src/responsive-slot/index.js'

describe('GuidoGerbUI_Container', () => {
  it('respects custom element rendering and default role', () => {
    render(
      <ResponsiveSlotProvider>
        <GuidoGerbUI_Container slot="catalog.card" as="section" data-testid="container">
          <span>Content</span>
        </GuidoGerbUI_Container>
      </ResponsiveSlotProvider>,
    )

    const element = screen.getByTestId('container')
    expect(element.tagName).toBe('SECTION')
    expect(element).toHaveAttribute('role', 'presentation')
    expect(element.dataset.slotKey).toBe('catalog.card')
  })

  it('applies overflow and min/max overrides to the CSS variable contract', async () => {
    render(
      <ResponsiveSlotProvider defaultBreakpoint="md">
        <GuidoGerbUI_Container
          slot="catalog.card"
          data-testid="sized"
          overflow="visible"
          sizes={{
            md: {
              inline: '30rem',
              block: '28rem',
              maxInline: '32rem',
              maxBlock: '34rem',
              minInline: '24rem',
              minBlock: '20rem',
            },
          }}
        />
      </ResponsiveSlotProvider>,
    )

    const element = await screen.findByTestId('sized')

    await waitFor(() => {
      expect(element.style.getPropertyValue('--slot-inline')).toBe('30rem')
      expect(element.style.getPropertyValue('--slot-max-inline')).toBe('32rem')
      expect(element.style.getPropertyValue('--slot-min-inline')).toBe('24rem')
      expect(element.style.getPropertyValue('--slot-block')).toBe('28rem')
      expect(element.style.getPropertyValue('--slot-max-block')).toBe('34rem')
      expect(element.style.getPropertyValue('--slot-min-block')).toBe('20rem')
    })

    expect(element.style.overflow).toBe('visible')
  })

  it('inherits resolved sizes from parent containers when inherit is true', async () => {
    render(
      <ResponsiveSlotProvider defaultBreakpoint="lg">
        <GuidoGerbUI_Container
          slot="catalog.card"
          data-testid="parent"
          sizes={{ lg: { inline: '36rem', block: '30rem' } }}
        >
          <GuidoGerbUI_Container slot="catalog.card" inherit data-testid="child" />
        </GuidoGerbUI_Container>
      </ResponsiveSlotProvider>,
    )

    const parent = await screen.findByTestId('parent')
    const child = await screen.findByTestId('child')

    await waitFor(() => {
      expect(child.style.getPropertyValue('--slot-inline')).toBe(
        parent.style.getPropertyValue('--slot-inline'),
      )
      expect(child.style.getPropertyValue('--slot-block')).toBe(
        parent.style.getPropertyValue('--slot-block'),
      )
    })
  })
})

