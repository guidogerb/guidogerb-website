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

    const addItem = React.useCallback(
      (product) => {
        const transformed = transformProduct(product)
        setCartCurrency(transformed.price?.currency ?? cartCurrency ?? currency ?? 'USD')
        setItems((prev) => {
          const existing = prev.find((item) => item.id === transformed.id)
          if (existing) {
            const updated = prev.map((item) =>
              item.id === transformed.id
                ? {
                    ...item,
                    quantity:
                      ensureNumber(item.quantity, 1) + ensureNumber(transformed.quantity, 1),
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
      },
      [cartCurrency, currency, persistState],
    )

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
      React.createElement('span', null, `Total ${formatCurrency(totals.total, totals.currency)}`),
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

const createMockStorage = () => {
  const store = new Map()
  const listeners = new Set()

  return {
    namespace: 'test',
    get: vi.fn((key, fallback) => (store.has(key) ? store.get(key) : fallback)),
    set: vi.fn((key, value) => {
      store.set(key, value)
      listeners.forEach((listener) => listener({ type: 'set', key, value, namespace: 'test' }))
      return value
    }),
    subscribe: vi.fn((listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }),
    snapshot: () => Object.fromEntries(store.entries()),
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

  it('fetches invoice details when order is selected without local cache', async () => {
    const mockApi = {
      listProducts: vi.fn().mockResolvedValue([]),
      listInvoices: vi.fn().mockResolvedValue([]),
      listOrders: vi.fn().mockResolvedValue([
        {
          id: 'order-200',
          number: 'INV-200',
          status: 'PAID',
          customer: { email: 'customer@example.com' },
          total: { amount: 4200, currency: 'USD' },
          createdAt: '2024-02-02T00:00:00.000Z',
          invoiceId: 'inv_200',
        },
      ]),
      createPaymentIntent: vi.fn(),
      getInvoice: vi.fn().mockResolvedValue({
        id: 'inv_200',
        number: 'INV-200',
        status: 'PAID',
        issuedAt: '2024-02-02T00:00:00.000Z',
        customer: { name: 'Grace Hopper', email: 'customer@example.com' },
        items: [
          {
            id: 'prod-1',
            name: 'Cloud Seat',
            quantity: 1,
            unitPrice: { amount: 4200, currency: 'USD' },
            total: { amount: 4200, currency: 'USD' },
          },
        ],
        totals: {
          subtotal: 4200,
          tax: 0,
          discount: 0,
          total: 4200,
          currency: 'USD',
        },
      }),
    }

    const user = userEvent.setup()

    render(
      <PointOfSale
        withElements={false}
        api={mockApi}
        initialUser={{ id: 'user-42', name: 'Grace Hopper', email: 'customer@example.com' }}
      />,
    )

    await waitFor(() => expect(mockApi.listOrders).toHaveBeenCalledTimes(1))

    const historyButton = await screen.findByRole('button', { name: /order history/i })
    await user.click(historyButton)

    const viewInvoiceButton = await screen.findByRole('button', { name: /view invoice/i })
    await user.click(viewInvoiceButton)

    await waitFor(() => expect(mockApi.getInvoice).toHaveBeenCalledWith({ id: 'inv_200' }))

    expect(await screen.findByRole('heading', { name: /Invoice #INV-200/i })).toBeInTheDocument()
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
  })

  it('persists handoff entries after successful checkout', async () => {
    const storage = createMockStorage()
    const invoiceStore = []
    const orderStore = []

    const mockApi = {
      listProducts: vi.fn().mockResolvedValue([
        {
          id: 'prod-2',
          title: 'Digital Lesson',
          description: 'Remote session',
          price: { amount: 7500, currency: 'USD' },
          availability: { status: 'AVAILABLE', fulfillment: 'DIGITAL' },
        },
      ]),
      createPaymentIntent: vi.fn().mockResolvedValue({ id: 'pi_456', clientSecret: 'cs_test_456' }),
      createInvoice: vi.fn().mockImplementation(({ cart, paymentIntent, user }) => {
        const invoice = {
          id: 'inv_200',
          number: 'INV-200',
          status: 'PAID',
          issuedAt: '2024-05-01T00:00:00.000Z',
          customer: { name: user?.name, email: user?.email },
          items: cart.items,
          totals: cart.totals,
        }
        const order = {
          id: 'order-200',
          number: invoice.number,
          status: invoice.status,
          customer: invoice.customer,
          total: { amount: invoice.totals.total, currency: invoice.totals.currency },
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

    const mockConfirmPayment = vi.fn().mockResolvedValue({
      paymentIntent: { id: 'pi_456', status: 'succeeded', client_secret: 'cs_test_456' },
    })

    const user = userEvent.setup()

    render(
      <Elements stripe={{}}>
        <PointOfSale
          withElements={false}
          api={mockApi}
          confirmPayment={mockConfirmPayment}
          initialUser={{ id: 'user-2', name: 'Nina Simone', email: 'nina@example.com' }}
          handoffStorage={storage}
        />
      </Elements>,
    )

    const addButton = await screen.findByRole('button', { name: /add to cart/i })
    await user.click(addButton)

    await waitFor(() => expect(mockApi.createPaymentIntent).toHaveBeenCalled())

    const confirmButton = await screen.findByRole('button', { name: /confirm payment/i })
    await waitFor(() => expect(confirmButton).not.toBeDisabled())
    await user.click(confirmButton)

    await waitFor(() => expect(mockConfirmPayment).toHaveBeenCalled())
    await waitFor(() => expect(mockApi.createInvoice).toHaveBeenCalled())

    expect(await screen.findByText(/Invoice #INV-200/i)).toBeInTheDocument()

    const lastPersistCall = storage.set.mock.calls[storage.set.mock.calls.length - 1]
    const [, persisted] = lastPersistCall
    expect(Array.isArray(persisted)).toBe(true)
    expect(persisted[0]).toMatchObject({
      status: 'synced',
      invoice: expect.objectContaining({ id: 'inv_200' }),
      order: expect.objectContaining({ id: 'order-200' }),
    })
  })

  it('queues pending handoffs when invoice persistence fails', async () => {
    const storage = createMockStorage()
    const mockApi = {
      listProducts: vi.fn().mockResolvedValue([
        {
          id: 'prod-3',
          title: 'Workshop Ticket',
          description: 'Limited seats',
          price: { amount: 15000, currency: 'USD' },
          availability: { status: 'AVAILABLE', fulfillment: 'EVENT' },
        },
      ]),
      createPaymentIntent: vi.fn().mockResolvedValue({ id: 'pi_789', clientSecret: 'cs_test_789' }),
      createInvoice: vi.fn().mockRejectedValue(new Error('offline')),
      listInvoices: vi.fn().mockResolvedValue([]),
      listOrders: vi.fn().mockResolvedValue([]),
      recordOrder: vi.fn(),
    }

    const mockConfirmPayment = vi.fn().mockResolvedValue({
      paymentIntent: { id: 'pi_789', status: 'succeeded', client_secret: 'cs_test_789' },
    })

    const user = userEvent.setup()

    render(
      <Elements stripe={{}}>
        <PointOfSale
          withElements={false}
          api={mockApi}
          confirmPayment={mockConfirmPayment}
          initialUser={{ id: 'user-3', name: 'Ella Fitzgerald', email: 'ella@example.com' }}
          handoffStorage={storage}
        />
      </Elements>,
    )

    const addButton = await screen.findByRole('button', { name: /add to cart/i })
    await user.click(addButton)

    await waitFor(() => expect(mockApi.createPaymentIntent).toHaveBeenCalled())

    const confirmButton = await screen.findByRole('button', { name: /confirm payment/i })
    await waitFor(() => expect(confirmButton).not.toBeDisabled())
    await user.click(confirmButton)

    await waitFor(() => expect(mockConfirmPayment).toHaveBeenCalled())
    await waitFor(() => expect(mockApi.createInvoice).toHaveBeenCalled())

    expect(await screen.findByText(/Invoice #pi_789/i)).toBeInTheDocument()

    const lastPersistedCall = storage.set.mock.calls[storage.set.mock.calls.length - 1]
    const [, persisted] = lastPersistedCall
    expect(persisted[0]).toMatchObject({ status: 'pending' })
  })

  it('hydrates invoices from stored handoffs on mount', async () => {
    const storage = createMockStorage()
    const offlineInvoice = {
      id: 'inv_offline',
      number: 'INV-OFFLINE',
      status: 'PENDING',
      issuedAt: '2024-06-01T12:00:00.000Z',
      customer: { name: 'Offline User', email: 'offline@example.com' },
      items: [
        {
          id: 'prod-offline',
          name: 'Offline Bundle',
          quantity: 1,
          unitPrice: { amount: 9900, currency: 'USD' },
          total: { amount: 9900, currency: 'USD' },
        },
      ],
      totals: { subtotal: 9900, tax: 0, discount: 0, total: 9900, currency: 'USD' },
    }

    storage.set('guidogerb.pos.handoffs', [
      {
        id: 'handoff-offline',
        status: 'pending',
        invoice: offlineInvoice,
        order: {
          id: 'order-offline',
          number: offlineInvoice.number,
          status: offlineInvoice.status,
          customer: offlineInvoice.customer,
          total: { amount: offlineInvoice.totals.total, currency: offlineInvoice.totals.currency },
          createdAt: offlineInvoice.issuedAt,
        },
        cart: { items: offlineInvoice.items, totals: offlineInvoice.totals },
      },
    ])

    const mockApi = {
      listProducts: vi.fn().mockResolvedValue([]),
      listInvoices: vi.fn().mockResolvedValue([]),
      listOrders: vi.fn().mockResolvedValue([]),
    }

    render(
      <PointOfSale
        withElements={false}
        api={mockApi}
        initialUser={{ id: 'user-4', name: 'Louis Armstrong', email: 'louis@example.com' }}
        handoffStorage={storage}
      />,
    )

    const invoicesButton = await screen.findByRole('button', { name: /invoices/i })
    await userEvent.click(invoicesButton)

    expect(await screen.findByText(/Invoice #INV-OFFLINE/i)).toBeInTheDocument()
    expect(screen.getByText('Offline User')).toBeInTheDocument()
  })
})
