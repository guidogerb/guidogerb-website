import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { SlotEditorOverlay } from './editing/SlotEditorOverlay.jsx'
import { useSlotEditing } from './editing/useSlotEditing.js'

const BREAKPOINT_ORDER = ['xs', 'sm', 'md', 'lg', 'xl']

const BREAKPOINT_QUERIES = {
  xs: '(max-width: 479px)',
  sm: '(min-width: 480px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
}

function createDefaultBreakpoints() {
  return BREAKPOINT_ORDER.map((key) => ({
    key,
    query: BREAKPOINT_QUERIES[key],
  }))
}

export const responsiveSlotBreakpoints = createDefaultBreakpoints()

export const baseResponsiveSlots = {
  'catalog.card': {
    sizes: {
      xs: {
        inline: 'min(100%, 20rem)',
        block: '24rem',
        maxInline: '24rem',
        maxBlock: '26rem',
        minInline: '16rem',
        minBlock: '20rem',
      },
      sm: {
        inline: '20rem',
        block: '24rem',
        maxInline: '24rem',
        maxBlock: '26rem',
        minInline: '18rem',
        minBlock: '20rem',
      },
      md: {
        inline: '22rem',
        block: '26rem',
        maxInline: '26rem',
        maxBlock: '30rem',
        minInline: '18rem',
        minBlock: '22rem',
      },
      lg: {
        inline: '24rem',
        block: '26rem',
        maxInline: '28rem',
        maxBlock: '30rem',
        minInline: '20rem',
        minBlock: '22rem',
      },
      xl: {
        inline: '26rem',
        block: '28rem',
        maxInline: '30rem',
        maxBlock: '32rem',
        minInline: '20rem',
        minBlock: '24rem',
      },
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
      xs: {
        inline: 'min(100%, 100vw)',
        block: '18rem',
        maxInline: '100%',
        maxBlock: '22rem',
        minInline: '18rem',
        minBlock: '16rem',
      },
      sm: {
        inline: '24rem',
        block: '19rem',
        maxInline: '28rem',
        maxBlock: '23rem',
        minInline: '20rem',
        minBlock: '17rem',
      },
      md: {
        inline: '32rem',
        block: '20rem',
        maxInline: '36rem',
        maxBlock: '24rem',
        minInline: '24rem',
        minBlock: '18rem',
      },
      lg: {
        inline: '36rem',
        block: '22rem',
        maxInline: '40rem',
        maxBlock: '26rem',
        minInline: '28rem',
        minBlock: '20rem',
      },
      xl: {
        inline: '40rem',
        block: '24rem',
        maxInline: '44rem',
        maxBlock: '28rem',
        minInline: '30rem',
        minBlock: '22rem',
      },
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
      xs: {
        inline: '100%',
        block: '28rem',
        maxBlock: '32rem',
        minBlock: '24rem',
      },
      sm: {
        inline: '100%',
        block: '30rem',
        maxBlock: '34rem',
        minBlock: '26rem',
      },
      md: {
        inline: '100%',
        block: '32rem',
        maxBlock: '36rem',
        minBlock: '28rem',
      },
      lg: {
        inline: '100%',
        block: '34rem',
        maxBlock: '38rem',
        minBlock: '30rem',
      },
      xl: {
        inline: '100%',
        block: '36rem',
        maxBlock: '40rem',
        minBlock: '32rem',
      },
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
      xs: {
        inline: '100%',
        block: 'auto',
        minBlock: '3rem',
      },
      sm: {
        inline: '100%',
        block: '4.5rem',
        maxBlock: '5.5rem',
        minBlock: '3rem',
      },
      md: {
        inline: '100%',
        block: '5rem',
        maxBlock: '6rem',
        minBlock: '3rem',
      },
      lg: {
        inline: '100%',
        block: '5.5rem',
        maxBlock: '6.5rem',
        minBlock: '3rem',
      },
      xl: {
        inline: '100%',
        block: '6rem',
        maxBlock: '7rem',
        minBlock: '3rem',
      },
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

function normalizeCustomBreakpointDescriptor(entry) {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const { key } = entry
  if (typeof key !== 'string' || !ALLOWED_BREAKPOINTS.has(key)) {
    return null
  }

  const queryCandidates = [entry.query, entry.media]
  for (const candidate of queryCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return { key, query: candidate.trim() }
    }
  }

  if (typeof entry.minWidth === 'number' && Number.isFinite(entry.minWidth)) {
    return { key, query: `(min-width: ${entry.minWidth}px)` }
  }

  if (typeof entry.maxWidth === 'number' && Number.isFinite(entry.maxWidth)) {
    return { key, query: `(max-width: ${entry.maxWidth}px)` }
  }

  return null
}

function normalizeBreakpoints(customBreakpoints) {
  const baseline = {}
  for (const descriptor of createDefaultBreakpoints()) {
    baseline[descriptor.key] = { ...descriptor }
  }

  if (Array.isArray(customBreakpoints)) {
    for (const entry of customBreakpoints) {
      const normalized = normalizeCustomBreakpointDescriptor(entry)
      if (normalized) {
        baseline[normalized.key] = normalized
      }
    }
  }

  return BREAKPOINT_ORDER.map((key) => baseline[key]).filter(Boolean)
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
const BUFFER_PHASES = ['A', 'B']
const BUFFER_TOGGLE = { A: 'B', B: 'A' }

const overflowWarningCache = new Set()
const missingTokenWarnings = new Set()

function warnMissingToken(tokenName) {
  if (process.env.NODE_ENV === 'production') return
  if (!tokenName) return
  if (missingTokenWarnings.has(tokenName)) return

  missingTokenWarnings.add(tokenName)
  console.warn(
    `ResponsiveSlot: token "${tokenName}" could not be resolved. Falling back to CSS variable reference.`,
  )
}
let resizeObserverSingleton
const resizeObserverCallbacks = new Map()

function cloneSizeMap(size) {
  const source = size || DEFAULT_FALLBACK_SIZE
  return {
    inline: source.inline ?? DEFAULT_FALLBACK_SIZE.inline,
    block: source.block ?? DEFAULT_FALLBACK_SIZE.block,
    maxInline: source.maxInline ?? DEFAULT_FALLBACK_SIZE.maxInline,
    maxBlock: source.maxBlock ?? DEFAULT_FALLBACK_SIZE.maxBlock,
    minInline: source.minInline ?? DEFAULT_FALLBACK_SIZE.minInline,
    minBlock: source.minBlock ?? DEFAULT_FALLBACK_SIZE.minBlock,
  }
}

function sizesEqual(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.inline === b.inline &&
    a.block === b.block &&
    a.maxInline === b.maxInline &&
    a.maxBlock === b.maxBlock &&
    a.minInline === b.minInline &&
    a.minBlock === b.minBlock
  )
}

function recordBufferFlip(slotKey, fromPhase, toPhase) {
  if (process.env.NODE_ENV === 'production') return
  if (typeof window === 'undefined') return

  const global = window
  const namespace = (global.__GG__ = global.__GG__ || {})
  const metrics = (namespace.responsiveSlot = namespace.responsiveSlot || {
    bufferFlips: 0,
    lastFlip: null,
  })

  metrics.bufferFlips += 1
  metrics.lastFlip = {
    slot: slotKey,
    from: fromPhase,
    to: toPhase,
    timestamp: Date.now(),
  }

  const perf = global.performance
  if (!perf || typeof perf.mark !== 'function') {
    return
  }

  const baseName = `gg:slot:${slotKey}:buffer-flip`

  try {
    perf.mark(`${baseName}:start`)
  } catch (error) {
    // Ignore browsers that do not support performance marks or duplicate mark errors.
  }

  const finalize = () => {
    try {
      perf.mark(`${baseName}:end`)
      if (typeof perf.measure === 'function') {
        try {
          perf.measure(`${baseName}`, `${baseName}:start`, `${baseName}:end`)
        } catch (measureError) {
          // Ignore measure errors caused by missing marks or unsupported browsers.
        }
      }
    } catch (error) {
      // Swallow end mark errors so diagnostics never break rendering.
    } finally {
      if (typeof perf.clearMarks === 'function') {
        try {
          perf.clearMarks(`${baseName}:start`)
          perf.clearMarks(`${baseName}:end`)
        } catch (clearMarkError) {
          // Ignore failures when marks are already cleared.
        }
      }
      if (typeof perf.clearMeasures === 'function') {
        try {
          perf.clearMeasures(`${baseName}`)
        } catch (clearMeasureError) {
          // Ignore unsupported clearMeasures implementations.
        }
      }
    }
  }

  if (typeof global.requestAnimationFrame === 'function') {
    global.requestAnimationFrame(() => finalize())
  } else {
    setTimeout(finalize, 0)
  }
}

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
        warnMissingToken(tokenName)
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

function useActiveBreakpoint(defaultBreakpoint, descriptors) {
  const fallback = normalizeBreakpointKey(defaultBreakpoint)
  const [active, setActive] = useState(fallback)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setActive(fallback)
      return undefined
    }

    const resolvedDescriptors =
      Array.isArray(descriptors) && descriptors.length > 0 ? descriptors : responsiveSlotBreakpoints

    const entries = resolvedDescriptors
      .map(({ key, query }) => {
        if (typeof query !== 'string' || !query) return null
        return { key, mql: window.matchMedia(query) }
      })
      .filter(Boolean)

    if (entries.length === 0) {
      setActive(fallback)
      return undefined
    }

    const update = () => {
      setActive((current) => {
        let next = fallback
        for (const { key, mql } of entries) {
          if (mql.matches) {
            next = key
          }
        }
        return next === current ? current : next
      })
    }

    update()

    for (const { mql } of entries) {
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
      for (const { mql } of entries) {
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
  }, [descriptors, fallback])

  useEffect(() => {
    setActive((current) => normalizeBreakpointKey(current, fallback))
  }, [fallback])

  return active
}

export function ResponsiveSlotProvider({
  registry,
  breakpoints,
  defaultBreakpoint = 'md',
  children,
  tokens,
  resolveToken,
}) {
  const fallbackBreakpoint = normalizeBreakpointKey(defaultBreakpoint)
  const breakpointsSignature = useMemo(() => JSON.stringify(breakpoints ?? []), [breakpoints])
  const normalizedBreakpoints = useMemo(
    () => normalizeBreakpoints(breakpoints),
    [breakpointsSignature],
  )

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

  const mergedRegistry = useMemo(() => mergeSlotRegistry(baseResponsiveSlots, registry), [registry])

  const activeBreakpoint = useActiveBreakpoint(fallbackBreakpoint, normalizedBreakpoints)

  const value = useMemo(
    () => ({
      registry: mergedRegistry,
      breakpoints: normalizedBreakpoints,
      activeBreakpoint,
      defaultBreakpoint: fallbackBreakpoint,
      resolveToken: tokenResolver,
    }),
    [mergedRegistry, normalizedBreakpoints, activeBreakpoint, fallbackBreakpoint, tokenResolver],
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

export function useBreakpointKey() {
  const { activeBreakpoint, defaultBreakpoint } = useResponsiveSlotContext()
  return normalizeBreakpointKey(activeBreakpoint, defaultBreakpoint)
}

export function resolveResponsiveSlotSize({
  slot,
  breakpoint,
  registry = baseResponsiveSlots,
  overrides,
  tokenResolver,
  inheritedSizes,
  fallbackBreakpoint = 'md',
}) {
  if (overrides === 'content') {
    return cloneSizeMap(DEFAULT_FALLBACK_SIZE)
  }

  const definition = registry?.[slot]
  const baseSizes =
    inheritedSizes ??
    definition?.sizes ??
    (definition && !definition.sizes ? definition : undefined)
  const mergedOverrides = overrides || undefined

  const merged = mergeSlotSizes(baseSizes || {}, mergedOverrides || {}, tokenResolver)

  if (!merged || Object.keys(merged).length === 0) {
    return cloneSizeMap(DEFAULT_FALLBACK_SIZE)
  }

  const resolved = resolveBreakpointSize(
    normalizeBreakpointKey(breakpoint, fallbackBreakpoint),
    merged,
  )
  return cloneSizeMap(resolved)
}

export function useResponsiveSlotSize(slot, overrides) {
  const {
    registry,
    activeBreakpoint,
    resolveToken: tokenResolver,
    defaultBreakpoint,
  } = useResponsiveSlotContext()
  const instance = useContext(SlotInstanceContext)

  const inheritedSizes = useMemo(() => {
    if (!instance || instance.slot !== slot) {
      return undefined
    }
    return instance.byBreakpoint
  }, [instance, slot])

  const size = useMemo(
    () =>
      resolveResponsiveSlotSize({
        slot,
        breakpoint: activeBreakpoint,
        registry,
        overrides,
        tokenResolver,
        inheritedSizes,
        fallbackBreakpoint: defaultBreakpoint,
      }),
    [activeBreakpoint, defaultBreakpoint, inheritedSizes, overrides, registry, slot, tokenResolver],
  )

  return useMemo(
    () => ({
      ...size,
      breakpoint: normalizeBreakpointKey(activeBreakpoint, defaultBreakpoint),
    }),
    [activeBreakpoint, defaultBreakpoint, size],
  )
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
  editableId,
  propsJSON,
  onClick,
  children,
  ...rest
}) {
  const {
    registry,
    activeBreakpoint,
    breakpoints,
    resolveToken: tokenResolver,
    defaultBreakpoint,
  } = useResponsiveSlotContext()
  const parentContext = useContext(SlotInstanceContext)
  const slotRef = useRef(null)
  const [isResizing, setIsResizing] = useState(false)

  const isContentOnly = sizes === 'content'

  const definition = registry?.[slot]
  const definitionMeta = definition?.meta
  const inheritedMeta = inherit && parentContext?.meta ? parentContext.meta : undefined
  const meta = useMemo(
    () => mergeMeta(inheritedMeta, definitionMeta),
    [inheritedMeta, definitionMeta],
  )
  const defaultVariant = meta.defaultVariant || 'default'

  const baseSizes =
    inherit && parentContext?.byBreakpoint
      ? parentContext.byBreakpoint
      : (definition?.sizes ?? (definition && !definition.sizes ? definition : undefined))

  const propOverrides = useMemo(() => {
    if (!sizes || sizes === 'content') return undefined
    return cloneBreakpointOverrides(sizes)
  }, [sizes])

  const {
    isEditable: isSlotEditable,
    isEditingEnabled,
    isActive: isActiveEditable,
    shouldShowOverlay,
    setActive,
    recordOverflow,
    publishDraft,
    discardDraft,
    updateSize,
    updateVariant,
    updateProps,
    clearBreakpoint,
    overrides: editingOverrides,
    variant: variantFromEditing,
    props: editingProps,
    draft: editingDraft,
    status: editingStatus,
    error: editingError,
    isDirty,
    overflowEvents,
    lastUpdatedAt,
  } = useSlotEditing({
    editableId,
    slotKey: slot,
    defaultVariant,
    variantProp: variant,
    propOverrides,
    propsJSON,
  })

  const combinedOverrides = useMemo(() => {
    if (isContentOnly) return undefined
    return mergeBreakpointOverrides(propOverrides, editingOverrides)
  }, [isContentOnly, propOverrides, editingOverrides])

  const mergedSizes = useMemo(() => {
    if (isContentOnly) return null
    if (!baseSizes && process.env.NODE_ENV !== 'production') {
      console.warn(`ResponsiveSlot: slot "${slot}" is not defined in the registry.`)
    }
    return mergeSlotSizes(baseSizes || {}, combinedOverrides || {}, tokenResolver)
  }, [baseSizes, combinedOverrides, isContentOnly, slot, tokenResolver])

  const resolvedSize = mergedSizes
    ? resolveBreakpointSize(activeBreakpoint, mergedSizes)
    : DEFAULT_FALLBACK_SIZE
  const [bufferState, setBufferState] = useState(() => ({
    active: BUFFER_PHASES[0],
    values: {
      [BUFFER_PHASES[0]]: cloneSizeMap(resolvedSize),
      [BUFFER_PHASES[1]]: cloneSizeMap(resolvedSize),
    },
    slotKey: slot,
  }))

  useEffect(() => {
    if (!mergedSizes || isContentOnly) {
      return
    }

    setBufferState((current) => {
      if (!current || current.slotKey !== slot) {
        return {
          active: BUFFER_PHASES[0],
          values: {
            [BUFFER_PHASES[0]]: cloneSizeMap(resolvedSize),
            [BUFFER_PHASES[1]]: cloneSizeMap(resolvedSize),
          },
          slotKey: slot,
        }
      }

      const { active, values } = current
      const activeSize = values?.[active]
      if (sizesEqual(activeSize, resolvedSize)) {
        return current
      }

      const nextPhase = BUFFER_TOGGLE[active] || BUFFER_PHASES[1]
      const nextValues = {
        ...values,
        [nextPhase]: cloneSizeMap(resolvedSize),
      }

      recordBufferFlip(slot, active, nextPhase)

      return {
        active: nextPhase,
        values: nextValues,
        slotKey: slot,
      }
    })
  }, [mergedSizes, isContentOnly, resolvedSize, slot])

  const bufferValues = bufferState?.values || {}
  const phaseA = bufferValues.A || cloneSizeMap(resolvedSize)
  const phaseB = bufferValues.B || cloneSizeMap(resolvedSize)
  const activePhase = bufferState?.active || BUFFER_PHASES[0]
  const activeSize = activePhase === 'B' ? phaseB : phaseA

  const cssVariables = mergedSizes
    ? {
        '--slot-inline-size-A': phaseA.inline,
        '--slot-block-size-A': phaseA.block,
        '--slot-max-inline-size-A': phaseA.maxInline,
        '--slot-max-block-size-A': phaseA.maxBlock,
        '--slot-min-inline-size-A': phaseA.minInline,
        '--slot-min-block-size-A': phaseA.minBlock,
        '--slot-inline-A': phaseA.inline,
        '--slot-block-A': phaseA.block,
        '--slot-max-inline-A': phaseA.maxInline,
        '--slot-max-block-A': phaseA.maxBlock,
        '--slot-min-inline-A': phaseA.minInline,
        '--slot-min-block-A': phaseA.minBlock,
        '--slot-inline-size-B': phaseB.inline,
        '--slot-block-size-B': phaseB.block,
        '--slot-max-inline-size-B': phaseB.maxInline,
        '--slot-max-block-size-B': phaseB.maxBlock,
        '--slot-min-inline-size-B': phaseB.minInline,
        '--slot-min-block-size-B': phaseB.minBlock,
        '--slot-inline-B': phaseB.inline,
        '--slot-block-B': phaseB.block,
        '--slot-max-inline-B': phaseB.maxInline,
        '--slot-max-block-B': phaseB.maxBlock,
        '--slot-min-inline-B': phaseB.minInline,
        '--slot-min-block-B': phaseB.minBlock,
        '--slot-inline-size': activeSize.inline,
        '--slot-block-size': activeSize.block,
        '--slot-max-inline-size': activeSize.maxInline,
        '--slot-max-block-size': activeSize.maxBlock,
        '--slot-min-inline-size': activeSize.minInline,
        '--slot-min-block-size': activeSize.minBlock,
        '--slot-inline': activeSize.inline,
        '--slot-block': activeSize.block,
        '--slot-max-inline': activeSize.maxInline,
        '--slot-max-block': activeSize.maxBlock,
        '--slot-min-inline': activeSize.minInline,
        '--slot-min-block': activeSize.minBlock,
      }
    : {}

  const slotStyle = mergedSizes
    ? {
        inlineSize: 'var(--slot-inline)',
        blockSize: 'var(--slot-block)',
        maxInlineSize: 'var(--slot-max-inline)',
        maxBlockSize: 'var(--slot-max-block)',
        minInlineSize: 'var(--slot-min-inline)',
        minBlockSize: 'var(--slot-min-block)',
        contain: 'layout paint style',
        display: 'grid',
        placeItems: 'stretch',
        overflow,
        position: 'relative',
        transition: 'box-shadow 120ms ease',
      }
    : { display: 'contents' }

  const variantName = variantFromEditing ?? defaultVariant
  const propsPayload = editingProps

  const normalizedDefaultBreakpoint = normalizeBreakpointKey(defaultBreakpoint)
  const normalizedActiveBreakpoint = normalizeBreakpointKey(
    activeBreakpoint,
    normalizedDefaultBreakpoint,
  )

  const datasetProps = {
    'data-slot-key': slot,
    'data-slot-variant': variantName,
    'data-slot-default-variant': defaultVariant,
    'data-slot-default-breakpoint': normalizedDefaultBreakpoint,
    'data-slot-breakpoint': normalizedActiveBreakpoint,
  }
  if (meta?.label) datasetProps['data-slot-label'] = meta.label
  if (meta?.description) datasetProps['data-slot-description'] = meta.description
  if (meta?.design?.figmaComponent)
    datasetProps['data-design-component'] = meta.design.figmaComponent
  if (meta?.design?.figmaNodeId) datasetProps['data-design-node'] = meta.design.figmaNodeId
  if (meta?.design?.figmaUrl) datasetProps['data-design-url'] = meta.design.figmaUrl
  if (meta?.tags) {
    const tags = Array.isArray(meta.tags) ? meta.tags.join(',') : meta.tags
    datasetProps['data-slot-tags'] = tags
  }
  if (editableId) {
    datasetProps['data-slot-editable-id'] = editableId
  }
  if (mergedSizes && !isContentOnly) {
    datasetProps['data-slot-buffer'] = activePhase
  }
  if (isSlotEditable) {
    datasetProps['data-slot-editable'] = 'true'
    if (isDirty) {
      datasetProps['data-slot-dirty'] = 'true'
    }
    if (editingStatus === 'saving') {
      datasetProps['data-slot-status'] = 'saving'
    }
  }
  const variantMeta = meta?.variants?.[variantName]
  if (variantMeta?.label) {
    datasetProps['data-slot-variant-label'] = variantMeta.label
  }

  if (isActiveEditable) {
    datasetProps['data-slot-editing-active'] = 'true'
  }

  if (isResizing) {
    datasetProps['data-slot-resizing'] = 'true'
  }

  const shouldHighlight =
    !isContentOnly && isSlotEditable && (isActiveEditable || shouldShowOverlay || isResizing)

  if (shouldHighlight) {
    datasetProps['data-slot-highlight'] = 'true'
  }

  const highlightStyle = shouldHighlight
    ? {
        boxShadow: isResizing
          ? '0 0 0 2px rgba(59, 130, 246, 0.95), 0 0 0 6px rgba(59, 130, 246, 0.35)'
          : '0 0 0 2px rgba(59, 130, 246, 0.8), 0 0 0 6px rgba(59, 130, 246, 0.25)',
        borderRadius: '0.75rem',
      }
    : null

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

      const detail = {
        inlineBudget:
          element.style.getPropertyValue('--slot-inline') ||
          element.style.getPropertyValue('--slot-inline-size') ||
          activeSize.inline,
        blockBudget:
          element.style.getPropertyValue('--slot-block') ||
          element.style.getPropertyValue('--slot-block-size') ||
          activeSize.block,
        breakpoint: activeBreakpoint,
        timestamp: Date.now(),
      }

      recordOverflow(detail)

      console.warn(
        `ResponsiveSlot: content overflow detected for slot "${slot}" at breakpoint "${activeBreakpoint}".`,
        {
          inlineBudget: detail.inlineBudget,
          blockBudget: detail.blockBudget,
        },
      )
    })
  }, [
    isContentOnly,
    slot,
    activeBreakpoint,
    activeSize.inline,
    activeSize.block,
    activeSize.maxInline,
    activeSize.maxBlock,
    activeSize.minInline,
    activeSize.minBlock,
    recordOverflow,
  ])

  const handleClick = useCallback(
    (event) => {
      if (typeof onClick === 'function') {
        onClick(event)
      }
      if (!event.defaultPrevented && isSlotEditable && isEditingEnabled) {
        setActive()
      }
    },
    [onClick, isSlotEditable, isEditingEnabled, setActive],
  )

  const overlayElement =
    shouldShowOverlay && mergedSizes ? (
      <SlotEditorOverlay
        slotKey={slot}
        slotLabel={meta?.label || slot}
        editableId={editableId}
        variant={variantName}
        variantOptions={meta?.variants || {}}
        onVariantChange={updateVariant}
        breakpoints={breakpoints}
        activeBreakpoint={activeBreakpoint}
        sizes={mergedSizes}
        draftSizes={editingOverrides || {}}
        onSizeChange={updateSize}
        onClearBreakpoint={clearBreakpoint}
        propsJSON={propsPayload}
        onPropsChange={updateProps}
        publishDraft={publishDraft}
        discardDraft={discardDraft}
        isDirty={isDirty}
        status={editingStatus}
        error={editingError}
        lastUpdatedAt={lastUpdatedAt}
        overflowEvents={overflowEvents}
        isActive={isActiveEditable}
        onActivate={setActive}
      />
    ) : null

  const componentOnClick = isContentOnly ? onClick : handleClick
  const componentRef = isContentOnly ? undefined : slotRef

  const showResizeHandles =
    !isContentOnly &&
    isSlotEditable &&
    (isActiveEditable || shouldShowOverlay || isResizing) &&
    mergedSizes

  const resizeHandles = showResizeHandles ? (
    <SlotResizeHandles
      elementRef={slotRef}
      breakpoint={normalizedActiveBreakpoint}
      onResize={updateSize}
      onResizeStart={() => setIsResizing(true)}
      onResizeEnd={() => setIsResizing(false)}
      onActivate={setActive}
    />
  ) : null

  const element = (
    <Component
      {...rest}
      ref={componentRef}
      role={role ?? 'presentation'}
      onClick={componentOnClick}
      {...datasetProps}
      style={{
        ...cssVariables,
        ...slotStyle,
        ...(highlightStyle || {}),
        ...(style || {}),
      }}
    >
      {resizeHandles}
      {!isContentOnly ? overlayElement : null}
      {children}
    </Component>
  )

  const contextValue = useMemo(
    () => ({
      slot,
      byBreakpoint: mergedSizes || {},
      meta,
      variant: variantName,
      editableId,
      props: propsPayload,
      editing: isSlotEditable
        ? {
            isEditing: isEditingEnabled,
            isActive: isActiveEditable,
            isDirty,
            status: editingStatus,
            draft: editingDraft,
            publish: publishDraft,
            discard: discardDraft,
            updateSize,
            updateVariant,
            updateProps,
            clearBreakpoint,
            overflowEvents,
            lastUpdatedAt,
          }
        : null,
    }),
    [
      slot,
      mergedSizes,
      meta,
      variantName,
      editableId,
      propsPayload,
      isSlotEditable,
      isEditingEnabled,
      isActiveEditable,
      isDirty,
      editingStatus,
      editingDraft,
      publishDraft,
      discardDraft,
      updateSize,
      updateVariant,
      updateProps,
      clearBreakpoint,
      overflowEvents,
      lastUpdatedAt,
    ],
  )

  return <SlotInstanceContext.Provider value={contextValue}>{element}</SlotInstanceContext.Provider>
}

