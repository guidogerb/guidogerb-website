import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

const BREAKPOINT_ORDER = ['xs', 'sm', 'md', 'lg', 'xl']

const BREAKPOINT_QUERIES = {
  xs: '(max-width: 479px)',
  sm: '(min-width: 480px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
}

export const responsiveSlotBreakpoints = BREAKPOINT_ORDER.map((key) => ({
  key,
  query: BREAKPOINT_QUERIES[key],
}))

export const baseResponsiveSlots = {
  'catalog.card': {
    sizes: {
      xs: { inline: 'min(100%, 20rem)', block: '24rem' },
      sm: { inline: '20rem', block: '24rem' },
      md: { inline: '22rem', block: '26rem' },
      lg: { inline: '24rem', block: '26rem' },
    },
    meta: {
      label: 'Catalog Card',
      description: 'Product tile used in merchandising grids and featured carousels.',
      design: {
        figmaComponent: 'Catalog / Card',
        figmaNodeId: '0:1',
      },
      variants: {
        default: { label: 'Default' },
        compact: { label: 'Compact' },
      },
      tags: ['commerce', 'grid'],
      defaultVariant: 'default',
    },
  },
  'dashboard.panel': {
    sizes: {
      xs: { inline: 'min(100%, 100vw)', block: '18rem' },
      md: { inline: '32rem', block: '20rem' },
      lg: { inline: '36rem', block: '22rem' },
    },
    meta: {
      label: 'Dashboard Panel',
      description: 'Analytics cards and control panels across tenant dashboards.',
      design: {
        figmaComponent: 'Dashboard / Panel',
        figmaNodeId: '0:2',
      },
      variants: {
        default: { label: 'Default' },
        tall: { label: 'Tall' },
      },
      defaultVariant: 'default',
    },
  },
  'hero.banner': {
    sizes: {
      xs: { inline: '100%', block: '28rem' },
      md: { inline: '100%', block: '32rem' },
      xl: { inline: '100%', block: '36rem' },
    },
    meta: {
      label: 'Hero Banner',
      description: 'Full width marquee used on landing pages and marketing campaigns.',
      design: {
        figmaComponent: 'Marketing / Hero Banner',
        figmaNodeId: '0:3',
      },
      defaultVariant: 'default',
    },
  },
  'list.row': {
    sizes: {
      xs: { inline: '100%', block: 'auto' },
      md: { inline: '100%', block: '5rem' },
    },
    meta: {
      label: 'List Row',
      description: 'Row container for list-based layouts and checkout summaries.',
      design: {
        figmaComponent: 'Commerce / List Row',
        figmaNodeId: '0:4',
      },
      defaultVariant: 'default',
    },
  },
}

const ResponsiveSlotContext = createContext(null)

const SlotInstanceContext = createContext(null)

const DEFAULT_FALLBACK_SIZE = {
  inline: 'auto',
  block: 'auto',
  maxInline: 'none',
  maxBlock: 'none',
  minInline: 'auto',
  minBlock: 'auto',
}

const ALLOWED_BREAKPOINTS = new Set(BREAKPOINT_ORDER)

const overflowWarningCache = new Set()
let resizeObserverSingleton
const resizeObserverCallbacks = new Map()

function getResizeObserver() {
  if (resizeObserverSingleton) return resizeObserverSingleton

  if (typeof window === 'undefined' || typeof window.ResizeObserver === 'undefined') {
    return null
  }

  resizeObserverSingleton = new window.ResizeObserver((entries) => {
    for (const entry of entries) {
      const callback = resizeObserverCallbacks.get(entry.target)
      if (callback) {
        callback(entry)
      }
    }
  })

  return resizeObserverSingleton
}

function observeOverflow(element, callback) {
  const observer = getResizeObserver()
  if (!observer || !element) return () => {}

  resizeObserverCallbacks.set(element, callback)
  observer.observe(element)

  return () => {
    resizeObserverCallbacks.delete(element)
    observer.unobserve(element)
  }
}

function normalizeBreakpointKey(key, fallback = 'md') {
  if (typeof key === 'string' && ALLOWED_BREAKPOINTS.has(key)) {
    return key
  }
  return fallback
}

