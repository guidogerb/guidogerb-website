/** @jsxImportSource react */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@stripe/react-stripe-js', () => {
  const Context = React.createContext({ stripe: null, elements: null })
  const Elements = ({ children, stripe, options }) => {
    const elements = {
      getElement: vi.fn(),
      options,
    }
    return React.createElement(Context.Provider, { value: { stripe, elements } }, children)
  }
  const useStripe = () => React.useContext(Context).stripe
  const useElements = () => React.useContext(Context).elements
  const PaymentElement = (props) =>
    React.createElement('div', { ...props, 'data-testid': 'payment-element' })
  const CardElement = (props) =>
    React.createElement('div', { ...props, 'data-testid': 'card-element' })
  return {
    Elements,
    useStripe,
    useElements,
    PaymentElement,
    CardElement,
  }
})

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(),
}))

vi.mock('@guidogerb/components-shopping-cart', () => {
  const React = require('react')
  const CartContext = React.createContext()

  const ensureNumber = (value, fallback = 0) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const formatCurrency = (value, currency) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
      }).format(value / 100)
    } catch (error) {
      return `$${(value / 100).toFixed(2)}`
    }
  }

  const transformProduct = (product = {}) => ({
    id: product.id ?? product.sku ?? product.lineId ?? `product-${Date.now()}`,
    lineId: product.lineId ?? product.id ?? product.sku ?? `line-${Date.now()}`,
    name: product.title ?? product.name ?? 'Product',
    description: product.description ?? '',
    price: product.price ?? { amount: 0, currency: 'USD' },
    quantity: ensureNumber(product.quantity, 1),
    metadata: product.metadata ?? {},
  })

  const CartProvider = ({
    children,
    initialCart,
    storage,
    storageKey = 'cart',
    currency = 'USD',
  }) => {
    const initialItems = React.useMemo(
      () => (Array.isArray(initialCart?.items) ? initialCart.items : []),
      [initialCart?.items],
    )
    const initialCurrency = React.useMemo(
      () => initialCart?.currency ?? initialCart?.totals?.currency ?? currency,
      [currency, initialCart?.currency, initialCart?.totals?.currency],
    )

    const [items, setItems] = React.useState(initialItems)
    const [cartCurrency, setCartCurrency] = React.useState(initialCurrency)

    const persistState = React.useCallback(
      (nextItems) => {
        if (!storage?.set) return
        const subtotal = nextItems.reduce(
          (sum, item) => sum + ensureNumber(item.price?.amount) * ensureNumber(item.quantity, 1),
          0,
        )
        const payloadCurrency =
          nextItems.find((item) => item?.price?.currency)?.price?.currency ??
          cartCurrency ??
          currency ??
          'USD'
        const payload = {
          items: nextItems,
          currency: payloadCurrency,
          totals: {
            subtotal,
            discount: 0,
            tax: 0,
            total: subtotal,
            currency: payloadCurrency,
          },
          promoCode: initialCart?.promoCode ?? null,
          customTaxRate: initialCart?.customTaxRate ?? null,
          customDiscountRate: initialCart?.customDiscountRate ?? null,
          shipping: initialCart?.shipping ?? 0,
          updatedAt: new Date().toISOString(),
        }
        storage.set(storageKey, payload)
      },
      [cartCurrency, currency, initialCart, storage, storageKey],
    )

    React.useEffect(() => {
      persistState(items)
    }, [items, persistState])

    const addItem = React.useCallback((product) => {
      const transformed = transformProduct(product)
      setCartCurrency(transformed.price?.currency ?? cartCurrency ?? currency ?? 'USD')
      setItems((prev) => {
        const existing = prev.find((item) => item.id === transformed.id)
        if (existing) {
          const updated = prev.map((item) =>
            item.id === transformed.id
              ? {
                  ...item,
                  quantity: ensureNumber(item.quantity, 1) + ensureNumber(transformed.quantity, 1),
                }
              : item,
          )
          persistState(updated)
          return updated
        }
        const nextItems = [...prev, transformed]
        persistState(nextItems)
        return nextItems
      })
    }, [cartCurrency, currency, persistState])

    const clearCart = React.useCallback(() => {
      setItems((prev) => {
        if (prev.length === 0) {
          persistState(prev)
          return prev
        }
        const emptied = []
        persistState(emptied)
        return emptied
      })
    }, [persistState])

    const totals = React.useMemo(() => {
      const subtotal = items.reduce(
        (sum, item) => sum + ensureNumber(item.price?.amount) * ensureNumber(item.quantity, 1),
        0,
      )
      return {
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        currency: cartCurrency ?? currency ?? 'USD',
      }
    }, [cartCurrency, currency, items])

    const value = React.useMemo(
      () => ({ items, totals, addItem, clearCart }),
      [addItem, clearCart, items, totals],
    )

    return React.createElement(CartContext.Provider, { value }, children)
  }

  const useCart = () => React.useContext(CartContext)

  const ShoppingCart = () => {
    const { items, totals } = useCart()
    if (items.length === 0) {
      return React.createElement('p', null, 'Your cart is empty.')
    }
    return React.createElement(
      'div',
      null,
      React.createElement(
        'ul',
        { 'data-testid': 'cart-items' },
        items.map((item) =>
          React.createElement(
            'li',
            { key: item.id },
            `${item.name} × ${ensureNumber(item.quantity, 1)}`,
          ),
        ),
      ),
      React.createElement(
        'span',
        null,
        `Total ${formatCurrency(totals.total, totals.currency)}`,
      ),
    )
  }

  const CheckoutForm = ({
    confirmPayment,
    onPaymentSuccess,
    onPaymentError,
    clientSecret,
    amount,
    currency,
    metadata,
  }) => {
    const handleConfirm = async () => {
      try {
        const result = await confirmPayment({ clientSecret, amount, currency, metadata })
        onPaymentSuccess(result.paymentIntent, {})
      } catch (error) {
        onPaymentError?.(error)
      }
    }

    return React.createElement(
      'button',
      { type: 'button', onClick: handleConfirm },
      'Confirm Payment',
    )
  }

  return {
    __esModule: true,
    CartProvider,
    ShoppingCart,
    CheckoutForm,
    useCart,
  }
})

