# @guidogerb/components/analytics

A lightweight React integration for Google Analytics 4 (GA4). The `<Analytics>` component automatically loads the GA4 tag, configures consent/debug options, and exposes a hook-based API so applications can track events without manually pasting `<script>` snippets or prop-drilling helpers through the tree.

## Why this package?

- **No-script install:** Drop the component near the root of your app and it injects the GA tag for you—no manual copy/paste from the GA UI.
- **Centralized helpers:** Use the `useAnalytics()` hook anywhere in your component tree to send events, fire page views, update consent, or set user properties.
- **Configurable by props:** Toggle debug mode, send initial events, and merge in any GA config overrides without leaving JSX.
- **Consent-aware:** Provide default consent values and update them later based on user preferences or CMP responses.
- **Measurement Protocol fallback:** Mirror events from server workers or Node runtimes when a browser GA tag is unavailable.

## Get a Google Analytics account & measurement ID

Follow these steps once per website/tenant. GA4 requires a Google account with Analytics access.

1. Visit [analytics.google.com](https://analytics.google.com/) and sign in (or create an account if you do not have one).
2. Click **Admin** in the bottom-left corner, then select **Create account** (if you do not already have one).
3. Provide an account name, configure data-sharing settings, and continue to **Property setup**.
4. Create a GA4 property for your website: give it a descriptive name, set the reporting time zone and currency, and proceed.
5. When prompted for **Data Streams**, choose **Web**.
6. Enter your site URL and stream name, then create the stream. Google will display a **Measurement ID** that looks like `G-XXXXXXX`.
7. Copy the measurement ID—store it in your password manager or secrets manager. For Vite-based sites, define it in an environment variable such as `VITE_GA_MEASUREMENT_ID`.

> **Tip:** If you are onboarding multiple tenants, repeat steps 4–7 per domain so each property reports independently.

## Wiring the component (no manual script tags required)

1. Install/ensure the analytics package is available via the monorepo workspace.
2. Load the measurement ID from configuration—e.g., `import.meta.env.VITE_GA_MEASUREMENT_ID` in a Vite application.
3. Wrap your application shell with the `<Analytics>` component. The component loads the GA tag script, configures GA, and renders its children.
4. Use the `useAnalytics()` hook in any descendant to send events or consent updates.

```jsx
// src/main.jsx (example Vite entry point)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { Analytics } from '@guidogerb/components/analytics'

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Analytics measurementId={measurementId} debugMode={import.meta.env.DEV}>
      <App />
    </Analytics>
  </React.StrictMode>,
)
```

Because the component injects the GA tag, **do not** add the GA snippet to your HTML template—doing so would double-count traffic.

## Tracking SPA navigations

Single-page apps need to emit a page view when the router changes routes. Drop the
provided `AnalyticsRouterBridge` component inside your React Router tree and it will
dispatch a `page_view` whenever navigation occurs:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics, AnalyticsRouterBridge } from '@guidogerb/components/analytics'
;<Analytics measurementId={measurementId} sendPageView={false}>
  <BrowserRouter>
    <AnalyticsRouterBridge trackInitialPageView />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pricing" element={<Pricing />} />
    </Routes>
  </BrowserRouter>
</Analytics>
```

`trackInitialPageView` ensures the first render is recorded when you disable GA’s
automatic page view via `sendPageView={false}`. The bridge merges sensible defaults
such as `page_location` and `page_title`, and you can customise what gets sent with
the lower-level hook:

```jsx
import { useAnalyticsPageViews } from '@guidogerb/components/analytics'