function toCssUnit(value, defaultValue) {
  if (value == null) return defaultValue
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}

function resolveSizeValue(raw, defaultValue, resolver) {
  if (raw == null) return defaultValue
  if (typeof raw === 'string') {
    if (raw.startsWith('token:')) {
      const tokenName = raw.slice('token:'.length)
      const resolved = resolver ? resolver(tokenName) : undefined
      if (resolved == null) {
        return `var(--${tokenName})`
      }
      return toCssUnit(resolved, defaultValue)
    }
    if (raw.startsWith('var(')) {
      return raw
    }
  }
  return toCssUnit(raw, defaultValue)
}

function normalizeSlotSizeMap(value, resolver) {
  if (!value) {
    return DEFAULT_FALLBACK_SIZE
  }

  return {
    inline: resolveSizeValue(value.inline, DEFAULT_FALLBACK_SIZE.inline, resolver),
    block: resolveSizeValue(value.block, DEFAULT_FALLBACK_SIZE.block, resolver),
    maxInline: resolveSizeValue(value.maxInline, DEFAULT_FALLBACK_SIZE.maxInline, resolver),
    maxBlock: resolveSizeValue(value.maxBlock, DEFAULT_FALLBACK_SIZE.maxBlock, resolver),
    minInline: resolveSizeValue(value.minInline, DEFAULT_FALLBACK_SIZE.minInline, resolver),
    minBlock: resolveSizeValue(value.minBlock, DEFAULT_FALLBACK_SIZE.minBlock, resolver),
  }
}

function normalizeSlotDefinition(entry) {
  if (!entry) {
    return { sizes: {}, meta: {}, extends: undefined }
  }

  if (entry.sizes || entry.meta || entry.extends) {
    return {
      sizes: entry.sizes ? { ...entry.sizes } : {},
      meta: entry.meta ? { ...entry.meta } : {},
      extends: entry.extends,
    }
  }

  return { sizes: entry, meta: {}, extends: undefined }
}

function mergeMeta(base = {}, overrides = {}) {
  const merged = { ...base, ...overrides }

  if (base.variants || overrides.variants) {
    merged.variants = { ...(base.variants || {}), ...(overrides.variants || {}) }
  }

  if (base.design || overrides.design) {
    merged.design = { ...(base.design || {}), ...(overrides.design || {}) }
  }

  if (base.tags || overrides.tags) {
    const baseTags = Array.isArray(base.tags) ? base.tags : base.tags ? [base.tags] : []
    const overrideTags = Array.isArray(overrides.tags)
      ? overrides.tags
      : overrides.tags
        ? [overrides.tags]
        : []
    merged.tags = Array.from(new Set([...baseTags, ...overrideTags]))
  }

  if (base.defaultVariant && !merged.defaultVariant) {
    merged.defaultVariant = base.defaultVariant
  }

  return merged
}

function mergeSlotRegistry(base = {}, overrides = {}) {
  const normalizedBase = {}
  for (const [slot, entry] of Object.entries(base || {})) {
    normalizedBase[slot] = normalizeSlotDefinition(entry)
  }

  const normalizedOverrides = {}
  for (const [slot, entry] of Object.entries(overrides || {})) {
    normalizedOverrides[slot] = normalizeSlotDefinition(entry)
  }

  const resolved = {}

  const resolveSlot = (slot) => {
    if (resolved[slot]) return resolved[slot]

    const baseEntry = normalizedBase[slot] || { sizes: {}, meta: {}, extends: undefined }
    let definition = {
      sizes: { ...baseEntry.sizes },
      meta: { ...baseEntry.meta },
    }

    if (baseEntry.extends && baseEntry.extends !== slot) {
      const parent = resolveSlot(baseEntry.extends)
      if (parent) {
        definition = {
          sizes: { ...parent.sizes, ...definition.sizes },
          meta: mergeMeta(parent.meta, definition.meta),
        }
      }
    }

    const overrideEntry = normalizedOverrides[slot]
    if (overrideEntry) {
      let mergedBase = definition
      if (overrideEntry.extends && overrideEntry.extends !== slot) {
        const parent = resolved[overrideEntry.extends] || resolveSlot(overrideEntry.extends)
        if (parent) {
          mergedBase = {
            sizes: { ...parent.sizes, ...mergedBase.sizes },
            meta: mergeMeta(parent.meta, mergedBase.meta),
          }
        }
      }

      definition = {
        sizes: { ...mergedBase.sizes, ...overrideEntry.sizes },
        meta: mergeMeta(mergedBase.meta, overrideEntry.meta),
      }
    }

    resolved[slot] = definition
    return definition
  }

  const allSlots = new Set([...Object.keys(normalizedBase), ...Object.keys(normalizedOverrides)])
  for (const slot of allSlots) {
    resolveSlot(slot)
  }

  return resolved
}

