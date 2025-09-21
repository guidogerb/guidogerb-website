import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { buildAddToCartEvent, useAnalytics } from '@guidogerb/components-analytics'

const defaultState = {
  items: [],
  promoCode: null,
  customTaxRate: null,
  customDiscountRate: null,
  shipping: 0,
  updatedAt: null,
}

const CartContext = createContext(null)

const ensureNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizePrice = (price = {}, fallbackCurrency = 'USD') => ({
  amount: ensureNumber(price.amount, 0),
  currency: price.currency ?? fallbackCurrency ?? 'USD',
})

let generatedBundleId = 0

const generateBundleId = () => {
  generatedBundleId += 1
  return `bundle-${generatedBundleId}`
}

const BUNDLE_ITEM_KEYS = ['bundleItems', 'bundledItems', 'bundle_items', 'components', 'items']

const extractBundleItems = (item) => {
  if (!item || typeof item !== 'object') return []
  for (const key of BUNDLE_ITEM_KEYS) {
    const value = item[key]
    if (Array.isArray(value) && value.length > 0) {
      return value
    }
  }
  return []
}

const buildBundleComponentId = (parentId, component, index) => {
  if (component.lineId) return component.lineId
  if (component.id) return `${parentId}::${component.id}`
  if (component.sku) return `${parentId}::${component.sku}`
  return `${parentId}::component-${index}`
}

const normalizeBundleComponent = (component, { parentId, bundleId, currency, index }) => {
  if (!component || typeof component !== 'object') return null

  const perBundleQuantity = ensureNumber(component.quantity, 1)
  const normalizedId =
    component.id ?? component.sku ?? component.productId ?? component.product_id ?? buildBundleComponentId(bundleId, component, index)
  const lineId = buildBundleComponentId(bundleId, component, index)

  const price = normalizePrice(component.price ?? component, currency)

  return {
    id: normalizedId,
    lineId,
    sku: component.sku ?? normalizedId,
    name: component.name ?? component.title ?? 'Bundle item',
    description: component.description ?? '',
    price,
    metadata: component.metadata ?? {},
    quantity: perBundleQuantity > 0 ? perBundleQuantity : 1,
    includeInTotals: component.includeInTotals ?? false,
    trackInventory: component.trackInventory ?? component.lockInventory ?? true,
    inventoryId:
      component.inventoryId ??
      component.inventory_id ??
      component.inventoryKey ??
      component.inventory_key ??
      normalizedId,
    categories: component.categories ?? component.tags ?? [],
    image: component.image ?? component.media?.[0]?.url ?? null,
    bundleId,
    bundleParentId: parentId,
    isBundleComponent: true,
  }
}

const mergeBundleItems = (existing = [], incoming = []) => {
  if (!existing.length) return incoming
  if (!incoming.length) return existing

  const merged = new Map(existing.map((item) => [item.lineId ?? item.id, item]))

  for (const item of incoming) {
    const key = item.lineId ?? item.id
    if (!key) continue
    if (!merged.has(key)) {
      merged.set(key, item)
      continue
    }

    const current = merged.get(key)
    merged.set(key, {
      ...current,
      price: item.price ?? current.price,
      metadata: { ...current.metadata, ...item.metadata },
      quantity: current.quantity,
      includeInTotals: item.includeInTotals ?? current.includeInTotals,
      categories:
        Array.isArray(item.categories) && item.categories.length > 0 ? item.categories : current.categories,
      image: item.image ?? current.image,
      inventoryId: item.inventoryId ?? current.inventoryId,
      trackInventory: item.trackInventory ?? current.trackInventory,
    })
  }

  return Array.from(merged.values())
}

