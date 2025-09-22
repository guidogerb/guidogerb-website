import { useCallback, useEffect, useMemo, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import {
  CartProvider,
  CheckoutForm,
  ShoppingCart,
  useCart,
} from '@guidogerb/components-shopping-cart'
import { UserProvider } from './context/UserContext.jsx'
import { useUser } from './context/UserContext.jsx'
import { ProductList } from './ProductList.jsx'
import { InvoiceView } from './InvoiceView.jsx'
import { OrderHistory } from './OrderHistory.jsx'
import { POSPage } from './pages/POSPage.jsx'
import { InvoicePage } from './pages/InvoicePage.jsx'
import { HistoryPage } from './pages/HistoryPage.jsx'
import { UserProfile } from './UserProfile.jsx'
import { createPOSApi } from './services/api.js'
import { confirmStripePayment, loadStripeInstance } from './services/stripe.js'

// Lightweight namespaced cache over a Storage-like API (localStorage or custom)
function createOfflineCache(storage, storageKey = 'guidogerb.pos.offline') {
  // In-memory fallback if no storage available
  const memory = new Map()

  const readAll = () => {
    if (!storage || typeof storage.getItem !== 'function') {
      // reconstruct plain object from memory Map
      const obj = {}
      for (const [k, v] of memory.entries()) obj[k] = v
      return obj
    }
    try {
      const raw = storage.getItem(storageKey)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  const writeAll = (obj) => {
    if (!storage || typeof storage.setItem !== 'function') {
      memory.clear()
      Object.entries(obj || {}).forEach(([k, v]) => memory.set(k, v))
      return
    }
    try {
      storage.setItem(storageKey, JSON.stringify(obj ?? {}))
    } catch {
      // Ignore quota / serialization errors to avoid breaking UI
    }
  }

  return {
    get(key) {
      const all = readAll()
      // undefined if missing to match existing usage expectations
      return Object.prototype.hasOwnProperty.call(all, key) ? all[key] : undefined
    },
    set(key, value) {
      if (!key) return value
      const all = readAll()
      all[key] = value
      writeAll(all)
      return value
    },
    remove(key) {
      if (!key) return
      const all = readAll()
      if (Object.prototype.hasOwnProperty.call(all, key)) {
        delete all[key]
        writeAll(all)
      }
    },
  }
}

const formatMoney = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount / 100)
  } catch (error) {
    return `$${(amount / 100).toFixed(2)}`
  }
}

const buildInvoiceFromOrder = (order) => {
  if (!order) return null
  return {
    id: order.invoiceId ?? order.id,
    number: order.number ?? order.invoiceNumber ?? order.id,
    status: order.status ?? 'PAID',
    issuedAt: order.createdAt ?? order.placedAt ?? new Date().toISOString(),
    customer: order.customer,
    items: order.items ?? [],
    totals: {
      subtotal: order.subtotal ?? order.total?.amount ?? order.total ?? 0,
      discount: order.discount ?? 0,
      tax: order.tax ?? 0,
      total: order.total?.amount ?? order.total ?? 0,
      currency: order.total?.currency ?? order.currency ?? 'USD',
    },
  }
}

const buildOrderFromInvoice = (invoice, { totals = {}, user } = {}) => {
  if (!invoice) return null

  const invoiceTotals = invoice.totals ?? {}
  const amount = invoiceTotals.total ?? totals.total ?? 0
  const currency = invoiceTotals.currency ?? totals.currency ?? 'USD'

  return {
    id: invoice.id ?? invoice.number ?? `order-${Date.now()}`,
    number: invoice.number ?? invoice.id ?? `ORDER-${Date.now()}`,
    status: invoice.status ?? 'PAID',
    total: {
      amount,
      currency,
    },
    customer:
      invoice.customer ??
      (user
        ? {
            email: user.email,
            name: user.name,
          }
        : null),
    createdAt: invoice.issuedAt ?? new Date().toISOString(),
    paymentIntentId: invoice.paymentIntentId ?? invoice.paymentIntent?.id ?? null,
  }
}