function mergeSlotSizes(base = {}, overrides = {}, resolver) {
  const merged = {}
  const keys = new Set([...Object.keys(base || {}), ...Object.keys(overrides || {})])

  for (const key of keys) {
    if (!ALLOWED_BREAKPOINTS.has(key)) continue

    const baseEntry = base?.[key]
    const overrideEntry = overrides?.[key]

    if (!baseEntry && !overrideEntry) continue

    merged[key] = normalizeSlotSizeMap(
      {
        ...(baseEntry || {}),
        ...(overrideEntry || {}),
      },
      resolver,
    )
  }

  return merged
}

function resolveBreakpointSize(breakpoint, map) {
  const targetIndex = BREAKPOINT_ORDER.indexOf(breakpoint)
  if (targetIndex === -1) {
    return DEFAULT_FALLBACK_SIZE
  }

  for (let index = targetIndex; index >= 0; index -= 1) {
    const key = BREAKPOINT_ORDER[index]
    if (map[key]) {
      return map[key]
    }
  }

  for (let index = targetIndex + 1; index < BREAKPOINT_ORDER.length; index += 1) {
    const key = BREAKPOINT_ORDER[index]
    if (map[key]) {
      return map[key]
    }
  }

  return DEFAULT_FALLBACK_SIZE
}

function useActiveBreakpoint(defaultBreakpoint) {
  const [active, setActive] = useState(defaultBreakpoint)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mqls = responsiveSlotBreakpoints.map(({ key, query }) => ({
      key,
      mql: window.matchMedia(query),
    }))

    function update() {
      setActive((current) => {
        let next = defaultBreakpoint
        for (const { key, mql } of mqls) {
          if (mql.matches) {
            next = key
          }
        }
        return next === current ? current : next
      })
    }

    update()

    for (const { mql } of mqls) {
      const handler = () => update()
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handler)
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(handler)
      }

      ;(mql.__responsiveSlotCleanupHandlers || (mql.__responsiveSlotCleanupHandlers = [])).push(
        handler,
      )
    }

    return () => {
      for (const { mql } of mqls) {
        const handlers = mql.__responsiveSlotCleanupHandlers || []
        for (const handler of handlers) {
          if (typeof mql.removeEventListener === 'function') {
            mql.removeEventListener('change', handler)
          } else if (typeof mql.removeListener === 'function') {
            mql.removeListener(handler)
          }
        }
        mql.__responsiveSlotCleanupHandlers = []
      }
    }
  }, [defaultBreakpoint])

  return active
}