const normalizeItem = (item) => {
  if (!item || typeof item !== 'object') return null
  const quantity = ensureNumber(item.quantity, 1)
  const normalizedId =
    item.id ?? item.productId ?? item.product_id ?? item.sku ?? item.sku_id ?? null
  if (!normalizedId) return null

  const basePrice = normalizePrice(item.price ?? item, item.price?.currency ?? item.currency)

  const bundleId =
    item.bundleId ??
    item.bundle_id ??
    item.bundle?.id ??
    item.bundleKey ??
    item.bundle_key ??
    null

  const resolvedBundleId = bundleId ?? normalizedId ?? generateBundleId()

  const bundleItems = extractBundleItems(item)
    .map((component, index) =>
      normalizeBundleComponent(component, {
        parentId: normalizedId,
        bundleId: resolvedBundleId,
        currency: basePrice.currency,
        index,
      }),
    )
    .filter(Boolean)

  return {
    id: normalizedId,
    lineId: item.lineId ?? normalizedId,
    sku: item.sku ?? normalizedId,
    name: item.name ?? item.title ?? 'Product',
    description: item.description ?? '',
    price: basePrice,
    metadata: item.metadata ?? {},
    quantity: quantity > 0 ? quantity : 1,
    categories: item.categories ?? item.tags ?? [],
    image: item.image ?? item.media?.[0]?.url ?? null,
    bundleItems,
    isBundle: bundleItems.length > 0,
    bundleId: bundleItems.length > 0 ? resolvedBundleId : bundleId ?? null,
    includeInTotals: item.includeInTotals ?? true,
    trackInventory: item.trackInventory ?? item.lockInventory ?? true,
    inventoryId:
      item.inventoryId ??
      item.inventory_id ??
      item.inventoryKey ??
      item.inventory_key ??
      normalizedId,
  }
}

const computePromoDiscount = (subtotal, promoRule) => {
  if (!promoRule || subtotal <= 0) return 0
  if (promoRule.type === 'percent') {
    return Math.max(subtotal * (ensureNumber(promoRule.value) / 100), 0)
  }
  if (promoRule.type === 'flat') {
    return Math.max(ensureNumber(promoRule.value), 0)
  }
  if (typeof promoRule === 'function') {
    return ensureNumber(promoRule(subtotal))
  }
  return 0
}

const calculateItemSubtotal = (item) => {
  if (!item) return 0
  const baseAmount = item.includeInTotals === false ? 0 : item.price.amount * item.quantity
  const bundleAmount = Array.isArray(item.bundleItems)
    ? item.bundleItems.reduce((sum, component) => {
        if (!component || component.includeInTotals === false) {
          return sum
        }
        return sum + component.price.amount * component.quantity * item.quantity
      }, 0)
    : 0
  return baseAmount + bundleAmount
}

const isNonEmptyStringValue = (value) => typeof value === 'string' && value.trim().length > 0

const coerceAnalyticsString = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : ''
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : ''
  }
  return ''
}

const toCurrencyAmount = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 0
  return amount / 100
}

const extractAnalyticsMetadata = (source) => {
  if (!source || typeof source !== 'object') return {}
  const analyticsMetadata = source.metadata?.analytics
  if (analyticsMetadata && typeof analyticsMetadata === 'object') {
    return { ...analyticsMetadata }
  }
  if (source.metadata && typeof source.metadata === 'object') {
    return { ...source.metadata }
  }
  return {}
}