function cloneBreakpointOverrides(map) {
  if (!map || typeof map !== 'object') return undefined

  const cloned = {}
  for (const [breakpoint, entry] of Object.entries(map)) {
    if (!ALLOWED_BREAKPOINTS.has(breakpoint)) continue
    if (!entry || typeof entry !== 'object') continue
    cloned[breakpoint] = { ...entry }
  }

  return Object.keys(cloned).length > 0 ? cloned : undefined
}

function mergeBreakpointOverrides(baseOverrides, editingOverrides) {
  if (!baseOverrides && !editingOverrides) return undefined

  const merged = {}

  if (baseOverrides) {
    for (const [breakpoint, entry] of Object.entries(baseOverrides)) {
      if (!ALLOWED_BREAKPOINTS.has(breakpoint)) continue
      if (!entry || typeof entry !== 'object') continue
      merged[breakpoint] = { ...entry }
    }
  }

  if (editingOverrides) {
    for (const [breakpoint, entry] of Object.entries(editingOverrides)) {
      if (!ALLOWED_BREAKPOINTS.has(breakpoint)) continue
      if (!entry || typeof entry !== 'object') continue
      merged[breakpoint] = { ...(merged[breakpoint] || {}), ...entry }
    }
  }

  return Object.keys(merged).length > 0 ? merged : undefined
}