export function ResponsiveSlotProvider({
  registry,
  defaultBreakpoint = 'md',
  children,
  tokens,
  resolveToken,
}) {
  const fallbackBreakpoint = normalizeBreakpointKey(defaultBreakpoint)

  const [tokenSnapshot, setTokenSnapshot] = useState(() => (tokens ? { ...tokens } : null))

  useEffect(() => {
    setTokenSnapshot(tokens ? { ...tokens } : null)
  }, [tokens])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handler = (event) => {
      const detail = event?.detail
      if (detail && typeof detail === 'object') {
        setTokenSnapshot((prev) => ({ ...(prev || {}), ...detail }))
      }
    }
    window.addEventListener('theme:change', handler)
    return () => window.removeEventListener('theme:change', handler)
  }, [])

  const tokenResolver = useMemo(() => {
    if (typeof resolveToken === 'function') {
      return resolveToken
    }
    const snapshot = tokenSnapshot ?? {}
    return (name) => snapshot?.[name]
  }, [resolveToken, tokenSnapshot])

  const mergedRegistry = useMemo(
    () => mergeSlotRegistry(baseResponsiveSlots, registry),
    [registry],
  )

  const activeBreakpoint = useActiveBreakpoint(fallbackBreakpoint)

  const value = useMemo(
    () => ({
      registry: mergedRegistry,
      breakpoints: responsiveSlotBreakpoints,
      activeBreakpoint,
      defaultBreakpoint: fallbackBreakpoint,
      resolveToken: tokenResolver,
    }),
    [mergedRegistry, activeBreakpoint, fallbackBreakpoint, tokenResolver],
  )

  return <ResponsiveSlotContext.Provider value={value}>{children}</ResponsiveSlotContext.Provider>
}

function useResponsiveSlotContext() {
  const context = useContext(ResponsiveSlotContext)
  if (!context) {
    throw new Error('ResponsiveSlot components must be used within a ResponsiveSlotProvider')
  }
  return context
}

export function useResponsiveSlotSize(slot, overrides) {
  const { registry, activeBreakpoint, resolveToken: tokenResolver } = useResponsiveSlotContext()

  const definition = registry?.[slot]
  const baseSizes = definition?.sizes ?? (definition && !definition.sizes ? definition : {})
  const normalizedOverrides = overrides === 'content' ? {} : overrides

  const merged = useMemo(
    () => mergeSlotSizes(baseSizes || {}, normalizedOverrides || {}, tokenResolver),
    [baseSizes, normalizedOverrides, tokenResolver],
  )

  return useMemo(() => {
    const resolved = resolveBreakpointSize(activeBreakpoint, merged)
    return {
      inline: resolved.inline,
      block: resolved.block,
      maxInline: resolved.maxInline,
      maxBlock: resolved.maxBlock,
      minInline: resolved.minInline,
      minBlock: resolved.minBlock,
      breakpoint: activeBreakpoint,
    }
  }, [activeBreakpoint, merged])
}

export function useResponsiveSlotMeta(slot) {
  const { registry } = useResponsiveSlotContext()

  return useMemo(() => {
    const definition = registry?.[slot]
    const meta = definition?.meta
    return meta ? { ...meta } : {}
  }, [registry, slot])
}

export function useResponsiveSlotInstance() {
  return useContext(SlotInstanceContext)
}

