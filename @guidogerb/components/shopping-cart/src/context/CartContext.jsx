import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'

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

const normalizePrice = (price = {}) => ({
  amount: ensureNumber(price.amount, 0),
  currency: price.currency ?? 'USD',
})

const normalizeItem = (item) => {
  if (!item) return null
  const quantity = ensureNumber(item.quantity, 1)
  return {
    id: item.id,
    sku: item.sku ?? item.id,
    name: item.name ?? item.title ?? 'Product',
    description: item.description ?? '',
    price: normalizePrice(item.price ?? item),
    metadata: item.metadata ?? {},
    quantity: quantity > 0 ? quantity : 1,
    categories: item.categories ?? item.tags ?? [],
    image: item.image ?? item.media?.[0]?.url ?? null,
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

const computeTotals = (state, options) => {
  const { items, customTaxRate, customDiscountRate, promoCode, shipping } = state
  const {
    defaultTaxRate = 0,
    defaultDiscountRate = 0,
    promoCatalog = {},
    currency = 'USD',
  } = options

  const subtotal = items.reduce((sum, item) => sum + item.price.amount * item.quantity, 0)
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
        ? action.payload.items
            .map(normalizeItem)
            .filter((item) => item && item.id)
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
        items = state.items.map((entry, index) =>
          index === existingIndex
            ? { ...entry, quantity: entry.quantity + item.quantity }
            : entry,
        )
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
        .map((item) =>
          item.id === id ? { ...item, quantity: nextQuantity || 1 } : item,
        )
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
  const [state, dispatch] = useReducer(
    cartReducer,
    defaultState,
    () => initCartState(defaultState, initialCart),
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
      dispatch({
        type: 'ADD_ITEM',
        payload: { ...item, quantity },
      })
    },
    [dispatch],
  )

  const updateQuantity = useCallback(
    (id, quantity) => {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
    },
    [dispatch],
  )

  const removeItem = useCallback(
    (id) => {
      dispatch({ type: 'REMOVE_ITEM', payload: id })
    },
    [dispatch],
  )

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])

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
