# @guidogerb/components/shopping-cart

A composable shopping cart system that powers Guidogerb commerce surfaces. The package bundles a
stateful cart context, promo + tax calculators, and a Stripe Elements checkout experience that can
be embedded inside standalone product flows or orchestrated by
`@guidogerb/components-point-of-sale`.

## Overview

`ShoppingCart` centralises every concern related to cart management so higher level experiences can
focus on catalog discovery, invoices, and fulfilment:

- **Cart state & persistence.** `CartProvider` stores line items, quantities, custom tax/discount
  rules, and shipping fees. Provide a storage controller to persist carts across refreshes or
  multiple staff devices.
- **Dynamic totals.** Totals are recalculated automatically whenever items change. Promo codes,
  percentage discounts, and flat adjustments are supported out of the box.
- **Stripe checkout surface.** `CheckoutForm` renders Stripe Elements and confirms PaymentIntents via
  a pluggable handler. Saved payment method opt-in is included for Stripe Customer support.
- **POS integration.** The point-of-sale package consumes this cart to connect catalog browsing,
  invoices, and history without duplicating state management logic.

## Installation

```sh
pnpm add @guidogerb/components-shopping-cart
```

Ensure your project also installs `@stripe/react-stripe-js` and `@stripe/stripe-js` (the package
lists them as direct dependencies). React 19+ is required.

## Quick start

```tsx
import { useMemo } from 'react'
import {
  CartProvider,
  ShoppingCart,
  CheckoutForm,
} from '@guidogerb/components-shopping-cart'

function CartExperience({ items, promoCodes, onCheckout }) {
  const initialCart = useMemo(
    () => ({ items }),
    [items],
  )

  return (
    <CartProvider
      currency="USD"
      taxRate={0.0825}
      discountRate={0}
      promoCodes={promoCodes}
      initialCart={initialCart}
    >
      <ShoppingCart onCheckout={onCheckout} />
    </CartProvider>
  )
}
```

`CartProvider` exposes the `useCart()` hook for custom UIs. When paired with Stripe Elements, wire
the `CheckoutForm` directly to your PaymentIntent lifecycle:

```tsx
function Checkout({ clientSecret, confirmPayment }) {
  const { totals } = useCart()

  return (
    <CheckoutForm
      amount={totals.total}
      currency={totals.currency}
      clientSecret={clientSecret}
      confirmPayment={confirmPayment}
    />
  )
}
```

## Component anatomy

```
@guidogerb/components/shopping-cart/src
  ├── ShoppingCart.jsx          // Cart UI + quantity controls, promo entry, totals
  ├── CheckoutForm.jsx          // Stripe PaymentElement integration + confirm flow
  └── context/
        └── CartContext.jsx     // CartProvider + useCart hook and pricing engine helpers
```

## `ShoppingCart` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onCheckout` | `() => void` | — | Called when the operator presses “Proceed to checkout”. Useful for swapping to the `CheckoutForm` view. |
| `allowPromoCodes` | `boolean` | `true` | Shows the promo entry form when promos are enabled. |
| `promoPlaceholder` | `string` | `'Promo code'` | Placeholder text for the promo input. |
| `readOnly` | `boolean` | `false` | Disables all cart interactions when `true`. |

The component consumes state from `useCart()` and therefore must be rendered within a `CartProvider`.

## `CartProvider`

`CartProvider` accepts the following notable props:

- `currency` – ISO currency code applied to totals (defaults to `USD`).
- `taxRate` / `discountRate` – default percentage adjustments applied to the subtotal.
- `promoCodes` – map of promo code IDs to rules `{ type: 'percent' | 'flat', value: number }`.
- `storage` / `storageKey` – optional persistence layer compatible with
  `@guidogerb/components-storage` controllers.
- `initialCart` – seed data for items, promo codes, and shipping.

`useCart()` exposes `{ items, totals, addItem, updateQuantity, removeItem, clearCart,
applyPromoCode, setTaxRate, setDiscountRate, setShipping }`.

## `CheckoutForm`

The checkout form wraps Stripe's PaymentElement and requires a prepared PaymentIntent `clientSecret`.
Pass a `confirmPayment` callback that orchestrates Stripe confirmation. The helper receives
`{ stripe, elements, clientSecret, billingDetails, metadata, savePaymentMethod }` and should resolve
to an object containing the resulting `paymentIntent` or an error.

Optional callbacks `onPaymentSuccess` and `onPaymentError` fire based on the confirmation outcome.

## Testing

The package ships with Vitest coverage. Run the suite via:

```sh
pnpm --filter @guidogerb/components-shopping-cart test
```

## Related packages

- [`@guidogerb/components-point-of-sale`](../point-of-sale/README.md) consumes the cart for the full
  POS experience.
- [`@guidogerb/components-storage`](../storage/README.md) implements persistent storage drivers for
  carts and preferences.
