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

import { Elements } from '@stripe/react-stripe-js'
import { PointOfSale } from '../PointOfSale.jsx'

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
})
