/** @jsxImportSource react */
import React from 'react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const stripeStore = { current: null }
const elementsStore = { current: null }

const analyticsMock = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  pageView: vi.fn(),
  setUserProperties: vi.fn(),
  setUserId: vi.fn(),
  consent: vi.fn(),
  gtag: vi.fn(),
}))

vi.mock('@guidogerb/components-analytics', () => ({
  buildAddToCartEvent: ({ currency, cartId, items = [] }) => ({
    name: 'add_to_cart',
    params: {
      currency,
      cart_id: cartId,
      items: items.map((item) => ({
        ...item,
        item_id:
          item.item_id ??
          item.id ??
          item.itemId ??
          item.sku ??
          item.skuId ??
          item.name ??
          'unknown-item',
      })),
    },
  }),
  useAnalytics: () => analyticsMock,
}))

vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => stripeStore.current,
  useElements: () => elementsStore.current,
  PaymentElement: (props) =>
    React.createElement('div', { ...props, 'data-testid': 'payment-element' }),
}))

import { ShoppingCart } from '../ShoppingCart.jsx'
import { CheckoutForm } from '../CheckoutForm.jsx'
import { CartProvider, useCart } from '../context/CartContext.jsx'

const CartHarness = ({ children, initialCart, promoCodes, currency = 'USD' }) => (
  <CartProvider currency={currency} promoCodes={promoCodes} initialCart={initialCart}>
    {children}
  </CartProvider>
)

const QuantitySetter = ({ id, quantity }) => {
  const { updateQuantity } = useCart()

  React.useEffect(() => {
    updateQuantity(id, quantity)
  }, [id, quantity, updateQuantity])

  return null
}

const CartConsumer = ({ onReady }) => {
  const cart = useCart()

  React.useEffect(() => {
    onReady?.(cart)
  }, [cart, onReady])

  return null
}

