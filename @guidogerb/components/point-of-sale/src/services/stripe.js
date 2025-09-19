import { loadStripe } from '@stripe/stripe-js'
import { CardElement } from '@stripe/react-stripe-js'

export const loadStripeInstance = (publicKey, options) => {
  if (!publicKey) {
    return Promise.resolve(null)
  }
  return loadStripe(publicKey, options)
}

export const createDefaultPaymentParams = ({
  billingDetails = {},
  metadata = {},
  savePaymentMethod = false,
} = {}) => {
  const normalizedBilling = {
    name: billingDetails.name ?? '',
    email: billingDetails.email ?? '',
    phone: billingDetails.phone ?? '',
    address: {
      line1: billingDetails.address?.line1 ?? '',
      line2: billingDetails.address?.line2 ?? '',
      city: billingDetails.address?.city ?? '',
      state: billingDetails.address?.state ?? '',
      postal_code: billingDetails.address?.postalCode ?? '',
      country: billingDetails.address?.country ?? '',
    },
  }

  return {
    payment_method_data: {
      billing_details: normalizedBilling,
      metadata,
    },
    setup_future_usage: savePaymentMethod ? 'off_session' : undefined,
  }
}

export const confirmStripePayment = async ({
  stripe,
  elements,
  clientSecret,
  billingDetails,
  metadata,
  savePaymentMethod,
  redirect = 'if_required',
}) => {
  if (!stripe) {
    throw new Error('Stripe instance is required to confirm payments.')
  }
  if (!clientSecret) {
    throw new Error('A PaymentIntent client secret is required to confirm payments.')
  }

  const params = createDefaultPaymentParams({
    billingDetails,
    metadata,
    savePaymentMethod,
  })

  if (typeof stripe.confirmPayment === 'function') {
    return stripe.confirmPayment({
      clientSecret,
      elements,
      confirmParams: params,
      redirect,
    })
  }

  if (typeof stripe.confirmCardPayment === 'function') {
    const cardElement = elements?.getElement?.(CardElement) ?? undefined
    return stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: params.payment_method_data.billing_details,
        },
        metadata,
        setup_future_usage: params.setup_future_usage,
      },
      { handleActions: redirect !== 'always' },
    )
  }

  throw new Error('Provided Stripe instance does not support payment confirmation.')
}
