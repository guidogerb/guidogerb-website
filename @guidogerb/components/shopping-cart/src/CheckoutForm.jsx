import { useEffect, useMemo, useState } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'

const formatMoney = (value, currency) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(value / 100)
  } catch (error) {
    return `$${(value / 100).toFixed(2)}`
  }
}

export function CheckoutForm({
  amount = 0,
  currency = 'USD',
  clientSecret,
  confirmPayment,
  billingDetails = {},
  metadata,
  onPaymentSuccess,
  onPaymentError,
  allowSavePaymentMethod = true,
  disabled = false,
  autoSubmit = false,
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [email, setEmail] = useState(billingDetails.email ?? '')
  const [name, setName] = useState(billingDetails.name ?? '')
  const [savePaymentMethod, setSavePaymentMethod] = useState(false)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    setEmail(billingDetails.email ?? '')
    setName(billingDetails.name ?? '')
  }, [billingDetails.email, billingDetails.name])

  const isReady = useMemo(
    () => Boolean(stripe && elements && clientSecret),
    [clientSecret, elements, stripe],
  )

  const submitPayment = async () => {
    if (!stripe || !elements) {
      setMessage('Stripe has not finished loading.')
      setStatus('error')
      return
    }
    if (!clientSecret) {
      setMessage('Payment intent is not ready yet.')
      setStatus('error')
      return
    }
    if (typeof confirmPayment !== 'function') {
      setMessage('No payment confirmation handler provided.')
      setStatus('error')
      return
    }

    setStatus('processing')
    setMessage(null)

    try {
      const result = await confirmPayment({
        stripe,
        elements,
        clientSecret,
        billingDetails: { ...billingDetails, name, email },
        metadata,
        savePaymentMethod: allowSavePaymentMethod ? savePaymentMethod : false,
      })

      if (result?.error) {
        setStatus('error')
        setMessage(result.error.message ?? 'Payment failed.')
        onPaymentError?.(result.error)
        return
      }

      const paymentIntent = result?.paymentIntent ?? result
      if (paymentIntent?.status === 'succeeded') {
        setStatus('success')
        setMessage('Payment completed successfully.')
      } else {
        setStatus(paymentIntent?.status ?? 'processing')
        setMessage(paymentIntent?.status ? `Payment ${paymentIntent.status}.` : null)
      }

      onPaymentSuccess?.(paymentIntent, {
        billingDetails: { ...billingDetails, name, email },
        savePaymentMethod: allowSavePaymentMethod ? savePaymentMethod : false,
      })
    } catch (error) {
      setStatus('error')
      setMessage(error.message ?? 'Payment failed.')
      onPaymentError?.(error)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await submitPayment()
  }

  useEffect(() => {
    if (autoSubmit && isReady && status === 'idle') {
      submitPayment()
    }
  }, [autoSubmit, isReady, status])

  return (
    <form className="gg-pos__checkout" onSubmit={handleSubmit}>
      <header className="gg-pos__checkout-header">
        <h2>Checkout</h2>
        <p>Total due {formatMoney(amount, currency)}</p>
      </header>
      <fieldset className="gg-pos__checkout-contact">
        <legend>Contact</legend>
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={disabled || status === 'processing'}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={disabled || status === 'processing'}
            required
          />
        </label>
      </fieldset>
      <fieldset className="gg-pos__checkout-payment">
        <legend>Payment details</legend>
        {!clientSecret && <p role="status">Preparing secure payment form…</p>}
        {clientSecret && !isReady && <p role="status">Loading payment element…</p>}
        {clientSecret && isReady && <PaymentElement options={{ layout: 'tabs' }} />}
      </fieldset>
      {allowSavePaymentMethod && (
        <label className="gg-pos__checkout-save">
          <input
            type="checkbox"
            checked={savePaymentMethod}
            onChange={(event) => setSavePaymentMethod(event.target.checked)}
            disabled={disabled || status === 'processing'}
          />
          Save payment method for future orders
        </label>
      )}
      {message && (
        <p
          role={status === 'error' ? 'alert' : 'status'}
          className={`gg-pos__checkout-message gg-pos__checkout-message--${status}`}
        >
          {message}
        </p>
      )}
      <footer className="gg-pos__checkout-actions">
        <button
          type="submit"
          disabled={disabled || status === 'processing' || !clientSecret || !stripe || !elements}
        >
          {status === 'processing' ? 'Processing…' : 'Confirm payment'}
        </button>
      </footer>
    </form>
  )
}
