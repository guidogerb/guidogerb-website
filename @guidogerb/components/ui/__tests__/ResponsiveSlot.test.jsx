import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'

import {
  ResponsiveSlot,
  ResponsiveSlotProvider,
  resolveResponsiveSlotSize,
  useBreakpointKey,
  useResponsiveSlotInstance,
  useResponsiveSlotMeta,
  useResponsiveSlotSize,
} from '../src/ResponsiveSlot/ResponsiveSlot.jsx'
import { EditModeProvider } from '../src/ResponsiveSlot/editing/EditModeContext.jsx'

class MockResizeObserver {
  static instance

  constructor(callback) {
    this.callback = callback
    MockResizeObserver.instance = this
  }

  observe(element) {
    this.element = element
  }

  unobserve() {}

  disconnect() {}

  static trigger() {
    const instance = MockResizeObserver.instance
    if (instance && typeof instance.callback === 'function' && instance.element) {
      instance.callback([{ target: instance.element }])
    }
  }
}

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

    expect(markup).toContain('--slot-inline-size-A:24rem')
    expect(markup).toContain('--slot-inline-size-B:24rem')
    expect(markup).toContain('--slot-inline:24rem')
    expect(markup).toContain('--slot-max-inline-size-A:28rem')
    expect(markup).toContain('--slot-min-inline-size-A:20rem')
    expect(markup).toContain('--slot-max-block-size-A:30rem')
    expect(markup).toContain('--slot-min-block-size-A:22rem')
    expect(markup).toContain('inline-size:var(--slot-inline)')
    expect(markup).toContain('role="presentation"')
    expect(markup).toContain('data-slot-key="catalog.card"')
    expect(markup).toContain('data-slot-label="Catalog Card"')
    expect(markup).toContain('data-slot-default-variant="default"')
    expect(markup).toContain('data-slot-variant-label="Default"')
    expect(markup).toContain('data-slot-tags="commerce,grid"')
    expect(markup).toContain('data-slot-buffer="A"')
    expect(markup).toContain('data-slot-default-breakpoint="lg"')
    expect(markup).toContain('data-slot-breakpoint="lg"')
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
        expect(slot.dataset.slotBuffer).toBe('B')
        expect(slot.style.getPropertyValue('--slot-inline-size-A')).toBe('22rem')
        expect(slot.style.getPropertyValue('--slot-inline-size-B')).toBe('min(100%, 20rem)')
        expect(slot.style.getPropertyValue('--slot-inline')).toBe('min(100%, 20rem)')
        expect(slot.style.getPropertyValue('--slot-block')).toBe('24rem')
        expect(slot.style.getPropertyValue('--slot-max-inline-size-A')).toBe('26rem')
        expect(slot.style.getPropertyValue('--slot-min-inline-size-A')).toBe('18rem')
        expect(slot.style.getPropertyValue('--slot-max-inline-size-B')).toBe('24rem')
        expect(slot.style.getPropertyValue('--slot-min-inline-size-B')).toBe('16rem')
        expect(slot.style.getPropertyValue('--slot-max-block-size-A')).toBe('30rem')
        expect(slot.style.getPropertyValue('--slot-min-block-size-A')).toBe('22rem')
        expect(slot.style.getPropertyValue('--slot-max-block-size-B')).toBe('26rem')
        expect(slot.style.getPropertyValue('--slot-min-block-size-B')).toBe('20rem')
        expect(slot.dataset.slotDefaultVariant).toBe('default')
        expect(slot.dataset.slotVariantLabel).toBe('Default')
        expect(slot.dataset.slotDefaultBreakpoint).toBe('md')
        expect(slot.dataset.slotBreakpoint).toBe('xs')
      })

      act(() => {
        mockMatchMedia.setWidth(1300)
      })

      await waitFor(() => {
        expect(slot.dataset.slotBuffer).toBe('A')
        expect(slot.style.getPropertyValue('--slot-inline-size-A')).toBe('26rem')
        expect(slot.style.getPropertyValue('--slot-inline-size-B')).toBe('min(100%, 20rem)')
        expect(slot.style.getPropertyValue('--slot-inline')).toBe('26rem')
        expect(slot.style.getPropertyValue('--slot-block')).toBe('28rem')
        expect(slot.style.getPropertyValue('--slot-max-inline-size-A')).toBe('30rem')
        expect(slot.style.getPropertyValue('--slot-min-inline-size-A')).toBe('20rem')
        expect(slot.style.getPropertyValue('--slot-max-block-size-A')).toBe('32rem')
        expect(slot.style.getPropertyValue('--slot-min-block-size-A')).toBe('24rem')
        expect(slot.style.getPropertyValue('--slot-max-inline-size-B')).toBe('24rem')
        expect(slot.style.getPropertyValue('--slot-min-inline-size-B')).toBe('16rem')
        expect(slot.style.getPropertyValue('--slot-max-block-size-B')).toBe('26rem')
        expect(slot.style.getPropertyValue('--slot-min-block-size-B')).toBe('20rem')
        expect(slot.dataset.slotBreakpoint).toBe('xl')
      })
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('returns the default breakpoint when matchMedia is unavailable', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = undefined

    function BreakpointProbe() {
      const key = useBreakpointKey()
      return <div data-testid="breakpoint" data-key={key} />
    }

    try {
      render(
        <ResponsiveSlotProvider defaultBreakpoint="lg">
          <BreakpointProbe />
        </ResponsiveSlotProvider>,
      )

      const probe = screen.getByTestId('breakpoint')
      expect(probe.dataset.key).toBe('lg')
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('allows overriding breakpoint descriptors through the provider', async () => {
    const originalMatchMedia = window.matchMedia
    const mockMatchMedia = createMatchMedia(450)
    window.matchMedia = mockMatchMedia

    function BreakpointProbe() {
      const key = useBreakpointKey()
      return <div data-testid="breakpoint" data-key={key} />
    }

    try {
      render(
        <ResponsiveSlotProvider
          defaultBreakpoint="sm"
          breakpoints={[
            { key: 'sm', minWidth: 600 },
            { key: 'lg', minWidth: 900 },
          ]}
        >
          <BreakpointProbe />
        </ResponsiveSlotProvider>,
      )

      const probe = await screen.findByTestId('breakpoint')
      expect(probe.dataset.key).toBe('xs')

      act(() => {
        mockMatchMedia.setWidth(650)
      })
      await waitFor(() => {
        expect(probe.dataset.key).toBe('sm')
      })

      act(() => {
        mockMatchMedia.setWidth(820)
      })
      await waitFor(() => {
        expect(probe.dataset.key).toBe('md')
      })

      act(() => {
        mockMatchMedia.setWidth(940)
      })
      await waitFor(() => {
        expect(probe.dataset.key).toBe('lg')
      })

      act(() => {
        mockMatchMedia.setWidth(1320)
      })
      await waitFor(() => {
        expect(probe.dataset.key).toBe('xl')
      })
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('records buffer flip metrics and performance marks during hydration', async () => {
    const originalMatchMedia = window.matchMedia
    const mockMatchMedia = createMatchMedia(420)
    window.matchMedia = mockMatchMedia

    const performance = window.performance
    const markSpy =
      performance && typeof performance.mark === 'function' ? vi.spyOn(performance, 'mark') : null
    const measureSpy =
      performance && typeof performance.measure === 'function'
        ? vi.spyOn(performance, 'measure')
        : null

    delete window.__GG__

    try {
      render(
        <ResponsiveSlotProvider defaultBreakpoint="md">
          <ResponsiveSlot slot="catalog.card" data-testid="slot-buffer-test">
            <div />
          </ResponsiveSlot>
        </ResponsiveSlotProvider>,
      )

      await waitFor(() => {
        expect(window.__GG__?.responsiveSlot?.bufferFlips ?? 0).toBeGreaterThanOrEqual(1)
      })

      const metrics = window.__GG__?.responsiveSlot
      expect(metrics).toBeDefined()
      expect(metrics.lastFlip?.slot).toBe('catalog.card')
      expect(['A', 'B']).toContain(metrics.lastFlip?.from)
      expect(['A', 'B']).toContain(metrics.lastFlip?.to)
      expect(typeof metrics.lastFlip?.timestamp).toBe('number')

      if (markSpy) {
        expect(markSpy).toHaveBeenCalled()
      }
    } finally {
      if (markSpy) markSpy.mockRestore()
      if (measureSpy) measureSpy.mockRestore()
      window.matchMedia = originalMatchMedia
      delete window.__GG__
    }
  })

  it('renders content-only slots without applying CSS variables', () => {
    render(
      <ResponsiveSlotProvider>
        <ResponsiveSlot slot="catalog.card" sizes="content" data-testid="slot">
          <div>Child</div>
        </ResponsiveSlot>
      </ResponsiveSlotProvider>,
    )

    const slot = screen.getByTestId('slot')
    expect(slot.getAttribute('role')).toBe('presentation')
    expect(slot.style.display).toBe('contents')
    expect(slot.style.getPropertyValue('--slot-inline-size')).toBe('')
    expect(slot.dataset.slotKey).toBe('catalog.card')
    expect(slot.dataset.slotVariant).toBe('default')
  })

  it('exposes responsive size data through the hook with registry overrides', () => {
    function SizeProbe() {
      const size = useResponsiveSlotSize('custom.card', { xl: { inline: 40 } })
      return (
        <div
          data-testid="size"
          data-inline={size.inline}
          data-block={size.block}
          data-max-inline={size.maxInline}
          data-breakpoint={size.breakpoint}
        />
      )
    }

    render(
      <ResponsiveSlotProvider
        defaultBreakpoint="xl"
        registry={{
          'custom.card': {
            sizes: {
              md: { inline: '18rem', block: '20rem' },
              xl: { inline: '26rem', block: 28, maxInline: '30rem' },
              xxl: { inline: 'ignored' },
            },
          },
        }}
      >
        <SizeProbe />
      </ResponsiveSlotProvider>,
    )

    const probe = screen.getByTestId('size')
    expect(probe.dataset.inline).toBe('40px')
    expect(probe.dataset.block).toBe('28px')
    expect(probe.dataset.maxInline).toBe('30rem')
    expect(probe.dataset.breakpoint).toBe('xl')
  })

  it('prefers instance sizing when the hook is used within a rendered slot', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = createMatchMedia(820)

    function SizeProbe() {
      const size = useResponsiveSlotSize('catalog.card')
      return (
        <div data-testid="size" data-inline={size.inline} data-breakpoint={size.breakpoint} />
      )
    }

    try {
      render(
        <ResponsiveSlotProvider defaultBreakpoint="md">
          <ResponsiveSlot
            slot="catalog.card"
            sizes={{ md: { inline: '32rem', block: '30rem' } }}
            data-testid="slot-instance"
          >
            <SizeProbe />
          </ResponsiveSlot>
        </ResponsiveSlotProvider>,
      )

      const probe = await screen.findByTestId('size')
      expect(probe.dataset.inline).toBe('32rem')
      expect(probe.dataset.breakpoint).toBe('md')
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('inherits parent slot sizing when inherit is enabled', () => {
    render(
      <ResponsiveSlotProvider defaultBreakpoint="md">
        <ResponsiveSlot slot="catalog.card" data-testid="parent">
          <ResponsiveSlot slot="nested.slot" inherit data-testid="child">
            <span>Nested</span>
          </ResponsiveSlot>
        </ResponsiveSlot>
      </ResponsiveSlotProvider>,
    )

    const parent = screen.getByTestId('parent')
    const child = screen.getByTestId('child')
    expect(child.style.getPropertyValue('--slot-inline-size')).toBe(
      parent.style.getPropertyValue('--slot-inline-size'),
    )
    expect(child.style.getPropertyValue('--slot-block-size')).toBe(
      parent.style.getPropertyValue('--slot-block-size'),
    )
    expect(child.dataset.slotLabel).toBe(parent.dataset.slotLabel)
    expect(child.dataset.slotDefaultVariant).toBe(parent.dataset.slotDefaultVariant)
    expect(child.dataset.slotVariantLabel).toBe(parent.dataset.slotVariantLabel)
  })

  it('resolves token-based sizes and responds to theme change events', async () => {
    const originalMatchMedia = window.matchMedia
    const mockMatchMedia = createMatchMedia(1100)
    window.matchMedia = mockMatchMedia

    try {
      render(
        <ResponsiveSlotProvider
          tokens={{ 'space-xl': '50px' }}
          registry={{
            'token.slot': {
              sizes: {
                lg: { inline: 'token:space-xl', block: 'token:space-xl' },
              },
            },
          }}
        >
          <ResponsiveSlot slot="token.slot" data-testid="token-slot">
            <div />
          </ResponsiveSlot>
        </ResponsiveSlotProvider>,
      )

      const slot = await screen.findByTestId('token-slot')

      await waitFor(() => {
        expect(slot.style.getPropertyValue('--slot-inline-size')).toBe('50px')
        expect(slot.style.getPropertyValue('--slot-block-size')).toBe('50px')
      })

      act(() => {
        window.dispatchEvent(new CustomEvent('theme:change', { detail: { 'space-xl': '64px' } }))
      })

      await waitFor(() => {
        expect(slot.style.getPropertyValue('--slot-inline-size')).toBe('64px')
        expect(slot.style.getPropertyValue('--slot-block-size')).toBe('64px')
      })
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('merges metadata from registry extends and exposes dataset attributes', () => {
    function MetaProbe() {
      const meta = useResponsiveSlotMeta('feature.card')
      return (
        <div
          data-testid="meta"
          data-label={meta.label}
          data-default-variant={meta.defaultVariant}
          data-variant-count={Object.keys(meta.variants || {}).length}
        />
      )
    }

    render(
      <ResponsiveSlotProvider
        registry={{
          'feature.card': {
            extends: 'catalog.card',
            sizes: {
              md: { inline: '22rem', block: '28rem' },
            },
            meta: {
              label: 'Feature Card',
              description: 'Spotlight on featured items.',
              tags: ['feature'],
              variants: {
                highlight: { label: 'Highlight' },
              },
              defaultVariant: 'highlight',
            },
          },
        }}
      >
        <div>
          <ResponsiveSlot slot="feature.card" variant="highlight" data-testid="slot">
            <div />
          </ResponsiveSlot>
          <MetaProbe />
        </div>
      </ResponsiveSlotProvider>,
    )

    const slot = screen.getByTestId('slot')
    expect(slot.dataset.slotLabel).toBe('Feature Card')
    expect(slot.dataset.slotDescription).toBe('Spotlight on featured items.')
    expect(slot.dataset.slotVariant).toBe('highlight')
    expect(slot.dataset.slotVariantLabel).toBe('Highlight')
    expect(slot.dataset.slotDefaultVariant).toBe('highlight')
    expect(slot.dataset.slotTags).toBe('commerce,grid,feature')
    expect(slot.dataset.designComponent).toBe('Catalog / Card')

    const meta = screen.getByTestId('meta')
    expect(meta.dataset.label).toBe('Feature Card')
    expect(meta.dataset.defaultVariant).toBe('highlight')
    expect(meta.dataset.variantCount).toBe('3')
  })

  it('provides slot instance context with meta and variant', () => {
    function InstanceProbe() {
      const instance = useResponsiveSlotInstance()
      return (
        <div
          data-testid="instance"
          data-slot={instance?.slot || 'none'}
          data-variant={instance?.variant || 'none'}
          data-label={instance?.meta?.label || 'none'}
          data-breakpoint-count={Object.keys(instance?.byBreakpoint || {}).length}
        />
      )
    }

    render(
      <ResponsiveSlotProvider>
        <ResponsiveSlot slot="catalog.card" variant="compact">
          <InstanceProbe />
        </ResponsiveSlot>
      </ResponsiveSlotProvider>,
    )

    const probe = screen.getByTestId('instance')
    expect(probe.dataset.slot).toBe('catalog.card')
    expect(probe.dataset.variant).toBe('compact')
    expect(probe.dataset.label).toBe('Catalog Card')
    expect(Number(probe.dataset.breakpointCount)).toBeGreaterThan(0)
  })

  it('warns when a slot is missing from the registry in development', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      render(
        <ResponsiveSlotProvider>
          <ResponsiveSlot slot="unknown.slot" data-testid="missing">
            <div>Missing</div>
          </ResponsiveSlot>
        </ResponsiveSlotProvider>,
      )

      expect(warnSpy).toHaveBeenCalledWith(
        'ResponsiveSlot: slot "unknown.slot" is not defined in the registry.',
      )
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('resolves sizes via helper with registry overrides and breakpoint fallbacks', () => {
    const size = resolveResponsiveSlotSize({
      slot: 'feature.card',
      breakpoint: 'xl',
      registry: {
        'feature.card': {
          sizes: {
            sm: { inline: '18rem', block: '24rem', maxBlock: '26rem' },
            lg: { inline: '24rem', block: '28rem', maxInline: '28rem', maxBlock: '30rem' },
          },
        },
      },
      overrides: {
        lg: { block: '30rem', minBlock: '20rem', maxBlock: '32rem' },
      },
    })

    expect(size).toMatchObject({
      inline: '24rem',
      block: '30rem',
      maxInline: '28rem',
      maxBlock: '32rem',
      minBlock: '20rem',
    })
  })

  it('warns once when a token cannot be resolved for size values', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      const first = resolveResponsiveSlotSize({
        slot: 'token.slot',
        breakpoint: 'lg',
        registry: {
          'token.slot': {
            sizes: { lg: { inline: 'token:space-xxl', block: 'token:space-xxl' } },
          },
        },
        tokenResolver: () => undefined,
      })

      const second = resolveResponsiveSlotSize({
        slot: 'token.slot',
        breakpoint: 'lg',
        registry: {
          'token.slot': {
            sizes: { lg: { inline: 'token:space-xxl', block: 'token:space-xxl' } },
          },
        },
        tokenResolver: () => undefined,
      })

      expect(first.inline).toBe('var(--space-xxl)')
      expect(second.block).toBe('var(--space-xxl)')
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0][0]).toContain('token "space-xxl" could not be resolved')
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('supports runtime editing with local drafts, publishing, and overflow diagnostics', async () => {
    const originalResizeObserver = window.ResizeObserver
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            data: { upsertSlotInstance: { updatedAt: '2025-09-21T00:00:00.000Z' } },
          }),
      }),
    )

    window.localStorage.clear()
    window.ResizeObserver = MockResizeObserver

    function EditingProbe() {
      const instance = useResponsiveSlotInstance()
      return (
        <div
          data-testid="editing-probe"
          data-variant={instance?.variant || 'none'}
          data-props={JSON.stringify(instance?.props || {})}
        >
          <button
            type="button"
            data-testid="publish-button"
            onClick={() => instance?.editing?.publish()}
          >
            Publish now
          </button>
        </div>
      )
    }

    try {
      render(
        <EditModeProvider initialMode graphqlEndpoint="/graphql" fetcher={fetchMock}>
          <ResponsiveSlotProvider>
            <ResponsiveSlot
              slot="catalog.card"
              editableId="slot-1"
              propsJSON={{ foo: 'bar' }}
              data-testid="slot-element"
            >
              <EditingProbe />
            </ResponsiveSlot>
          </ResponsiveSlotProvider>
        </EditModeProvider>,
      )

      const overlay = await screen.findByTestId('slot-editor-overlay')

      const inlineInput = within(overlay).getByLabelText('Inline')
      fireEvent.change(inlineInput, { target: { value: '30rem' } })

      await waitFor(() => {
        const draft = window.localStorage.getItem('gg:slot:slot-1:v1')
        expect(draft).toContain('30rem')
      })

      const slot = screen.getByTestId('slot-element')
      await waitFor(() => {
        expect(slot.style.getPropertyValue('--slot-inline-size')).toBe('30rem')
      })

      const variantSelect = within(overlay).getByLabelText('Variant')
      fireEvent.change(variantSelect, { target: { value: 'compact' } })

      await waitFor(() => {
        expect(slot.dataset.slotVariant).toBe('compact')
        expect(screen.getByTestId('editing-probe').dataset.variant).toBe('compact')
      })

      const propsTextarea = within(overlay).getByLabelText('Props JSON')
      fireEvent.change(propsTextarea, { target: { value: '{"foo":"baz"}' } })

      await waitFor(() => {
        expect(screen.getByTestId('editing-probe').dataset.props).toBe('{"foo":"baz"}')
      })

      await waitFor(() => {
        expect(MockResizeObserver.instance?.element).toBe(slot)
      })

      Object.defineProperty(slot, 'scrollWidth', { value: 400, configurable: true })
      Object.defineProperty(slot, 'clientWidth', { value: 200, configurable: true })
      Object.defineProperty(slot, 'scrollHeight', { value: 280, configurable: true })
      Object.defineProperty(slot, 'clientHeight', { value: 200, configurable: true })

      await act(async () => {
        MockResizeObserver.trigger()
      })

      await waitFor(() => {
        expect(within(overlay).getByText(/Overflow events/)).toBeInTheDocument()
      })

      delete slot.scrollWidth
      delete slot.clientWidth
      delete slot.scrollHeight
      delete slot.clientHeight

      fireEvent.click(screen.getByTestId('publish-button'))

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
      await waitFor(() => {
        expect(window.localStorage.getItem('gg:slot:slot-1:v1')).toBeNull()
      })

      expect(fetchMock).toHaveBeenCalledWith(
        '/graphql',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      )
    } finally {
      window.ResizeObserver = originalResizeObserver
      warnSpy.mockRestore()
      window.localStorage.clear()
      MockResizeObserver.instance = null
    }
  })
})