const buildAnalyticsItemsFromCartItem = (item, quantity) => {
  if (!item || quantity <= 0) return []

  const items = []

  const pushItem = (source, bundleQuantity, extras = {}) => {
    if (!source) return
    const perUnitQuantity = Math.max(ensureNumber(bundleQuantity, 1), 0)
    if (perUnitQuantity <= 0) return

    const totalQuantity = Math.max(Math.round(perUnitQuantity * quantity), 0)
    if (totalQuantity <= 0) return

    const idCandidate =
      source.sku ?? source.id ?? source.productId ?? source.product_id ?? source.lineId ?? source.name
    const nameCandidate = source.name ?? source.title ?? source.label ?? idCandidate

    const resolvedId = coerceAnalyticsString(idCandidate)
    const resolvedName = coerceAnalyticsString(nameCandidate)

    if (!resolvedId && !resolvedName) {
      return
    }

    const analyticsItem = {
      id: resolvedId || resolvedName,
      name: resolvedName || resolvedId,
      price: toCurrencyAmount(source.price?.amount ?? source.price ?? 0),
      quantity: totalQuantity,
    }

    if (isNonEmptyStringValue(source.sku)) {
      analyticsItem.sku = source.sku.trim()
    }

    const categories = Array.isArray(source.categories)
      ? source.categories.filter((entry) => isNonEmptyStringValue(entry))
      : []
    if (categories.length > 0) {
      analyticsItem.categories = categories
    }

    const metadata = extractAnalyticsMetadata(source)
    const mergedMetadata = { ...metadata, ...extras }
    Object.entries(mergedMetadata).forEach(([key, rawValue]) => {
      if (typeof rawValue === 'boolean') {
        mergedMetadata[key] = rawValue ? 'true' : 'false'
        return
      }
      if (typeof rawValue === 'number') {
        if (!Number.isFinite(rawValue)) {
          delete mergedMetadata[key]
        }
        return
      }
      if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim()
        if (trimmed.length === 0) {
          delete mergedMetadata[key]
        } else {
          mergedMetadata[key] = trimmed
        }
        return
      }
      if (rawValue != null) {
        const coerced = coerceAnalyticsString(rawValue)
        if (coerced) {
          mergedMetadata[key] = coerced
          return
        }
      }
      delete mergedMetadata[key]
    })
    if (Object.keys(mergedMetadata).length > 0) {
      analyticsItem.metadata = mergedMetadata
    }

    items.push(analyticsItem)
  }

  pushItem(item, 1, item.isBundle ? { bundleId: item.bundleId ?? item.id, bundle: 'true' } : {})

  if (Array.isArray(item.bundleItems)) {
    item.bundleItems.forEach((component) => {
      const extras = {
        bundleParentId: item.bundleId ?? item.id,
        bundleComponent: 'true',
      }
      pushItem(component, ensureNumber(component.quantity, 1), extras)
    })
  }

  return items
}

const buildRemoveFromCartEvent = (options = {}) => {
  const event = buildAddToCartEvent(options)
  return {
    name: 'remove_from_cart',
    params: event.params,
  }
}