const HANDOFF_STATUS_SYNCED = 'synced'
const HANDOFF_STATUS_PENDING = 'pending'

const createHandoffId = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return `handoff-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  return (
    entry.id ??
    entry.invoice?.id ??
    entry.paymentIntentId ??
    entry.order?.id ??
    `handoff-${Date.now()}-${Math.random().toString(16).slice(2)}`
  )
}

const normalizeHandoffEntries = (entries, limit = 5) => {
  if (!Array.isArray(entries) || limit <= 0) return []

  const normalized = []
  const seen = new Set()

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue
    const id = createHandoffId(entry)
    if (seen.has(id)) continue
    seen.add(id)
    normalized.push({
      ...entry,
      id,
      status:
        entry.status === HANDOFF_STATUS_PENDING ? HANDOFF_STATUS_PENDING : HANDOFF_STATUS_SYNCED,
      createdAt: entry.createdAt ?? Date.now(),
    })
    if (normalized.length >= limit) break
  }

  return normalized
}

const handoffEntriesEqual = (a, b) => {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  for (let index = 0; index < a.length; index += 1) {
    const left = a[index]
    const right = b[index]
    if (!left || !right) return false
    if (left.id !== right.id) return false
    if (left.status !== right.status) return false
    if ((left.invoice?.id ?? null) !== (right.invoice?.id ?? null)) return false
    if ((left.order?.id ?? null) !== (right.order?.id ?? null)) return false
    if ((left.paymentIntentId ?? null) !== (right.paymentIntentId ?? null)) return false
    if ((left.userId ?? null) !== (right.userId ?? null)) return false
  }
  return true
}

const mergeByKey = (existing = [], incoming = [], getKey = (item) => item?.id) => {
  const map = new Map()

  for (const item of existing) {
    if (!item || typeof item !== 'object') continue
    const key = getKey(item)
    if (!key) continue
    map.set(key, item)
  }

  for (const item of incoming) {
    if (!item || typeof item !== 'object') continue
    const key = getKey(item)
    if (!key) continue
    map.set(key, { ...map.get(key), ...item })
  }

  return Array.from(map.values())
}

const PointOfSaleExperience = ({
  stripe,
  stripeError,
  withElements,
  confirmPayment = confirmStripePayment,
  api,
  apiBaseUrl,
  catalog,
  renderPOSPage: POSComponent = POSPage,
  renderInvoicePage: InvoiceComponent = InvoicePage,
  renderHistoryPage: HistoryComponent = HistoryPage,
  renderProfile,
  onOrderComplete,
  onInvoiceCreate,
  onPaymentError,
  shouldAutoCreatePaymentIntent = true,
  createInvoiceMetadata,
  handoffStorage,
  handoffStorageKey = 'guidogerb.pos.handoffs',
  maxStoredHandoffs = 5,
  offlineCache,
}) => {
  const { items, totals, clearCart } = useCart()
  const {
    user,
    status: userStatus,
    loading: userLoading,
    updateProfile,
    logout,
    setStripeCustomerId,
  } = useUser()

  const [view, setView] = useState('pos')
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [productsError, setProductsError] = useState(null)
  const [orders, setOrders] = useState(() => {
    const cached = offlineCache?.get('orders')
    return Array.isArray(cached) ? cached : []
  })
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [invoices, setInvoices] = useState(() => {
    const cached = offlineCache?.get('invoices')
    return Array.isArray(cached) ? cached : []
  })
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [activeInvoice, setActiveInvoice] = useState(
    () => offlineCache?.get('activeInvoice') ?? null,
  )
  const [checkoutError, setCheckoutError] = useState(null)
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState({ id: null, clientSecret: null })

  const supportsHandoffs = Boolean(handoffStorage?.get && maxStoredHandoffs > 0)

  const loadHandoffs = useCallback(() => {
    if (!supportsHandoffs) return []
    try {
      const stored = handoffStorage.get?.(handoffStorageKey, [])
      return normalizeHandoffEntries(stored, maxStoredHandoffs)
    } catch (error) {
      console.error('Failed to load POS handoffs', error)
      return []
    }
  }, [handoffStorage, handoffStorageKey, maxStoredHandoffs, supportsHandoffs])

  const [handoffs, setHandoffs] = useState(() => loadHandoffs())

  useEffect(() => {
    if (!supportsHandoffs) return
    setHandoffs((prev) => {
      const next = loadHandoffs()
      return handoffEntriesEqual(prev, next) ? prev : next
    })
  }, [loadHandoffs, supportsHandoffs])

  useEffect(() => {
    if (!supportsHandoffs || typeof handoffStorage?.subscribe !== 'function') return undefined
    const unsubscribe = handoffStorage.subscribe((event) => {
      if (!event) return
      if (event.type === 'clear' || event.key === undefined || event.key === handoffStorageKey) {
        setHandoffs((prev) => {
          const next = loadHandoffs()
          return handoffEntriesEqual(prev, next) ? prev : next
        })
      } else if (event.type === 'set' && event.key === handoffStorageKey) {
        const next = normalizeHandoffEntries(event.value, maxStoredHandoffs)
        setHandoffs((prev) => (handoffEntriesEqual(prev, next) ? prev : next))
      }
    })
    return unsubscribe
  }, [handoffStorage, handoffStorageKey, loadHandoffs, maxStoredHandoffs, supportsHandoffs])

  const updateHandoffs = useCallback(
    (updater) => {
      if (!handoffStorage?.set || maxStoredHandoffs <= 0) return
      setHandoffs((prev) => {
        const nextEntries = typeof updater === 'function' ? updater(prev) : (updater ?? [])
        const normalized = normalizeHandoffEntries(nextEntries, maxStoredHandoffs)
        if (handoffEntriesEqual(prev, normalized)) return prev
        handoffStorage.set(handoffStorageKey, normalized)
        return normalized
      })
    },
    [handoffStorage, handoffStorageKey, maxStoredHandoffs],
  )

  const posApi = useMemo(() => {
    if (api) return api
    if (!apiBaseUrl) return null
    try {
      return createPOSApi({ baseUrl: apiBaseUrl })
    } catch (error) {
      console.error('Failed to create POS API client', error)
      return null
    }
  }, [api, apiBaseUrl])

  const loadProducts = useCallback(async () => {
    if (!posApi?.listProducts) return
    setIsLoadingProducts(true)
    setProductsError(null)
    try {
      const result = await posApi.listProducts({ userId: user?.id })
      const items = Array.isArray(result)
        ? result
        : Array.isArray(result?.items)
          ? result.items
          : []
      setProducts(items)
    } catch (error) {
      setProductsError(error)
    } finally {
      setIsLoadingProducts(false)
    }
  }, [posApi, user?.id])

  const loadOrders = useCallback(async () => {
    if (!posApi?.listOrders) return
    setIsLoadingOrders(true)
    try {
      const result = await posApi.listOrders({ userId: user?.id })
      const records = Array.isArray(result)
        ? result
        : Array.isArray(result?.orders)
          ? result.orders
          : []
      setOrders(records)
    } catch (error) {
      console.error('Failed to load orders', error)
    } finally {
      setIsLoadingOrders(false)
    }
  }, [posApi, user?.id])

  const loadInvoices = useCallback(async () => {
    if (!posApi?.listInvoices) return
    setIsLoadingInvoices(true)
    try {
      const result = await posApi.listInvoices({ userId: user?.id })
      const records = Array.isArray(result)
        ? result
        : Array.isArray(result?.invoices)
          ? result.invoices
          : []
      setInvoices(records)
      if (!activeInvoice && records.length > 0) {
        setActiveInvoice(records[0])
      }
    } catch (error) {
      console.error('Failed to load invoices', error)
    } finally {
      setIsLoadingInvoices(false)
    }
  }, [activeInvoice, posApi, user?.id])

  useEffect(() => {
    loadProducts()
    loadOrders()
    loadInvoices()
  }, [loadProducts, loadOrders, loadInvoices])

  useEffect(() => {
    if (!handoffs.length) return

    const handoffInvoices = handoffs.map((entry) => entry.invoice).filter(Boolean)
    if (handoffInvoices.length > 0) {
      setInvoices((prev) => mergeByKey(prev, handoffInvoices, (item) => item?.id ?? item?.number))
    }

    const handoffOrders = handoffs.map((entry) => entry.order).filter(Boolean)
    if (handoffOrders.length > 0) {
      setOrders((prev) => mergeByKey(prev, handoffOrders, (item) => item?.id ?? item?.number))
    }

    if (!activeInvoice) {
      const latestInvoice = handoffInvoices[0]
      if (latestInvoice) {
        setActiveInvoice(latestInvoice)
      }
    }
  }, [activeInvoice, handoffs])

  const cartSnapshot = useMemo(
    () => ({
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.price,
        total: {
          amount: item.price.amount * item.quantity,
          currency: item.price.currency,
        },
        metadata: item.metadata,
      })),
      totals,
    }),
    [items, totals],
  )

  useEffect(() => {
    if (!offlineCache) return
    if (!cartSnapshot?.items?.length) {
      offlineCache.remove('cartSnapshot')
      return
    }
    offlineCache.set('cartSnapshot', cartSnapshot)
  }, [cartSnapshot, offlineCache])

  useEffect(() => {
    if (!offlineCache) return
    offlineCache.set('orders', Array.isArray(orders) ? orders : [])
  }, [offlineCache, orders])

  useEffect(() => {
    if (!offlineCache) return
    offlineCache.set('invoices', Array.isArray(invoices) ? invoices : [])
  }, [offlineCache, invoices])

  useEffect(() => {
    if (!offlineCache) return
    if (!activeInvoice) {
      offlineCache.remove('activeInvoice')
      return
    }
    offlineCache.set('activeInvoice', activeInvoice)
  }, [activeInvoice, offlineCache])

  useEffect(() => {
    if (!shouldAutoCreatePaymentIntent || !posApi?.createPaymentIntent) return undefined
    if (totals.total <= 0) {
      setPaymentIntent({ id: null, clientSecret: null })
      return undefined
    }

    let cancelled = false
    setIsCreatingPaymentIntent(true)

    posApi
      .createPaymentIntent({
        amount: totals.total,
        currency: totals.currency,
        cart: cartSnapshot,
        customerId: user?.stripeCustomerId ?? user?.id,
        metadata: {
          userId: user?.id,
          promoCode: totals.promoCode,
        },
      })
      .then((intent) => {
        if (cancelled) return
        if (intent) {
          setPaymentIntent({
            id: intent.id ?? intent.paymentIntentId ?? null,
            clientSecret: intent.clientSecret ?? intent.client_secret ?? null,
            raw: intent,
          })
          setCheckoutError(null)
        }
      })
      .catch((error) => {
        if (cancelled) return
        setCheckoutError(error)
      })
      .finally(() => {
        if (!cancelled) setIsCreatingPaymentIntent(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    cartSnapshot,
    posApi,
    shouldAutoCreatePaymentIntent,
    totals.currency,
    totals.promoCode,
    totals.total,
    user?.id,
    user?.stripeCustomerId,
  ])

  const refreshHistory = useCallback(() => {
    loadOrders()
    loadInvoices()
  }, [loadInvoices, loadOrders])

  const handlePaymentSuccess = useCallback(
    async (paymentIntentResult, context) => {
      const snapshot = {
        ...cartSnapshot,
        promoCode: totals.promoCode,
      }

      const metadataPayload = createInvoiceMetadata?.({
        paymentIntent: paymentIntentResult,
        cart: snapshot,
        user,
        context,
      })

      const fallbackInvoice = {
        id: paymentIntentResult?.id ?? `invoice-${Date.now()}`,
        number: paymentIntentResult?.id ?? `INV-${Date.now()}`,
        status: paymentIntentResult?.status ?? 'SUCCEEDED',
        issuedAt: new Date().toISOString(),
        customer: { name: user?.name, email: user?.email },
        items: snapshot.items,
        totals: snapshot.totals,
        paymentIntentId: paymentIntentResult?.id ?? null,
      }

      let invoiceResponse = null
      let resolvedInvoice = fallbackInvoice
      let orderRecord = null
      let persistenceStatus = HANDOFF_STATUS_PENDING
      let persistenceError = null

      if (posApi?.createInvoice) {
        try {
          invoiceResponse = await posApi.createInvoice({
            cart: snapshot,
            paymentIntent: paymentIntentResult,
            user,
            metadata: metadataPayload,
          })
          resolvedInvoice = invoiceResponse?.invoice ?? invoiceResponse ?? fallbackInvoice
          persistenceStatus = HANDOFF_STATUS_SYNCED
        } catch (error) {
          persistenceError = error
          resolvedInvoice = fallbackInvoice
        }
      }

      if (!resolvedInvoice) {
        resolvedInvoice = fallbackInvoice
      }

      orderRecord =
        invoiceResponse?.order ??
        buildOrderFromInvoice(resolvedInvoice, { totals: snapshot.totals, user }) ??
        buildOrderFromInvoice(fallbackInvoice, { totals: snapshot.totals, user })

      setActiveInvoice(resolvedInvoice)
      setInvoices((prev) => mergeByKey(prev, [resolvedInvoice], (item) => item?.id ?? item?.number))

      if (orderRecord) {
        setOrders((prev) => mergeByKey(prev, [orderRecord], (item) => item?.id ?? item?.number))
      }

      if (persistenceStatus === HANDOFF_STATUS_SYNCED && posApi?.recordOrder) {
        try {
          await posApi.recordOrder({
            invoice: resolvedInvoice,
            paymentIntent: paymentIntentResult,
            cart: snapshot,
            user,
          })
        } catch (error) {
          persistenceError = persistenceError ?? error
          persistenceStatus = HANDOFF_STATUS_PENDING
        }
      }

      if (supportsHandoffs && handoffStorage?.set) {
        updateHandoffs((current) => {
          const filtered = current.filter(
            (entry) =>
              entry.id !== resolvedInvoice.id &&
              entry.paymentIntentId !== (paymentIntentResult?.id ?? entry.paymentIntentId),
          )
          const nextEntry = {
            id: resolvedInvoice?.id ?? paymentIntentResult?.id ?? createHandoffId(null),
            createdAt: Date.now(),
            status: persistenceStatus,
            invoice: resolvedInvoice,
            order: orderRecord,
            cart: snapshot,
            paymentIntent: paymentIntentResult,
            paymentIntentId: paymentIntentResult?.id ?? null,
            user: user ? { id: user.id, name: user.name, email: user.email } : null,
            metadata: metadataPayload,
          }
          return [nextEntry, ...filtered]
        })
      }

      clearCart()
      setPaymentIntent({ id: null, clientSecret: null })
      setView('invoice')

      if (persistenceStatus === HANDOFF_STATUS_SYNCED) {
        setCheckoutError(null)
      } else if (persistenceError) {
        setCheckoutError(persistenceError)
        onPaymentError?.(persistenceError)
      }

      onInvoiceCreate?.(resolvedInvoice)
      onOrderComplete?.({
        invoice: resolvedInvoice,
        paymentIntent: paymentIntentResult,
        order: orderRecord,
        context,
      })

      if (persistenceStatus === HANDOFF_STATUS_SYNCED) {
        refreshHistory()
      }
    },
    [
      cartSnapshot,
      clearCart,
      createInvoiceMetadata,
      onInvoiceCreate,
      onOrderComplete,
      onPaymentError,
      posApi,
      refreshHistory,
      handoffStorage,
      supportsHandoffs,
      totals.currency,
      totals.promoCode,
      totals.total,
      updateHandoffs,
      user,
    ],
  )

  const handlePaymentError = useCallback(
    (error) => {
      setCheckoutError(error)
      onPaymentError?.(error)
    },
    [onPaymentError],
  )

  const handleSelectInvoiceFromOrder = useCallback(
    (order) => {
      if (!order) return

      const invoiceMatch = invoices.find(
        (invoice) =>
          invoice.id === order.invoiceId ||
          invoice.number === order.number ||
          invoice.paymentIntentId === order.paymentIntentId,
      )

      if (invoiceMatch) {
        setActiveInvoice(invoiceMatch)
        setView('invoice')
        return
      }

      const fallbackInvoice = buildInvoiceFromOrder(order)

      const invoiceId =
        order.invoiceId ?? order.invoice_id ?? order.number ?? order.id ?? order.paymentIntentId

      if (!posApi?.getInvoice || !invoiceId) {
        setActiveInvoice(fallbackInvoice)
        setView('invoice')
        return
      }

      setIsLoadingInvoices(true)

      posApi
        .getInvoice({ id: invoiceId })
        .then((fetchedInvoice) => {
          const resolved = fetchedInvoice ?? fallbackInvoice
          if (resolved) {
            setActiveInvoice(resolved)
            setInvoices((prev) => {
              const exists = prev.some((entry) => entry?.id === resolved.id)
              return exists ? prev : [resolved, ...prev]
            })
          } else {
            setActiveInvoice(fallbackInvoice)
          }
        })
        .catch((error) => {
          console.error('Failed to fetch invoice details', error)
          setActiveInvoice(fallbackInvoice)
        })
        .finally(() => {
          setIsLoadingInvoices(false)
          setView('invoice')
        })
    },
    [invoices, posApi],
  )

  const profileContext = useMemo(
    () => ({
      user,
      status: userStatus,
      loading: userLoading,
      updateProfile,
      logout,
      setStripeCustomerId,
    }),
    [logout, setStripeCustomerId, updateProfile, user, userLoading, userStatus],
  )

  useEffect(() => {
    if (!supportsHandoffs || !posApi?.createInvoice) return
    const pending = handoffs.filter((entry) => entry.status === HANDOFF_STATUS_PENDING)
    if (pending.length === 0) return

    let cancelled = false

    const syncPending = async () => {
      for (const entry of pending) {
        if (cancelled) return
        const paymentIntentPayload =
          entry.paymentIntent ?? (entry.paymentIntentId ? { id: entry.paymentIntentId } : null)
        const userSnapshot = entry.user ?? user
        try {
          const invoiceResponse = await posApi.createInvoice({
            cart: entry.cart,
            paymentIntent: paymentIntentPayload,
            user: userSnapshot,
            metadata: entry.metadata,
          })

          if (cancelled) return

          const resolvedInvoice =
            invoiceResponse?.invoice ?? invoiceResponse ?? entry.invoice ?? null
          const orderRecord =
            invoiceResponse?.order ??
            entry.order ??
            buildOrderFromInvoice(resolvedInvoice, {
              totals: entry.cart?.totals ?? totals,
              user: userSnapshot,
            })

          if (posApi.recordOrder && resolvedInvoice) {
            try {
              await posApi.recordOrder({
                invoice: resolvedInvoice,
                paymentIntent: paymentIntentPayload,
                cart: entry.cart,
                user: userSnapshot,
              })
            } catch (orderError) {
              console.error('Failed to sync offline order record', orderError)
            }
          }

          updateHandoffs((current) =>
            current.map((handoff) =>
              handoff.id === entry.id
                ? {
                    ...handoff,
                    status: HANDOFF_STATUS_SYNCED,
                    invoice: resolvedInvoice ?? handoff.invoice,
                    order: orderRecord ?? handoff.order,
                  }
                : handoff,
            ),
          )

          if (resolvedInvoice) {
            setInvoices((prev) =>
              mergeByKey(prev, [resolvedInvoice], (item) => item?.id ?? item?.number),
            )
          }

          if (orderRecord) {
            setOrders((prev) => mergeByKey(prev, [orderRecord], (item) => item?.id ?? item?.number))
          }
        } catch (error) {
          if (cancelled) return
          console.error('Failed to sync POS handoff', error)
        }
      }
    }

    syncPending()

    return () => {
      cancelled = true
    }
  }, [handoffs, posApi, supportsHandoffs, totals, updateHandoffs, user])

  const profileNode = useMemo(() => {
    if (renderProfile) {
      return renderProfile(profileContext)
    }
    return (
      <UserProfile
        onUpdate={(next) => {
          updateProfile(next)
          posApi?.updateCustomer?.({ user: { ...user, ...next } })
        }}
        onLogout={() => logout()}
        onLinkCustomer={(customerId) => {
          setStripeCustomerId(customerId)
          if (user) {
            posApi?.updateCustomer?.({
              user: { ...user, stripeCustomerId: customerId },
            })
          }
        }}
      />
    )
  }, [logout, posApi, profileContext, renderProfile, setStripeCustomerId, updateProfile, user])

  const productListNode = (
    <ProductList
      products={products}
      isLoading={isLoadingProducts}
      error={productsError}
      onRefresh={posApi?.listProducts ? loadProducts : undefined}
      catalog={catalog}
    />
  )

  const cartNode = <ShoppingCart />

  const checkoutMetadata = useMemo(
    () => ({
      userId: user?.id,
      promoCode: totals.promoCode,
      cartTotal: totals.total,
    }),
    [totals.promoCode, totals.total, user?.id],
  )

  const confirmPaymentHandler = useCallback((params) => confirmPayment(params), [confirmPayment])

  const checkoutForm = (
    <CheckoutForm
      amount={totals.total}
      currency={totals.currency}
      clientSecret={paymentIntent.clientSecret}
      confirmPayment={confirmPaymentHandler}
      billingDetails={{ name: user?.name, email: user?.email }}
      metadata={checkoutMetadata}
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentError={handlePaymentError}
      disabled={isCreatingPaymentIntent || items.length === 0}
    />
  )

  let checkoutNode = checkoutForm
  if (withElements) {
    if (stripeError) {
      checkoutNode = (
        <div role="alert" className="gg-pos__checkout-error">
          <p>Failed to load Stripe: {stripeError.message}</p>
        </div>
      )
    } else if (!stripe) {
      checkoutNode = <p role="status">Loading payment SDK…</p>
    } else {
      checkoutNode = (
        <Elements
          key={paymentIntent.clientSecret ?? 'stripe-elements'}
          stripe={stripe}
          options={
            paymentIntent.clientSecret ? { clientSecret: paymentIntent.clientSecret } : undefined
          }
        >
          {checkoutForm}
        </Elements>
      )
    }
  }

  const checkoutContainer = (
    <div className="gg-pos__checkout-container">
      {checkoutError && (
        <div role="alert" className="gg-pos__checkout-error">
          <p>{checkoutError.message ?? String(checkoutError)}</p>
        </div>
      )}
      {checkoutNode}
      {isCreatingPaymentIntent && (
        <p role="status" className="gg-pos__checkout-status">
          Creating payment intent for {formatMoney(totals.total, totals.currency)}…
        </p>
      )}
    </div>
  )

  if (view === 'invoice') {
    const invoice = activeInvoice ?? invoices[0]
    return (
      <InvoiceComponent
        invoice={invoice}
        renderInvoice={(payload) => (
          <InvoiceView
            invoice={payload}
            onDownload={() => window.print?.()}
            onSend={(inv) => posApi?.createInvoice?.(inv)}
            onClose={() => setView('pos')}
          />
        )}
        onBack={() => setView('pos')}
        onHistory={() => setView('history')}
      />
    )
  }

  if (view === 'history') {
    return (
      <HistoryComponent
        orders={orders}
        renderHistory={(records) => (
          <OrderHistory
            orders={records}
            onSelectInvoice={handleSelectInvoiceFromOrder}
            onRefresh={refreshHistory}
            isLoading={isLoadingOrders}
          />
        )}
        onBack={() => setView('pos')}
      />
    )
  }

  return (
    <POSComponent
      productList={productListNode}
      cart={cartNode}
      checkout={checkoutContainer}
      userProfile={profileNode}
      onViewHistory={() => setView('history')}
      onViewInvoices={() => {
        setActiveInvoice(invoices[0] ?? null)
        setView('invoice')
      }}
      onViewProfile={() => setView('pos')}
    />
  )
}

export function PointOfSale({
  withProviders = true,
  withElements = true,
  initialCart,
  cartStorage,
  cartStorageKey = 'guidogerb.pos.cart',
  offlineStorage,
  offlineStorageKey = 'guidogerb.pos.offline',
  currency = 'USD',
  taxRate = 0,
  discountRate = 0,
  promoCodes = {},
  initialUser,
  userStorage,
  userStorageKey = 'guidogerb.pos.user',
  stripePromise,
  stripePublicKey,
  stripeOptions,
  ...experienceProps
}) {
  const offlineCache = useMemo(() => {
    const storageSource =
            offlineStorage ?? (typeof window !== 'undefined' ? window.localStorage ?? null : null)
    return createOfflineCache(storageSource, offlineStorageKey)
  }, [offlineStorage, offlineStorageKey])

  const resolvedCartStorage = useMemo(() => {
    if (cartStorage) return cartStorage
    if (!offlineCache) return undefined

    const listeners = new Set()

    const notify = (event) => {
      listeners.forEach((listener) => {
        try {
          listener(event)
        } catch (error) {
          // Ignore listener errors so persistence never blocks rendering.
        }
      })
    }

    return {
      get(key) {
        if (!key) {
          return offlineCache.get('cartState')
        }
        const namespaced = offlineCache.get(`cart:${key}`)
        return namespaced === undefined ? offlineCache.get('cartState') : namespaced
      },
      set(key, value) {
        if (!key) return value
        offlineCache.set(`cart:${key}`, value)
        offlineCache.set('cartState', value)
        notify({ type: 'set', key, value })
        return value
      },
      remove(key) {
        if (!key) return
        offlineCache.remove(`cart:${key}`)
        offlineCache.remove('cartState')
        notify({ type: 'remove', key })
      },
      subscribe(listener) {
        if (typeof listener !== 'function') return () => {}
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
        }
      },
    }
  }, [cartStorage, offlineCache])

  const [hydratedInitialCart] = useState(() => {
    if (initialCart !== undefined) return initialCart
    if (resolvedCartStorage?.get) {
      const stored = resolvedCartStorage.get(cartStorageKey)
      if (stored !== undefined) return stored
    }
    if (offlineCache) {
      const fallback = offlineCache.get('cartState')
      if (fallback !== undefined) return fallback
    }
    return initialCart
  })

  const [stripe, setStripe] = useState(null)
  const [stripeError, setStripeError] = useState(null)

  useEffect(() => {
    if (!withElements) return undefined
    let cancelled = false

    const resolveStripe = async () => {
      try {
        const instance = await (stripePromise
          ? Promise.resolve(stripePromise)
          : loadStripeInstance(stripePublicKey, stripeOptions))
        if (!cancelled) setStripe(instance)
      } catch (error) {
        if (!cancelled) setStripeError(error)
      }
    }

    resolveStripe()

    return () => {
      cancelled = true
    }
  }, [stripePromise, stripePublicKey, stripeOptions, withElements])

  const content = (
    <PointOfSaleExperience
      {...experienceProps}
      stripe={stripe}
      stripeError={stripeError}
      withElements={withElements}
      offlineCache={offlineCache}
    />
  )

  if (!withProviders) {
    return content
  }

  return (
    <UserProvider initialUser={initialUser} storage={userStorage} storageKey={userStorageKey}>
      <CartProvider
        initialCart={hydratedInitialCart}
        storage={resolvedCartStorage}
        storageKey={cartStorageKey}
        currency={currency}
        taxRate={taxRate}
        discountRate={discountRate}
        promoCodes={promoCodes}
      >
        {content}
      </CartProvider>
    </UserProvider>
  )
}

export default PointOfSale