function CustomAnalyticsBridge() {
  useAnalyticsPageViews({
    getParams: ({ location }) => ({
      page_title: `Tenant portal — ${location.pathname}`,
    }),
  })

  return null
}
```

## Component API

### `<Analytics />`

| Prop             | Type                                       | Default      | Description                                                                                                                                          |
| ---------------- | ------------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `measurementId`  | `string`                                   | **Required** | The GA4 measurement ID (`G-XXXXXXX`). When omitted, the component becomes a no-op.                                                                   |
| `debugMode`      | `boolean`                                  | `false`      | Enables GA debug output via the Network panel.                                                                                                       |
| `sendPageView`   | `boolean`                                  | `true`       | When `false`, prevents GA from sending the automatic initial `page_view`. Useful when you plan to manage page views manually.                        |
| `defaultConsent` | `object`                                   | `undefined`  | Consent defaults passed to `gtag('consent', 'default', ...)` before configuration.                                                                   |
| `config`         | `object`                                   | `{}`         | Additional GA configuration merged into `gtag('config', measurementId, config)`.                                                                     |
| `initialEvents`  | `Array<{ name: string, params?: object }>` | `[]`         | Events dispatched immediately after GA is configured (e.g., to record the first page view manually).                                                 |
| `onConsentEvent` | `(event, history) => void`                 | `undefined`  | Callback invoked whenever consent defaults are applied or updated via `consent()`. Receives the event payload and a snapshot of the consent history. |
| `children`       | `ReactNode`                                | `null`       | The subtree that should have access to analytics helpers.                                                                                            |

### `useAnalytics()`

Returns helper methods bound to the current analytics instance:

- `trackEvent(name, params?)` — Fire a custom GA event.
- `pageView(pathOrOptions, params?)` — Emit a `page_view`. Pass a string path or an object of GA parameters.
- `setUserProperties(properties)` — Apply GA user properties.
- `setUserId(userId | null)` — Associate (or clear) a user ID.
- `consent(mode, settings)` — Update consent (`mode` defaults to `'default'` when omitted).
- `getConsentHistory()` — Returns a copy of all consent events recorded so far.
- `getLastConsentEvent()` — Convenience helper returning the most recent consent event or `null`.
- `subscribeToConsent(listener)` — Register a listener for consent changes. Returns an unsubscribe function.
- `gtag(...args)` — Direct access to the underlying `gtag` helper for advanced scenarios.

Consent events are timestamped and deduplicated, so re-rendering `<Analytics>` with the same `defaultConsent` does not emit duplicate `default` events. Listeners added via `subscribeToConsent` receive both the latest event and the full history snapshot.

All helpers safely no-op when the measurement ID is missing or the code executes outside the browser (SSR).

## Initial event examples

Send initial events by passing the `initialEvents` prop:

```jsx
<Analytics
  measurementId={measurementId}
  initialEvents={[
    {
      name: 'page_view',
      params: { page_path: '/landing', page_title: 'Landing Page' },
    },
  ]}
/>
```

## Measurement Protocol fallback

Some environments—such as server-rendered routes or service workers—cannot rely on the GA browser tag. Use
`createMeasurementProtocolClient` to mirror critical events with the GA4 Measurement Protocol. Configure the helper with your
measurement ID and API secret, then send events whenever the browser client is unavailable.

```js
import { createMeasurementProtocolClient } from '@guidogerb/components/analytics'

const mp = createMeasurementProtocolClient({
  measurementId: process.env.GA_MEASUREMENT_ID,
  apiSecret: process.env.GA_API_SECRET,
  clientId: 'offline-client-123',
  userProperties: { deployment: 'edge-worker' },
})

await mp.sendEvent({
  name: 'purchase',
  params: {
    currency: 'USD',
    value: 120,
  },
})
```

Provide `clientId` or `userId` per request (or configure defaults when creating the client). You can also:

- Set `debug: true` to use the GA debug endpoint for validation.
- Merge additional payload details—such as `userProperties`, `nonPersonalizedAds`, or `timestampMicros`—on each call.
- Batch multiple events with `sendEvents({ events: [...] })`.

## Testing & maintenance

## Ecommerce event presets

The package exports convenience builders for common GA4 ecommerce flows. Each
helper returns the event name and normalized parameters so you can forward them
directly to `trackEvent`:

```js
import { useAnalytics, buildAddToCartEvent } from '@guidogerb/components/analytics'

function AddToCartButton({ product }) {
  const analytics = useAnalytics()

  const handleClick = () => {
    const event = buildAddToCartEvent({
      currency: 'USD',
      item: {
        id: product.sku,
        name: product.title,
        price: product.price,
        quantity: 1,
        brand: product.brand,
        categories: product.categories,
      },
    })

    analytics.trackEvent(event.name, event.params)
  }

  return <button onClick={handleClick}>Add to cart</button>
}
```

Available helpers:

- `buildAddToCartEvent(options)` — Normalizes a single item or collection into
  an `add_to_cart` payload and derives the `value` when omitted.
- `buildPurchaseEvent(options)` — Produces a `purchase` event, merging totals,
  tax, shipping, and checkout metadata.
- `buildRefundEvent(options)` — Generates a `refund` event, deriving totals from
  refunded line items and supporting `partial` refunds.

All helpers accept either a single `item` or an `items` array, uppercase the
currency code, and guard against invalid numbers so analytics calls remain
resilient.

- Run the package tests with `pnpm vitest run @guidogerb/components/analytics/src/__tests__/Analytics.test.jsx`.
- Review [`tasks.md`](./tasks.md) for upcoming enhancements and operational follow-ups.

## Support

If you need access to the GA property or help wiring a new tenant, file an issue referencing this package or reach out to the analytics maintainer listed in the project directory.
