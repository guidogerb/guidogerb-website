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
import {
  confirmStripePayment,
  loadStripeInstance,
} from './services/stripe.js'

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
  const [orders, setOrders] = useState([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [activeInvoice, setActiveInvoice] = useState(null)
  const [checkoutError, setCheckoutError] = useState(null)
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState({ id: null, clientSecret: null })

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

      try {
        let invoiceResponse = null
        if (posApi?.createInvoice) {
          invoiceResponse = await posApi.createInvoice({
            cart: snapshot,
            paymentIntent: paymentIntentResult,
            user,
            metadata: createInvoiceMetadata?.({
              paymentIntent: paymentIntentResult,
              cart: snapshot,
              user,
              context,
            }),
          })
        }

        const resolvedInvoice =
          invoiceResponse?.invoice ?? invoiceResponse ?? {
            id: paymentIntentResult?.id,
            number: paymentIntentResult?.id,
            status: paymentIntentResult?.status ?? 'SUCCEEDED',
            issuedAt: new Date().toISOString(),
            customer: { name: user?.name, email: user?.email },
            items: snapshot.items,
            totals: snapshot.totals,
          }

        setActiveInvoice(resolvedInvoice)
        setInvoices((prev) => {
          if (!resolvedInvoice) return prev
          const exists = prev.some((entry) => entry.id === resolvedInvoice.id)
          return exists ? prev : [resolvedInvoice, ...prev]
        })

        const orderRecord =
          invoiceResponse?.order ?? {
            id: resolvedInvoice?.id ?? paymentIntentResult?.id,
            number: resolvedInvoice?.number ?? resolvedInvoice?.id,
            status: resolvedInvoice?.status ?? paymentIntentResult?.status ?? 'SUCCEEDED',
            total: {
              amount: resolvedInvoice?.totals?.total ?? totals.total,
              currency: resolvedInvoice?.totals?.currency ?? totals.currency,
            },
            customer: resolvedInvoice?.customer ?? {
              email: user?.email,
              name: user?.name,
            },
            createdAt: resolvedInvoice?.issuedAt ?? new Date().toISOString(),
          }

        setOrders((prev) => [orderRecord, ...prev])

        if (posApi?.recordOrder) {
          await posApi.recordOrder({
            invoice: resolvedInvoice,
            paymentIntent: paymentIntentResult,
            cart: snapshot,
            user,
          })
        }

        clearCart()
        setPaymentIntent({ id: null, clientSecret: null })
        setView('invoice')
        setCheckoutError(null)
        onInvoiceCreate?.(resolvedInvoice)
        onOrderComplete?.({
          invoice: resolvedInvoice,
          paymentIntent: paymentIntentResult,
          order: orderRecord,
          context,
        })
        refreshHistory()
      } catch (error) {
        setCheckoutError(error)
        onPaymentError?.(error)
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
      totals.currency,
      totals.promoCode,
      totals.total,
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
      const invoiceMatch = invoices.find(
        (invoice) =>
          invoice.id === order.invoiceId ||
          invoice.number === order.number ||
          invoice.paymentIntentId === order.paymentIntentId,
      )
      setActiveInvoice(invoiceMatch ?? buildInvoiceFromOrder(order))
      setView('invoice')
    },
    [invoices],
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

  const confirmPaymentHandler = useCallback(
    (params) => confirmPayment(params),
    [confirmPayment],
  )

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
            paymentIntent.clientSecret
              ? { clientSecret: paymentIntent.clientSecret }
              : undefined
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
    />
  )

  if (!withProviders) {
    return content
  }

  return (
    <UserProvider
      initialUser={initialUser}
      storage={userStorage}
      storageKey={userStorageKey}
    >
      <CartProvider
        initialCart={initialCart}
        storage={cartStorage}
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
