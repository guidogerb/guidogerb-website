# @guidogerb/components/shopping-cart – Tasks

## Cart intelligence

- [ ] Add support for bundled products that expand into multiple line items with shared discounts.
- [ ] Implement inventory reservations that lock stock when items enter the cart.
- [ ] Surface cross-sell / upsell recommendations based on the current cart contents.

## Pricing & promotions

- [ ] Introduce tiered pricing rules (buy X get Y, mix & match discounts, loyalty status).
- [ ] Allow multiple promo codes with priority resolution and combinability rules.
- [ ] Integrate jurisdiction-aware tax engines (Avalara, TaxJar) with automatic rate lookup.

## Checkout experience

- [ ] Provide an address collection step with validation and saved address book management.
- [ ] Support partial payments / split tenders with clear UI for remaining balances.
- [ ] Add offline payment handling (cash, cheque) that bypasses Stripe confirmation.

## Persistence & analytics

- [ ] Sync cart snapshots to the backend for multi-device continuity and team hand-off.
- [ ] Emit analytics events for add/remove/update actions via `@guidogerb/components-analytics`.
- [ ] Expose hooks for custom storage serializers and encryption strategies.

## Documentation & tooling

- [ ] Publish Storybook stories demonstrating cart, checkout, and saved payment flows.
- [ ] Document storage controller interfaces and best practices for persistence.
- [ ] Provide TypeScript definitions for cart state, promo rules, and checkout handlers.
