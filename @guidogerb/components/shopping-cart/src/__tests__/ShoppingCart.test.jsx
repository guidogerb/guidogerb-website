/** @jsxImportSource react */
import React from 'react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const stripeStore = { current: null }
const elementsStore = { current: null }

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
    await waitFor(() =>
      expect(screen.getByLabelText(/qty/i)).toHaveValue(2),
    )

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

  it('confirms payments with CheckoutForm and surfaces success state', async () => {
    const user = userEvent.setup()
    const confirmPayment = vi
      .fn()
      .mockResolvedValue({
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

    await waitFor(() => expect(onPaymentSuccess).toHaveBeenCalledWith(
      {
        id: 'pi_123',
        status: 'succeeded',
        client_secret: 'pi_secret',
      },
      {
        billingDetails: { name: 'Ada Lovelace', email: 'ada@example.com' },
        savePaymentMethod: false,
      },
    ))
    expect(onPaymentError).not.toHaveBeenCalled()
    expect(
      await screen.findByText(/Payment completed successfully/i),
    ).toBeInTheDocument()
  })
})