const computeTotals = (state, options) => {
  const { items, customTaxRate, customDiscountRate, promoCode, shipping } = state
  const {
    defaultTaxRate = 0,
    defaultDiscountRate = 0,
    promoCatalog = {},
    currency = 'USD',
  } = options

  const subtotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0)
  const discountFromRate = subtotal * (customDiscountRate ?? defaultDiscountRate)
  const promoRule = promoCode ? promoCatalog[promoCode] : null
  const discountFromPromo = computePromoDiscount(subtotal - discountFromRate, promoRule)
  const discountedSubtotal = Math.max(subtotal - discountFromRate - discountFromPromo, 0)
  const taxRate = customTaxRate ?? defaultTaxRate
  const tax = discountedSubtotal * taxRate
  const total = Math.max(discountedSubtotal + tax + (shipping ?? 0), 0)

  return {
    currency,
    subtotal,
    discount: discountFromRate + discountFromPromo,
    tax,
    shipping: shipping ?? 0,
    total,
    promoCode: promoCode ?? null,
  }
}

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'HYDRATE': {
      const next = {
        ...defaultState,
        ...action.payload,
      }
      next.items = Array.isArray(action.payload?.items)
        ? action.payload.items.map(normalizeItem).filter((item) => item && item.id)
        : []
      next.updatedAt = Date.now()
      return next
    }
    case 'ADD_ITEM': {
      const item = normalizeItem(action.payload)
      if (!item?.id) return state
      const existingIndex = state.items.findIndex((entry) => entry.id === item.id)
      let items
      if (existingIndex >= 0) {
        items = state.items.map((entry, index) => {
          if (index !== existingIndex) return entry
          const mergedBundleItems = mergeBundleItems(entry.bundleItems ?? [], item.bundleItems ?? [])
          return {
            ...entry,
            metadata: { ...entry.metadata, ...item.metadata },
            price: item.price ?? entry.price,
            quantity: entry.quantity + item.quantity,
            bundleItems: mergedBundleItems,
            isBundle: mergedBundleItems.length > 0,
            bundleId: item.bundleId ?? entry.bundleId ?? entry.id,
            includeInTotals: item.includeInTotals ?? entry.includeInTotals,
            trackInventory: item.trackInventory ?? entry.trackInventory,
            inventoryId: item.inventoryId ?? entry.inventoryId,
          }
        })
      } else {
        items = [...state.items, item]
      }
      return {
        ...state,
        items,
        updatedAt: Date.now(),
      }
    }
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload ?? {}
      if (!id) return state
      const nextQuantity = Math.max(ensureNumber(quantity, 1), 0)
      const items = state.items
        .map((item) => (item.id === id ? { ...item, quantity: nextQuantity || 1 } : item))
        .filter((item) => item.quantity > 0)
      return {
        ...state,
        items,
        updatedAt: Date.now(),
      }
    }
    case 'REMOVE_ITEM': {
      const id = action.payload
      if (!id) return state
      return {
        ...state,
        items: state.items.filter((item) => item.id !== id),
        updatedAt: Date.now(),
      }
    }
    case 'CLEAR_CART': {
      return {
        ...defaultState,
        updatedAt: Date.now(),
      }
    }
    case 'APPLY_PROMO': {
      return {
        ...state,
        promoCode: action.payload ?? null,
        updatedAt: Date.now(),
      }
    }
    case 'SET_TAX_RATE': {
      return {
        ...state,
        customTaxRate: action.payload,
        updatedAt: Date.now(),
      }
    }
    case 'SET_DISCOUNT_RATE': {
      return {
        ...state,
        customDiscountRate: action.payload,
        updatedAt: Date.now(),
      }
    }
    case 'SET_SHIPPING': {
      return {
        ...state,
        shipping: ensureNumber(action.payload, 0),
        updatedAt: Date.now(),
      }
    }
    default:
      return state
  }
}

const initCartState = (initialState, initializer) => {
  if (typeof initializer === 'function') {
    return initializer(defaultState)
  }
  if (initializer) {
    return { ...defaultState, ...initializer }
  }
  return { ...defaultState, ...initialState }
}