const MIN_RESIZE_SIZE = 48

function clampDimension(value) {
  if (!Number.isFinite(value)) return MIN_RESIZE_SIZE
  return Math.max(MIN_RESIZE_SIZE, value)
}

function formatDimension(value) {
  return `${Math.round(value)}px`
}

function removePointerListeners(state) {
  if (!state || !state.target) return
  state.target.removeEventListener('pointermove', state.handleMove)
  state.target.removeEventListener('pointerup', state.handleEnd)
  state.target.removeEventListener('pointercancel', state.handleEnd)
}

function SlotResizeHandles({
  elementRef,
  breakpoint,
  onResize,
  onResizeStart,
  onResizeEnd,
  onActivate,
}) {
  const pointerState = useRef(null)

  useEffect(() => {
    return () => {
      if (pointerState.current) {
        removePointerListeners(pointerState.current)
        pointerState.current = null
      }
    }
  }, [])

  const startResize = useCallback(
    (mode) => (event) => {
      if (!elementRef?.current) return
      if (!breakpoint) return
      if (typeof event.button === 'number' && event.button !== 0) return

      onActivate?.()
      onResizeStart?.()

      event.preventDefault()
      event.stopPropagation()

      const rect = elementRef.current.getBoundingClientRect()
      const target = event.currentTarget?.ownerDocument?.defaultView || window
      if (!target) {
        onResizeEnd?.()
        return
      }

      const state = {
        pointerId: event.pointerId ?? Math.random(),
        mode,
        rect,
        startX: event.clientX,
        startY: event.clientY,
        target,
        breakpoint,
      }

      const handleMove = (moveEvent) => {
        if (pointerState.current?.pointerId !== state.pointerId) return
        moveEvent.preventDefault()

        const deltaX = moveEvent.clientX - state.startX
        const deltaY = moveEvent.clientY - state.startY

        if (mode === 'inline' || mode === 'corner') {
          const width = clampDimension(state.rect.width + deltaX)
          const formatted = formatDimension(width)
          onResize(state.breakpoint, 'inline', formatted)
          onResize(state.breakpoint, 'maxInline', formatted)
          onResize(state.breakpoint, 'minInline', formatted)
        }

        if (mode === 'block' || mode === 'corner') {
          const height = clampDimension(state.rect.height + deltaY)
          const formatted = formatDimension(height)
          onResize(state.breakpoint, 'block', formatted)
          onResize(state.breakpoint, 'maxBlock', formatted)
          onResize(state.breakpoint, 'minBlock', formatted)
        }
      }

      const handleEnd = (endEvent) => {
        if (pointerState.current?.pointerId !== state.pointerId) return
        endEvent.preventDefault?.()
        removePointerListeners(state)
        pointerState.current = null
        onResizeEnd?.()
      }

      state.handleMove = handleMove
      state.handleEnd = handleEnd
      pointerState.current = state

      target.addEventListener('pointermove', handleMove)
      target.addEventListener('pointerup', handleEnd)
      target.addEventListener('pointercancel', handleEnd)
    },
    [breakpoint, elementRef, onActivate, onResize, onResizeEnd, onResizeStart],
  )

  const containerStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 45,
  }

  const baseHandleStyle = {
    position: 'absolute',
    width: '0.85rem',
    height: '0.85rem',
    borderRadius: '999px',
    background: 'rgba(59, 130, 246, 0.95)',
    border: '1px solid rgba(15, 23, 42, 0.4)',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
    pointerEvents: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const inlineHandleStyle = {
    ...baseHandleStyle,
    top: '50%',
    right: '0.35rem',
    transform: 'translateY(-50%)',
    cursor: 'ew-resize',
  }

  const blockHandleStyle = {
    ...baseHandleStyle,
    left: '50%',
    bottom: '0.35rem',
    transform: 'translateX(-50%)',
    cursor: 'ns-resize',
  }

  const cornerHandleStyle = {
    ...baseHandleStyle,
    bottom: '0.35rem',
    right: '0.35rem',
    cursor: 'nwse-resize',
  }

  return (
    <div style={containerStyle} aria-hidden="true">
      <button
        type="button"
        data-testid="slot-resize-handle-inline"
        style={inlineHandleStyle}
        aria-label="Resize width"
        onPointerDown={startResize('inline')}
      />
      <button
        type="button"
        data-testid="slot-resize-handle-block"
        style={blockHandleStyle}
        aria-label="Resize height"
        onPointerDown={startResize('block')}
      />
      <button
        type="button"
        data-testid="slot-resize-handle-corner"
        style={cornerHandleStyle}
        aria-label="Resize width and height"
        onPointerDown={startResize('corner')}
      />
    </div>
  )
}