export function ResponsiveSlot({
  as: Component = 'div',
  slot,
  sizes,
  inherit = false,
  overflow = 'hidden auto',
  style,
  role,
  variant,
  children,
  ...rest
}) {
  const { registry, activeBreakpoint, resolveToken: tokenResolver } = useResponsiveSlotContext()
  const parentContext = useContext(SlotInstanceContext)
  const slotRef = useRef(null)

  const isContentOnly = sizes === 'content'

  const definition = registry?.[slot]
  const definitionMeta = definition?.meta
  const inheritedMeta = inherit && parentContext?.meta ? parentContext.meta : undefined
  const meta = useMemo(() => mergeMeta(inheritedMeta, definitionMeta), [inheritedMeta, definitionMeta])
  const defaultVariant = meta.defaultVariant || 'default'
  const variantName = variant ?? defaultVariant

  const baseSizes = inherit && parentContext?.byBreakpoint
    ? parentContext.byBreakpoint
    : definition?.sizes ?? (definition && !definition.sizes ? definition : undefined)

  const mergedSizes = useMemo(() => {
    if (isContentOnly) return null
    if (!baseSizes && process.env.NODE_ENV !== 'production') {
      console.warn(`ResponsiveSlot: slot "${slot}" is not defined in the registry.`)
    }
    return mergeSlotSizes(baseSizes || {}, sizes === 'content' ? {} : sizes, tokenResolver)
  }, [baseSizes, sizes, isContentOnly, slot, tokenResolver])

  const resolvedSize = mergedSizes
    ? resolveBreakpointSize(activeBreakpoint, mergedSizes)
    : DEFAULT_FALLBACK_SIZE

  const cssVariables = mergedSizes
    ? {
        '--slot-inline-size': resolvedSize.inline,
        '--slot-block-size': resolvedSize.block,
        '--slot-max-inline-size': resolvedSize.maxInline,
        '--slot-max-block-size': resolvedSize.maxBlock,
        '--slot-min-inline-size': resolvedSize.minInline,
        '--slot-min-block-size': resolvedSize.minBlock,
      }
    : {}

  const slotStyle = mergedSizes
    ? {
        inlineSize: 'var(--slot-inline-size)',
        blockSize: 'var(--slot-block-size)',
        maxInlineSize: 'var(--slot-max-inline-size)',
        maxBlockSize: 'var(--slot-max-block-size)',
        minInlineSize: 'var(--slot-min-inline-size)',
        minBlockSize: 'var(--slot-min-block-size)',
        contain: 'layout paint style',
        display: 'grid',
        placeItems: 'stretch',
        overflow,
      }
    : { display: 'contents' }

  const datasetProps = {
    'data-slot-key': slot,
    'data-slot-variant': variantName,
  }
  datasetProps['data-slot-default-variant'] = defaultVariant
  if (meta?.label) datasetProps['data-slot-label'] = meta.label
  if (meta?.description) datasetProps['data-slot-description'] = meta.description
  if (meta?.design?.figmaComponent) datasetProps['data-design-component'] = meta.design.figmaComponent
  if (meta?.design?.figmaNodeId) datasetProps['data-design-node'] = meta.design.figmaNodeId
  if (meta?.design?.figmaUrl) datasetProps['data-design-url'] = meta.design.figmaUrl
  if (meta?.tags) {
    const tags = Array.isArray(meta.tags) ? meta.tags.join(',') : meta.tags
    datasetProps['data-slot-tags'] = tags
  }
  const variantMeta = meta?.variants?.[variantName]
  if (variantMeta?.label) {
    datasetProps['data-slot-variant-label'] = variantMeta.label
  }

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return undefined
    if (isContentOnly) return undefined
    if (typeof window === 'undefined') return undefined

    const element = slotRef.current
    if (!element) return undefined

    return observeOverflow(element, () => {
      const hasInlineOverflow = element.scrollWidth - element.clientWidth > 1
      const hasBlockOverflow = element.scrollHeight - element.clientHeight > 1

      if (!hasInlineOverflow && !hasBlockOverflow) {
        return
      }

      const warningKey = `${slot}:${activeBreakpoint}`
      if (overflowWarningCache.has(warningKey)) {
        return
      }

      overflowWarningCache.add(warningKey)

      console.warn(
        `ResponsiveSlot: content overflow detected for slot "${slot}" at breakpoint "${activeBreakpoint}".`,
        {
          inlineBudget: element.style.getPropertyValue('--slot-inline-size') || resolvedSize.inline,
          blockBudget: element.style.getPropertyValue('--slot-block-size') || resolvedSize.block,
        },
      )
    })
  }, [isContentOnly, slot, activeBreakpoint, resolvedSize])

  if (isContentOnly) {
    return (
      <Component
        {...rest}
        {...datasetProps}
        role={role ?? 'presentation'}
        style={{
          ...(style || {}),
          display: 'contents',
        }}
      >
        {children}
      </Component>
    )
  }

  const element = (
    <Component
      {...rest}
      ref={slotRef}
      role={role ?? 'presentation'}
      {...datasetProps}
      style={{
        ...cssVariables,
        ...slotStyle,
        ...(style || {}),
      }}
    >
      {children}
    </Component>
  )

  const contextValue = useMemo(
    () => ({
      slot,
      byBreakpoint: mergedSizes || {},
      meta,
      variant: variantName,
    }),
    [slot, mergedSizes, meta, variantName],
  )

  return <SlotInstanceContext.Provider value={contextValue}>{element}</SlotInstanceContext.Provider>
}