describe('ShoppingCart package', () => {
  afterEach(() => {
    stripeStore.current = null
    elementsStore.current = null
    vi.clearAllMocks()
  })

  it('renders items, applies promo codes, and triggers checkout', async () => {
    const user = userEvent.setup()
    const handleCheckout = vi.fn()

    render(
      <CartHarness
        promoCodes={{ VIP: { type: 'percent', value: 10 } }}
        initialCart={{
          items: [
            {
              id: 'prod-1',
              name: 'Vinyl',
              price: { amount: 5000, currency: 'USD' },
              quantity: 1,
            },
          ],
        }}
      >
        <QuantitySetter id="prod-1" quantity={2} />
        <ShoppingCart onCheckout={handleCheckout} />
      </CartHarness>,
    )

    expect(screen.getByText('Vinyl')).toBeInTheDocument()
    expect(screen.getByText('$50.00 each')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/qty/i)).toHaveValue(2))

    const promoInput = screen.getByLabelText(/promo code/i)
    await user.type(promoInput, 'vip')
    await user.click(screen.getByRole('button', { name: /apply/i }))

    await waitFor(() =>
      expect(
        screen.getByText((_, element) => element?.textContent?.trim() === '-$10.00'),
      ).toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: /proceed to checkout/i }))

    expect(handleCheckout).toHaveBeenCalledTimes(1)
  })

  it('renders bundled products as grouped rows with derived quantities', async () => {
    render(
      <CartHarness
        initialCart={{
          items: [
            {
              id: 'bundle-1',
              name: 'Starter Pack',
              description: 'Vinyl + poster bundle',
              price: { amount: 6000, currency: 'USD' },
              quantity: 2,
              bundleItems: [
                {
                  id: 'vinyl',
                  name: 'Vinyl Record',
                  price: { amount: 4000, currency: 'USD' },
                  quantity: 1,
                  includeInTotals: false,
                },
                {
                  id: 'poster',
                  name: 'Poster',
                  price: { amount: 2000, currency: 'USD' },
                  quantity: 2,
                  includeInTotals: false,
                },
              ],
            },
          ],
        }}
      >
        <ShoppingCart />
      </CartHarness>,
    )

    expect(screen.getByRole('heading', { level: 3, name: /starter pack/i })).toBeInTheDocument()
    const bundleHeadings = screen.getAllByRole('heading', { level: 4 })
    expect(bundleHeadings.map((heading) => heading.textContent)).toEqual(
      expect.arrayContaining(['Vinyl Record', 'Poster']),
    )
    const posterRow = bundleHeadings.find((heading) => heading.textContent === 'Poster')?.closest('li')
    const vinylRow = bundleHeadings
      .find((heading) => heading.textContent === 'Vinyl Record')
      ?.closest('li')
    expect(posterRow).toBeTruthy()
    expect(vinylRow).toBeTruthy()
    expect(screen.queryByText(/2 items/i)).not.toBeInTheDocument()
    expect(screen.getByText(/3 items/i)).toBeInTheDocument()
    expect(screen.getAllByText(/included in bundle/i)).toHaveLength(2)
    if (vinylRow) {
      expect(within(vinylRow).getByText(/qty 2/i)).toBeInTheDocument()
    }
    if (posterRow) {
      expect(within(posterRow).getByText(/qty 4/i)).toBeInTheDocument()
    }
  })

  it('confirms payments with CheckoutForm and surfaces success state', async () => {
    const user = userEvent.setup()
    const confirmPayment = vi.fn().mockResolvedValue({
      paymentIntent: {
        id: 'pi_123',
        status: 'succeeded',
        client_secret: 'pi_secret',
      },
    })
    const onPaymentSuccess = vi.fn()
    const onPaymentError = vi.fn()
    const stripe = { id: 'stripe' }
    const elements = { id: 'elements' }

    stripeStore.current = stripe
    elementsStore.current = elements

    render(
      <CheckoutForm
        amount={1250}
        currency="USD"
        clientSecret="pi_secret"
        confirmPayment={confirmPayment}
        billingDetails={{}}
        metadata={{ orderId: 'order-1' }}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />, 
    )

    expect(screen.getByTestId('payment-element')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Name'), 'Ada Lovelace')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.click(screen.getByRole('button', { name: /confirm payment/i }))

    await waitFor(() => expect(confirmPayment).toHaveBeenCalledTimes(1))
    expect(confirmPayment.mock.calls[0][0]).toMatchObject({
      stripe,
      elements,
      clientSecret: 'pi_secret',
      billingDetails: { name: 'Ada Lovelace', email: 'ada@example.com' },
      metadata: { orderId: 'order-1' },
      savePaymentMethod: false,
    })

    await waitFor(() =>
      expect(onPaymentSuccess).toHaveBeenCalledWith(
        {
          id: 'pi_123',
          status: 'succeeded',
          client_secret: 'pi_secret',
        },
        {
          billingDetails: { name: 'Ada Lovelace', email: 'ada@example.com' },
          savePaymentMethod: false,
        },
      ),
    )
    expect(onPaymentError).not.toHaveBeenCalled()
    expect(await screen.findByText(/Payment completed successfully/i)).toBeInTheDocument()
  })

  it('emits analytics events for cart mutations', async () => {
    const capture = vi.fn()

    render(
      <CartProvider currency="USD">
        <CartConsumer onReady={capture} />
      </CartProvider>,
    )

    await waitFor(() => expect(capture).toHaveBeenCalled())
    const cart = capture.mock.calls.at(-1)?.[0]
    analyticsMock.trackEvent.mockClear()

    act(() => {
      cart.addItem({
        id: 'prod-1',
        name: 'Vinyl',
        price: { amount: 5000, currency: 'USD' },
        categories: ['Music'],
      })
    })

    expect(analyticsMock.trackEvent).toHaveBeenCalledTimes(1)
    const addEvent = analyticsMock.trackEvent.mock.calls[0]
    expect(addEvent[0]).toBe('add_to_cart')
    expect(addEvent[1]).toEqual(
      expect.objectContaining({
        currency: 'USD',
        items: expect.arrayContaining([
          expect.objectContaining({ item_id: 'prod-1', quantity: 1, price: 50 }),
        ]),
      }),
    )

    analyticsMock.trackEvent.mockClear()

    act(() => {
      cart.updateQuantity('prod-1', 3)
    })

    expect(analyticsMock.trackEvent).toHaveBeenCalledTimes(1)
    const increaseEvent = analyticsMock.trackEvent.mock.calls[0]
    expect(increaseEvent[0]).toBe('add_to_cart')
    expect(increaseEvent[1]).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ item_id: 'prod-1', quantity: 2 }),
        ]),
      }),
    )

    analyticsMock.trackEvent.mockClear()

    act(() => {
      cart.updateQuantity('prod-1', 1)
    })

    expect(analyticsMock.trackEvent).toHaveBeenCalledTimes(1)
    const decreaseEvent = analyticsMock.trackEvent.mock.calls[0]
    expect(decreaseEvent[0]).toBe('remove_from_cart')
    expect(decreaseEvent[1]).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ item_id: 'prod-1', quantity: 2 }),
        ]),
      }),
    )

    analyticsMock.trackEvent.mockClear()

    act(() => {
      cart.removeItem('prod-1')
    })

    expect(analyticsMock.trackEvent).toHaveBeenCalledTimes(1)
    const removeEvent = analyticsMock.trackEvent.mock.calls[0]
    expect(removeEvent[0]).toBe('remove_from_cart')
    expect(removeEvent[1]).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ item_id: 'prod-1', quantity: 1 }),
        ]),
      }),
    )

    analyticsMock.trackEvent.mockClear()

    act(() => {
      cart.addItem({
        id: 'prod-2',
        name: 'Poster',
        price: { amount: 2000, currency: 'USD' },
      })
      cart.addItem({
        id: 'prod-3',
        name: 'Sticker',
        price: { amount: 500, currency: 'USD' },
      })
    })

    analyticsMock.trackEvent.mockClear()

    act(() => {
      cart.clearCart()
    })

    expect(analyticsMock.trackEvent).toHaveBeenCalledTimes(2)
    const cartClears = analyticsMock.trackEvent.mock.calls.map(([name, params]) => ({ name, params }))
    expect(cartClears.every((event) => event.name === 'remove_from_cart')).toBe(true)
    expect(cartClears.flatMap((event) => event.params.items)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ item_id: 'prod-2', quantity: 1 }),
        expect.objectContaining({ item_id: 'prod-3', quantity: 1 }),
      ]),
    )
  })

  it('includes bundle components in analytics payloads', async () => {
    const capture = vi.fn()

    render(
      <CartProvider currency="USD">
        <CartConsumer onReady={capture} />
      </CartProvider>,
    )

    await waitFor(() => expect(capture).toHaveBeenCalled())
    const cart = capture.mock.calls.at(-1)?.[0]
    analyticsMock.trackEvent.mockClear()

    act(() => {
      cart.addItem({
        id: 'bundle-1',
        name: 'Starter Pack',
        price: { amount: 6000, currency: 'USD' },
        bundleItems: [
          {
            id: 'vinyl-component',
            name: 'Vinyl',
            price: { amount: 4000, currency: 'USD' },
            quantity: 1,
          },
          {
            id: 'poster-component',
            name: 'Poster',
            price: { amount: 2000, currency: 'USD' },
            quantity: 2,
          },
        ],
      })
    })

    expect(analyticsMock.trackEvent).toHaveBeenCalledTimes(1)
    const bundleEvent = analyticsMock.trackEvent.mock.calls[0]
    expect(bundleEvent[0]).toBe('add_to_cart')
    expect(bundleEvent[1]).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ item_id: 'bundle-1', quantity: 1 }),
          expect.objectContaining({ item_id: 'vinyl-component', quantity: 1 }),
          expect.objectContaining({ item_id: 'poster-component', quantity: 2 }),
        ]),
      }),
    )
  })

  it('retains analytics metadata across payloads', async () => {
    const capture = vi.fn()

    render(
      <CartProvider currency="USD">
        <CartConsumer onReady={capture} />
      </CartProvider>,
    )

    await waitFor(() => expect(capture).toHaveBeenCalled())
    const cart = capture.mock.calls.at(-1)?.[0]
    analyticsMock.trackEvent.mockClear()

    act(() => {
      cart.addItem({
        id: 'meta-1',
        name: 'Digital Download',
        price: { amount: 1999, currency: 'USD' },
        metadata: {
          item_category: 'Digital',
          analytics: { item_list_id: 'featured', preorder: true },
        },
      })
    })

    expect(analyticsMock.trackEvent).toHaveBeenCalledTimes(1)
    const [eventName, params] = analyticsMock.trackEvent.mock.calls[0]
    expect(eventName).toBe('add_to_cart')
    const [item] = params.items ?? []
    expect(item).toEqual(
      expect.objectContaining({
        item_id: 'meta-1',
        item_category: 'Digital',
        item_list_id: 'featured',
        metadata: expect.objectContaining({ preorder: 'true' }),
      }),
    )
  })
})
