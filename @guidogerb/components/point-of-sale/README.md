# @guidogerb/components/point-of-sale

A full-stack ready Point of Sale (POS) React experience that connects product discovery, shopping cart, checkout, and
post-payment workflows. The component layers Stripe Elements on top of a catalog sourced from
`@guidogerb/components-catalog`, orchestrates customer profiles, and persists invoices plus order history via a GraphQL
commerce gateway.

## Overview

`PointOfSale` bundles the primary primitives necessary to sell digital or physical goods inside Guidogerb tenant
experiences:

- **Stripe Payments.** Uses `@stripe/react-stripe-js` + `@stripe/stripe-js` to render Elements, confirm PaymentIntents, and
  manage saved payment methods tied to Stripe Customers.
- **Product catalog integration.** Reuses `@guidogerb/components-catalog` to browse products, apply taxonomy filters, and
  hydrate a tenant-specific cart.
- **Cart + pricing engine.** Leverages `@guidogerb/components-shopping-cart` for cart state, promotions, and real-time
  subtotal/tax/total calculations.
- **Invoices & history.** Generates invoices once payments succeed, renders printable summaries, and exposes an order
  ledger filtered by status.
- **User accounts.** Links authenticated customers to Stripe Customer IDs and exposes editable profile metadata for POS
  operators.
- **Merchant dashboard.** Provides ready-made pages for the POS floor, invoice viewer, and order history.

A typical deployment pairs the component with the shared Guidogerb GraphQL gateway that powers product data, customer
profiles, PaymentIntent creation, and invoice persistence. Tenants can progressively enhance individual sections using
headless contexts and service helpers exported from the package.

## Installation

```sh
pnpm add @guidogerb/components-point-of-sale
```

The package expects React 19+ and a Stripe publishable key. It also relies on the catalog package, which should be
configured to query the tenant's catalog GraphQL endpoint.

## Quick start

```tsx
import { useMemo } from 'react'
import { PointOfSale, createPOSApi } from '@guidogerb/components-point-of-sale'

export function StorefrontPOS({ apiBaseUrl, initialUser }) {
  const api = useMemo(() => createPOSApi({ baseUrl: apiBaseUrl }), [apiBaseUrl])

  return (
    <PointOfSale
      api={api}
      initialUser={initialUser}
      stripePublicKey={import.meta.env.VITE_STRIPE_PUBLIC_KEY}
      currency="USD"
      taxRate={0.0825}
      promoCodes={{
        STREAM4CLOUD: { type: 'percent', value: 15 },
        STAFF: { type: 'flat', value: 500 },
      }}
      catalog={{
        client: { post: (path, options) => fetch(`${apiBaseUrl}${path}`, options) },
        storageNamespace: `${initialUser.tenant}.catalog`,
      }}
      onOrderComplete={(payload) => console.log('Order finished', payload)}
      onInvoiceCreate={(invoice) => console.log('Invoice stored', invoice)}
    />
  )
}
```

`PointOfSale` bundles its own `UserProvider`, `CartProvider` (implemented by
`@guidogerb/components-shopping-cart`), and Stripe `<Elements>` wrapper. Advanced consumers that need custom providers can
disable either layer via the `withProviders` and `withElements` props.

The component will load products from the catalog, allow the operator to add them to the cart, collect payment with
Stripe Elements, create invoices, and display a full audit trail.

## Component anatomy

```
@guidogerb/components/point-of-sale/src
  ├── PointOfSale.jsx          // Top-level orchestrator
  ├── ProductList.jsx          // Catalog integration + product browsing UI
  ├── ProductCard.jsx          // Reusable card rendered within catalog results
  ├── InvoiceView.jsx          // Printable invoice summary
  ├── OrderHistory.jsx         // Past order ledger + filters
  ├── UserProfile.jsx          // Authenticated operator profile management
  ├── context/
  │     └── UserContext.jsx   // UserProvider + useUser hook
  ├── services/
  │     ├── api.js            // Helpers for the POS GraphQL/REST gateway
  │     └── stripe.js         // Stripe loader + PaymentIntent confirmation helpers
  └── pages/
        ├── POSPage.jsx       // Default in-store experience layout
        ├── InvoicePage.jsx   // Invoice viewer layout
        └── HistoryPage.jsx   // Order history dashboard
```

Cart primitives (state management, checkout surface, helpers) are sourced from
`@guidogerb/components-shopping-cart`. Each remaining module can be consumed independently, enabling teams to reuse the
contexts or service helpers inside bespoke UI.

## Props – `PointOfSale`