vi.mock(
  '@guidogerb/components-analytics',
  () => ({
    __esModule: true,
    buildAddToCartEvent: vi.fn(() => ({ name: 'add_to_cart', params: {} })),
    useAnalytics: () => ({ trackEvent: vi.fn() }),
  }),
  { virtual: true },
)

import { Elements } from '@stripe/react-stripe-js'
import { PointOfSale } from '../PointOfSale.jsx'

const createOfflineStorage = () => {
  const store = new Map()
  return {
    store,
    getItem(key) {
      return store.has(key) ? store.get(key) : null
    },
    setItem(key, value) {
      store.set(key, String(value))
    },
    removeItem(key) {
      store.delete(key)
    },
  }
}

describe('PointOfSale', () => {
  it('renders catalog, processes payment, and shows invoice + history', async () => {
    const invoiceStore = []
    const orderStore = []

    const mockApi = {
      listProducts: vi.fn().mockResolvedValue([
        {
          id: 'prod-1',
          title: 'Vinyl Album',
          description: 'Limited pressing',
          price: { amount: 5000, currency: 'USD' },
          availability: { status: 'AVAILABLE', fulfillment: 'PHYSICAL' },
        },
      ]),
      createPaymentIntent: vi.fn().mockResolvedValue({ id: 'pi_123', clientSecret: 'cs_test_123' }),
      createInvoice: vi.fn().mockImplementation(({ cart, paymentIntent, user }) => {
        const invoice = {
          id: 'inv_001',
          number: 'INV-001',
          status: 'PAID',
          issuedAt: '2024-01-01T00:00:00.000Z',
          customer: { name: user?.name, email: user?.email },
          items: cart.items,
          totals: {
            subtotal: cart.totals.subtotal,
            tax: cart.totals.tax,
            discount: cart.totals.discount,
            total: cart.totals.total,
            currency: cart.totals.currency,
          },
        }
        const order = {
          id: 'order-001',
          number: invoice.number,
          status: 'PAID',
          customer: invoice.customer,
          total: {
            amount: invoice.totals.total,
            currency: invoice.totals.currency,
          },
          createdAt: invoice.issuedAt,
        }
        invoiceStore.unshift(invoice)
        orderStore.unshift(order)
        return Promise.resolve({ invoice, order })
      }),
      listInvoices: vi.fn().mockImplementation(() => Promise.resolve([...invoiceStore])),
      listOrders: vi.fn().mockImplementation(() => Promise.resolve([...orderStore])),
      recordOrder: vi.fn().mockResolvedValue({}),
    }

    const mockConfirmPayment = vi.fn().mockImplementation(async ({ clientSecret }) => ({
      paymentIntent: {
        id: 'pi_123',
        status: 'succeeded',
        client_secret: clientSecret,
      },
    }))

    const onOrderComplete = vi.fn()
    const onInvoiceCreate = vi.fn()

    const mockStripe = { confirmPayment: mockConfirmPayment }

    const initialUser = {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    }

    const user = userEvent.setup()

    render(
      <Elements stripe={mockStripe}>
        <PointOfSale
          withElements={false}
          api={mockApi}
          confirmPayment={mockConfirmPayment}
          initialUser={initialUser}
          onOrderComplete={onOrderComplete}
          onInvoiceCreate={onInvoiceCreate}
          serviceWorker={{ enabled: false }}
        />
      </Elements>,
    )

    await waitFor(() => expect(mockApi.listProducts).toHaveBeenCalled())

    const addButton = await screen.findByRole('button', { name: /add to cart/i })
    await user.click(addButton)

    await waitFor(() => expect(mockApi.createPaymentIntent).toHaveBeenCalledTimes(1))
    expect(screen.getAllByText('$50.00').length).toBeGreaterThan(0)

    const confirmButton = await screen.findByRole('button', { name: /confirm payment/i })
    await user.click(confirmButton)

    await waitFor(() => expect(mockConfirmPayment).toHaveBeenCalled())
    await waitFor(() => expect(mockApi.createInvoice).toHaveBeenCalled())
    await waitFor(() => expect(onInvoiceCreate).toHaveBeenCalled())
    await waitFor(() => expect(onOrderComplete).toHaveBeenCalled())

    expect(await screen.findByText(/Invoice #INV-001/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Total/i).length).toBeGreaterThan(0)

    const historyButton = screen.getByRole('button', { name: /order history/i })
    await user.click(historyButton)

    await waitFor(() => expect(mockApi.listOrders.mock.calls.length).toBeGreaterThanOrEqual(2))
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.getByText('INV-001')).toBeInTheDocument()

    const backButton = screen.getByRole('button', { name: /back to pos/i })
    await user.click(backButton)

    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument()
    expect(mockApi.recordOrder).toHaveBeenCalled()
  })

  it('persists cart and invoices to offline storage after checkout', async () => {
    const offlineStorage = createOfflineStorage()
    const invoiceStore = []
    const orderStore = []

    const mockApi = {
      listProducts: vi.fn().mockResolvedValue([
        {
          id: 'prod-2',
          title: 'Signed Poster',
          description: 'Limited edition',
          price: { amount: 2500, currency: 'USD' },
          availability: { status: 'AVAILABLE', fulfillment: 'PHYSICAL' },
        },
      ]),
      createPaymentIntent: vi
        .fn()
        .mockResolvedValue({ id: 'pi_456', clientSecret: 'cs_test_456' }),
      createInvoice: vi.fn().mockImplementation(({ cart, paymentIntent, user }) => {
        const invoice = {
          id: 'inv_200',
          number: 'INV-200',
          status: 'PAID',
          issuedAt: '2024-02-01T00:00:00.000Z',
          customer: { name: user?.name, email: user?.email },
          items: cart.items,
          totals: {
            subtotal: cart.totals.subtotal,
            tax: cart.totals.tax,
            discount: cart.totals.discount,
            total: cart.totals.total,
            currency: cart.totals.currency,
          },
        }
        const order = {
          id: 'order-200',
          number: invoice.number,
          status: 'PAID',
          customer: invoice.customer,
          total: {
            amount: invoice.totals.total,
            currency: invoice.totals.currency,
          },
          createdAt: invoice.issuedAt,
        }
        invoiceStore.unshift(invoice)
        orderStore.unshift(order)
        return Promise.resolve({ invoice, order })
      }),
      listInvoices: vi.fn().mockImplementation(() => Promise.resolve([...invoiceStore])),
      listOrders: vi.fn().mockImplementation(() => Promise.resolve([...orderStore])),
      recordOrder: vi.fn().mockResolvedValue({}),
    }

    const mockConfirmPayment = vi.fn().mockImplementation(async ({ clientSecret }) => ({
      paymentIntent: {
        id: 'pi_456',
        status: 'succeeded',
        client_secret: clientSecret,
      },
    }))

    const initialUser = {
      id: 'user-2',
      name: 'Grace Hopper',
      email: 'grace@example.com',
    }

    const user = userEvent.setup()

    render(
      <Elements stripe={{}}>
        <PointOfSale
          withElements={false}
          api={mockApi}
          confirmPayment={mockConfirmPayment}
          initialUser={initialUser}
          offlineStorage={offlineStorage}
          offlineStorageKey="test.offline"
          cartStorageKey="test.cart"
          serviceWorker={{ enabled: false }}
        />
      </Elements>,
    )

    const addButton = await screen.findByRole('button', { name: /add to cart/i })
    await user.click(addButton)

    const confirmButton = await screen.findByRole('button', { name: /confirm payment/i })
    await user.click(confirmButton)

    await waitFor(() => expect(mockConfirmPayment).toHaveBeenCalled())
    await waitFor(() => expect(mockApi.createInvoice).toHaveBeenCalled())

    await waitFor(() => {
      const storedOrders = offlineStorage.getItem('test.offline:orders')
      expect(storedOrders).toBeTruthy()
    })

    const storedOrders = JSON.parse(offlineStorage.getItem('test.offline:orders') ?? '[]')
    const storedInvoices = JSON.parse(offlineStorage.getItem('test.offline:invoices') ?? '[]')
    const storedActiveInvoice = JSON.parse(
      offlineStorage.getItem('test.offline:activeInvoice') ?? 'null',
    )
    const storedCart = JSON.parse(
      offlineStorage.getItem('test.offline:cart:test.cart') ?? 'null',
    )

    expect(storedOrders).toHaveLength(1)
    expect(storedOrders[0].number).toBe('INV-200')
    expect(storedInvoices).toHaveLength(1)
    expect(storedInvoices[0].number).toBe('INV-200')
    expect(storedActiveInvoice?.number).toBe('INV-200')
    expect(storedCart).toBeTruthy()
    expect(Array.isArray(storedCart.items)).toBe(true)
  })

  it('recovers persisted invoices, orders, and cart when offline', async () => {
    const offlineStorage = createOfflineStorage()
    const offlineCartState = {
      items: [
        {
          id: 'prod-42',
          lineId: 'prod-42',
          sku: 'prod-42',
          name: 'Offline Coffee',
          description: 'Stored while offline',
          price: { amount: 1200, currency: 'USD' },
          quantity: 1,
          metadata: {},
          categories: [],
          includeInTotals: true,
          trackInventory: true,
          inventoryId: 'prod-42',
          bundleItems: [],
        },
      ],
      promoCode: null,
      customTaxRate: null,
      customDiscountRate: null,
      shipping: 0,
      updatedAt: '2024-02-01T00:00:00.000Z',
      currency: 'USD',
    }

    const offlineInvoice = {
      id: 'inv-off-1',
      number: 'OFF-1',
      status: 'PAID',
      issuedAt: '2024-02-02T00:00:00.000Z',
      customer: { name: 'Offline Customer', email: 'offline@example.com' },
      items: [
        {
          id: 'prod-42',
          name: 'Offline Coffee',
          quantity: 1,
          unitPrice: { amount: 1200, currency: 'USD' },
          total: { amount: 1200, currency: 'USD' },
        },
      ],
      totals: { subtotal: 1200, discount: 0, tax: 0, total: 1200, currency: 'USD' },
    }

    const offlineOrder = {
      id: 'order-off-1',
      number: 'OFF-1',
      status: 'PAID',
      total: { amount: 1200, currency: 'USD' },
      customer: { email: 'offline@example.com' },
      createdAt: '2024-02-02T00:00:00.000Z',
    }

    offlineStorage.setItem('test.offline:cart:test.cart', JSON.stringify(offlineCartState))
    offlineStorage.setItem('test.offline:cartState', JSON.stringify(offlineCartState))
    offlineStorage.setItem('test.offline:invoices', JSON.stringify([offlineInvoice]))
    offlineStorage.setItem('test.offline:orders', JSON.stringify([offlineOrder]))
    offlineStorage.setItem('test.offline:activeInvoice', JSON.stringify(offlineInvoice))

    const mockApi = {
      listProducts: vi.fn().mockResolvedValue([]),
      listInvoices: vi.fn().mockRejectedValue(new Error('offline')), 
      listOrders: vi.fn().mockRejectedValue(new Error('offline')),
    }

    const initialUser = {
      id: 'offline-user',
      name: 'Offline User',
      email: 'offline@example.com',
    }

    const user = userEvent.setup()

    render(
      <Elements stripe={{}}>
        <PointOfSale
          withElements={false}
          api={mockApi}
          initialUser={initialUser}
          offlineStorage={offlineStorage}
          offlineStorageKey="test.offline"
          cartStorageKey="test.cart"
          serviceWorker={{ enabled: false }}
        />
      </Elements>,
    )

    expect(await screen.findByText(/Offline Coffee/i)).toBeInTheDocument()

    const invoiceButton = screen.getByRole('button', { name: /invoices/i })
    await user.click(invoiceButton)

    expect(await screen.findByText(/Invoice #OFF-1/i)).toBeInTheDocument()
    expect(screen.getByText(/offline customer/i)).toBeInTheDocument()

    const historyButton = screen.getByRole('button', { name: /order history/i })
    await user.click(historyButton)

    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.getByText('OFF-1')).toBeInTheDocument()
  })
})
