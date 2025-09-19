# @guidogerb/components/point-of-sale – Tasks

## Payments & compliance

- [ ] Implement support for on-session + off-session PaymentIntents, including mandate management for recurring billing.
- [ ] Surface webhook reconciliation status so operators can re-sync invoices when Stripe events arrive out of order.
- [ ] Add 3DS2 challenge handling with an inline modal experience and fallback redirect flow.
- [ ] Integrate dispute monitoring and recovery actions inside the merchant dashboard view.

## Catalog & merchandising

- [ ] Expand catalog integration to support bundled products and volume pricing tiers pulled from GraphQL.
- [ ] Add a quick-add SKU search bar that bypasses the catalog grid for power users.
- [ ] Allow operators to edit product metadata (price overrides, notes) before adding to the cart.

## Cart & pricing engine

- [ ] Support split tenders where multiple payment methods contribute to a single invoice.
- [ ] Persist draft carts to the backend so sessions can resume across devices and staff accounts.
- [ ] Implement tax-inclusive pricing and jurisdiction-aware rate selection via Avalara.

## Invoices & fulfillment

- [ ] Generate PDF invoices using `jspdf` and attach them to transactional emails.
- [ ] Sync invoice status with fulfillment systems (shipping, digital delivery) via event webhooks.
- [ ] Provide scheduled invoice exports for finance tooling (NetSuite, QuickBooks).

## Order history & analytics

- [ ] Add cohort analytics: daily/weekly sales summaries with chart visualizations.
- [ ] Ship advanced filters (status, payment method, fulfillment channel) and saved search presets.
- [ ] Emit structured analytics events via `@guidogerb/components-analytics` for every checkout milestone.

## Documentation & DX

- [ ] Publish a Storybook surface showcasing the POS flow with mocked Stripe + API responses.
- [ ] Document backend API contracts (GraphQL schemas, REST payloads) for PaymentIntent and invoice creation.
- [ ] Provide code samples for integrating loyalty programs and membership discounts.