| Prop                            | Type                                                   | Default                | Description                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `api`                           | `ReturnType<typeof createPOSApi>`                      | `null`                 | API gateway used to list products, create PaymentIntents, issue invoices, and fetch order history.                                              |
| `apiBaseUrl`                    | `string`                                               | —                      | Convenience passed to `createPOSApi` when `api` is omitted.                                                                                     |
| `catalog`                       | `object`                                               | `null`                 | When provided, `ProductList` will hydrate products using `@guidogerb/components-catalog`. Supports every prop the catalog component accepts.    |
| `stripePromise`                 | `Promise<Stripe \| null>`                              | —                      | Preloaded Stripe instance. Required when `stripePublicKey` is absent.                                                                           |
| `stripePublicKey`               | `string`                                               | —                      | Publishable key used to lazily load Stripe if `stripePromise` is not provided.                                                                  |
| `stripeOptions`                 | `StripeConstructorOptions`                             | `{}`                   | Options forwarded to `loadStripe`.                                                                                                              |
| `confirmPayment`                | `function`                                             | `confirmStripePayment` | Hook allowing tenants to override how payments are confirmed. Receives `{ stripe, elements, clientSecret, billingDetails, savePaymentMethod }`. |
| `currency`                      | `string`                                               | `'USD'`                | Currency code passed to the cart pricing engine and PaymentIntent requests.                                                                     |
| `taxRate`                       | `number`                                               | `0`                    | Default tax rate applied by the cart provider.                                                                                                  |
| `discountRate`                  | `number`                                               | `0`                    | Default discount applied to the subtotal before tax.                                                                                            |
| `promoCodes`                    | `Record<string, PromoRule>`                            | `{}`                   | Promo code catalog recognized by the cart provider.                                                                                             |
| `initialCart`                   | `{ items: CartItem[]; promoCode?: string }`            | `{}`                   | Seeds the cart state.                                                                                                                           |
| `initialUser`                   | `User`                                                 | `null`                 | Seed user profile. Forwarded to `UserProvider`.                                                                                                 |
| `cartStorage`                   | `StorageController`                                    | —                      | Storage controller used to persist cart state. Works seamlessly with `@guidogerb/components-storage`.                                           |
| `cartStorageKey`                | `string`                                               | `'guidogerb.pos.cart'` | Storage key used by the cart provider.                                                                                                          |
| `onOrderComplete`               | `(payload: { invoice, paymentIntent, order }) => void` | —                      | Fired after the order and invoice have been successfully recorded.                                                                              |
| `onInvoiceCreate`               | `(invoice) => void`                                    | —                      | Invoked once invoices are persisted.                                                                                                            |
| `onPaymentError`                | `(error) => void`                                      | —                      | Called whenever payment confirmation fails.                                                                                                     |
| `renderPOSPage`                 | `(props) => ReactNode`                                 | `POSPage`              | Override for the default POS layout.                                                                                                            |
| `renderInvoicePage`             | `(props) => ReactNode`                                 | `InvoicePage`          | Override for the invoice viewer.                                                                                                                |
| `renderHistoryPage`             | `(props) => ReactNode`                                 | `HistoryPage`          | Override for the order history view.                                                                                                            |
| `renderProfile`                 | `(props) => ReactNode`                                 | `UserProfile`          | Override for the profile sidebar.                                                                                                               |
| `shouldAutoCreatePaymentIntent` | `boolean`                                              | `true`                 | When `true`, new PaymentIntents are created whenever the cart total changes.                                                                    |

## Data flow

1. **Products** are fetched via `api.listProducts` or rendered through the catalog component. Selecting a product pushes it
   into the cart context, which recalculates totals instantly.
2. **Cart state** persists between sessions when a storage controller is provided. Subtotal, discounts, taxes, and grand
   total are derived values exposed by `useCart`.
3. **PaymentIntents** are created using the active cart snapshot. The resulting `clientSecret` drives Stripe Elements to
   confirm payment on the client.
4. **Invoices** are created via `api.createInvoice` after payment succeeds. The new invoice becomes visible in both the
   invoice viewer and order history feeds.
5. **Order history** is loaded from `api.listOrders` and can be refreshed on demand. The history view supports filtering
   by status and searching invoice numbers.
6. **User profiles** are maintained through the user context and allow linking a Stripe Customer ID for saved payment
   methods.

## Services

### `createPOSApi`

Utility factory that wraps a REST or GraphQL gateway into a single object with the following methods:

- `listProducts({ userId })`
- `createPaymentIntent({ amount, currency, cart, customerId, metadata })`
- `createInvoice({ cart, paymentIntent, user })`
- `listInvoices({ userId })`
- `listOrders({ userId, pagination, status })`
- `recordOrder({ invoice, paymentIntent, cart, user })`
- `updateCustomer({ user })`

All methods return promises. Consumers can supply a custom `client` with `get` / `post` helpers or allow the factory to
use native `fetch` against `apiBaseUrl`.

### Stripe helpers

- `loadStripeInstance(key, options)` delegates to `loadStripe` but guards against missing keys.
- `confirmStripePayment({ stripe, elements, clientSecret, billingDetails, savePaymentMethod })` confirms the PaymentIntent
  using the most appropriate Stripe method (`confirmPayment` or `confirmCardPayment`).
- `createDefaultPaymentParams({ billingDetails, metadata })` produces confirm params for card payments.

## Contexts

- `CartProvider` (re-exported from `@guidogerb/components-shopping-cart`) exposes `useCart()` with `{ items, subtotal,
tax, discount, total, addItem, updateQuantity, removeItem, clearCart, applyPromoCode, setTaxRate, setDiscountRate,
setShipping }` and persists state when a storage controller is provided.
- `UserProvider` exposes `useUser()` with `{ user, status, login, logout, updateProfile, setStripeCustomerId }`.

## Pages

Three layout primitives are exported:

- `POSPage` – columns for catalog browsing, cart insights, and checkout.
- `InvoicePage` – invoice summary with download/print actions.
- `HistoryPage` – searchable and filterable order ledger.

Override these components to align the POS UI with tenant design systems while reusing the core logic.

## Testing

The package ships with Vitest coverage. Run the suite via:

```sh
pnpm --filter @guidogerb/components-point-of-sale test
```

## Related packages

- [`@guidogerb/components-shopping-cart`](../shopping-cart/README.md) for cart state, totals, and checkout UI.
- [`@guidogerb/components-catalog`](../catalog/README.md) for the product browsing surface.
- [`@guidogerb/components-storage`](../storage/README.md) for persisted cart and preference storage.
- [`@guidogerb/components-analytics`](../analytics/README.md) pairs nicely with POS events for merchant dashboards.