export function CartProvider({
  children,
  currency = 'USD',
  taxRate = 0,
  discountRate = 0,
  promoCodes = {},
  initialCart,
  storage,
  storageKey = 'guidogerb.pos.cart',
  onChange,
} = {}) {
  const [state, dispatch] = useReducer(cartReducer, defaultState, () =>
    initCartState(defaultState, initialCart),
  )
  const analytics = useAnalytics()

  const emitCartEvent = useCallback(
    (builder, cartItem, bundleQuantity) => {
      if (typeof builder !== 'function' || !cartItem || bundleQuantity <= 0) return
      const analyticsItems = buildAnalyticsItemsFromCartItem(cartItem, bundleQuantity)
      if (analyticsItems.length === 0) return
      const event = builder({
        currency,
        cartId: storageKey,
        items: analyticsItems,
      })
      if (!event?.name || !event?.params) return
      analytics?.trackEvent?.(event.name, event.params)
    },
    [analytics, currency, storageKey],
  )

  useEffect(() => {
    if (!storage || !storageKey) return undefined
    const stored = storage.get?.(storageKey)
    if (stored) {
      dispatch({ type: 'HYDRATE', payload: stored })
    }
    if (!storage.subscribe) return undefined
    const unsubscribe = storage.subscribe((event) => {
      if (!event || event.key !== storageKey || event.type !== 'set') return
      dispatch({ type: 'HYDRATE', payload: event.value })
    })
    return unsubscribe
  }, [storage, storageKey])

  useEffect(() => {
    if (!storage || !storageKey) return
    storage.set?.(storageKey, {
      ...state,
      currency,
    })
  }, [currency, state, storage, storageKey])

  useEffect(() => {
    if (!onChange) return
    onChange({
      ...state,
      totals: computeTotals(state, {
        defaultTaxRate: taxRate,
        defaultDiscountRate: discountRate,
        promoCatalog: promoCodes,
        currency,
      }),
    })
  }, [currency, discountRate, onChange, promoCodes, state, taxRate])

  const totals = useMemo(
    () =>
      computeTotals(state, {
        defaultTaxRate: taxRate,
        defaultDiscountRate: discountRate,
        promoCatalog: promoCodes,
        currency,
      }),
    [currency, discountRate, promoCodes, state, taxRate],
  )

  const addItem = useCallback(
    (item, quantity = 1) => {
      const normalizedQuantity = Math.max(ensureNumber(quantity, 1), 1)
      const normalizedItem = normalizeItem({ ...item, quantity: normalizedQuantity })
      dispatch({
        type: 'ADD_ITEM',
        payload: { ...item, quantity: normalizedQuantity },
      })
      if (normalizedItem) {
        emitCartEvent(buildAddToCartEvent, normalizedItem, normalizedQuantity)
      }
    },
    [dispatch, emitCartEvent],
  )

  const updateQuantity = useCallback(
    (id, quantity) => {
      const nextQuantity = Math.max(ensureNumber(quantity, 1), 1)
      const existing = state.items.find((entry) => entry.id === id)
      if (existing) {
        const delta = nextQuantity - existing.quantity
        if (delta > 0) {
          emitCartEvent(buildAddToCartEvent, existing, delta)
        } else if (delta < 0) {
          emitCartEvent(buildRemoveFromCartEvent, existing, Math.abs(delta))
        }
      }
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity: nextQuantity } })
    },
    [dispatch, emitCartEvent, state.items],
  )

  const removeItem = useCallback(
    (id) => {
      const existing = state.items.find((entry) => entry.id === id)
      if (existing) {
        emitCartEvent(buildRemoveFromCartEvent, existing, existing.quantity)
      }
      dispatch({ type: 'REMOVE_ITEM', payload: id })
    },
    [dispatch, emitCartEvent, state.items],
  )

  const clearCart = useCallback(() => {
    if (state.items.length > 0) {
      state.items.forEach((item) => {
        emitCartEvent(buildRemoveFromCartEvent, item, item.quantity)
      })
    }
    dispatch({ type: 'CLEAR_CART' })
  }, [dispatch, emitCartEvent, state.items])

  const applyPromoCode = useCallback(
    (code) => {
      dispatch({ type: 'APPLY_PROMO', payload: code })
    },
    [dispatch],
  )

  const setTaxRate = useCallback(
    (rate) => {
      dispatch({ type: 'SET_TAX_RATE', payload: rate })
    },
    [dispatch],
  )

  const setDiscountRate = useCallback(
    (rate) => {
      dispatch({ type: 'SET_DISCOUNT_RATE', payload: rate })
    },
    [dispatch],
  )

  const setShipping = useCallback(
    (amount) => {
      dispatch({ type: 'SET_SHIPPING', payload: amount })
    },
    [dispatch],
  )

  const value = useMemo(
    () => ({
      ...state,
      currency,
      totals,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      applyPromoCode,
      setTaxRate,
      setDiscountRate,
      setShipping,
    }),
    [
      addItem,
      applyPromoCode,
      clearCart,
      currency,
      removeItem,
      setDiscountRate,
      setShipping,
      setTaxRate,
      state,
      totals,
      updateQuantity,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export { CartContext }
