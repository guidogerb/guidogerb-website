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
    xs: { inline: 'min(100%, 20rem)', block: '24rem' },
    sm: { inline: '20rem', block: '24rem' },
    md: { inline: '22rem', block: '26rem' },
    lg: { inline: '24rem', block: '26rem' },
  },
  'dashboard.panel': {
    xs: { inline: 'min(100%, 100vw)', block: '18rem' },
    md: { inline: '32rem', block: '20rem' },
    lg: { inline: '36rem', block: '22rem' },
  },
  'hero.banner': {
    xs: { inline: '100%', block: '28rem' },
    md: { inline: '100%', block: '32rem' },
    xl: { inline: '100%', block: '36rem' },
  },
  'list.row': {
    xs: { inline: '100%', block: 'auto' },
    md: { inline: '100%', block: '5rem' },
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

function toCssValue(value, defaultValue) {
  if (value == null) return defaultValue
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}

function normalizeSlotSizeMap(value) {
  if (!value) {
    return DEFAULT_FALLBACK_SIZE
  }

  return {
    inline: toCssValue(value.inline, DEFAULT_FALLBACK_SIZE.inline),
    block: toCssValue(value.block, DEFAULT_FALLBACK_SIZE.block),
    maxInline: toCssValue(value.maxInline, DEFAULT_FALLBACK_SIZE.maxInline),
    maxBlock: toCssValue(value.maxBlock, DEFAULT_FALLBACK_SIZE.maxBlock),
    minInline: toCssValue(value.minInline, DEFAULT_FALLBACK_SIZE.minInline),
    minBlock: toCssValue(value.minBlock, DEFAULT_FALLBACK_SIZE.minBlock),
  }
}

function mergeSlotRegistry(base = {}, overrides = {}) {
  const merged = { ...base }

  for (const [slot, slotConfig] of Object.entries(overrides || {})) {
    const baseConfig = merged[slot] || {}
    const nextConfig = { ...baseConfig }

    for (const [breakpoint, sizeMap] of Object.entries(slotConfig || {})) {
      if (!ALLOWED_BREAKPOINTS.has(breakpoint)) continue
      nextConfig[breakpoint] = {
        ...(baseConfig?.[breakpoint] || {}),
        ...(sizeMap || {}),
      }
    }

    merged[slot] = nextConfig
  }

  return merged
}

function mergeSlotSizes(base = {}, overrides = {}) {
  const merged = {}
  const keys = new Set([...Object.keys(base || {}), ...Object.keys(overrides || {})])

  for (const key of keys) {
    if (!ALLOWED_BREAKPOINTS.has(key)) continue

    const baseEntry = base?.[key]
    const overrideEntry = overrides?.[key]

    if (!baseEntry && !overrideEntry) continue

    merged[key] = normalizeSlotSizeMap({
      ...(baseEntry || {}),
      ...(overrideEntry || {}),
    })
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

export function ResponsiveSlotProvider({ registry, defaultBreakpoint = 'md', children }) {
  const fallbackBreakpoint = normalizeBreakpointKey(defaultBreakpoint)

  const mergedRegistry = useMemo(() => mergeSlotRegistry(baseResponsiveSlots, registry), [registry])

  const activeBreakpoint = useActiveBreakpoint(fallbackBreakpoint)

  const value = useMemo(
    () => ({
      registry: mergedRegistry,
      breakpoints: responsiveSlotBreakpoints,
      activeBreakpoint,
      defaultBreakpoint: fallbackBreakpoint,
    }),
    [mergedRegistry, activeBreakpoint, fallbackBreakpoint],
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
  const { registry, activeBreakpoint } = useResponsiveSlotContext()

  const baseConfig = registry?.[slot] || {}
  const merged = useMemo(
    () => mergeSlotSizes(baseConfig, overrides === 'content' ? {} : overrides),
    [baseConfig, overrides],
  )

  return resolveBreakpointSize(activeBreakpoint, merged)
}

export function ResponsiveSlot({
  as: Component = 'div',
  slot,
  sizes,
  inherit = false,
  overflow = 'hidden auto',
  style,
  role,
  children,
  ...rest
}) {
  const { registry, activeBreakpoint } = useResponsiveSlotContext()
  const parentContext = useContext(SlotInstanceContext)
  const slotRef = useRef(null)

  const isContentOnly = sizes === 'content'

  const baseSizes =
    inherit && parentContext?.byBreakpoint ? parentContext.byBreakpoint : registry?.[slot]

  const mergedSizes = useMemo(() => {
    if (isContentOnly) return null
    if (!baseSizes && process.env.NODE_ENV !== 'production') {
      console.warn(`ResponsiveSlot: slot "${slot}" is not defined in the registry.`)
    }
    return mergeSlotSizes(baseSizes, sizes === 'content' ? {} : sizes)
  }, [baseSizes, sizes, isContentOnly, slot])

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
    }),
    [slot, mergedSizes],
  )

  return <SlotInstanceContext.Provider value={contextValue}>{element}</SlotInstanceContext.Provider>
}
