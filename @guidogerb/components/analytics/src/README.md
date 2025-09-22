# @guidogerb/components-analytics/src

Source modules powering the shared Google Analytics 4 integration.

- `Analytics.jsx` — provider component that injects the GA tag, merges configuration, and exposes the analytics context.
- `AnalyticsRouterBridge.jsx` — hook + component pair that listens to React Router navigation and dispatches page view events.
- `index.js` — barrel file exporting the provider, router bridge helpers, and analytics utilities to consumers.

## Implementation notes

- The provider guards against duplicate script injection and respects the `debugMode` and `sendPageView` props before calling `gtag`.
- Consent defaults and initial events are dispatched immediately after configuration to align with CMP requirements.
- All helpers no-op on the server or when no measurement ID is supplied, keeping SSR builds safe.

## Testing

Unit tests live under `__tests__/Analytics.test.jsx`. They mock the global `gtag` function to verify
script loading, consent updates, and event dispatch sequencing.

Additional coverage for the router bridge lives in `__tests__/AnalyticsRouterBridge.test.jsx`. These tests assert that
the bridge dispatches page views on navigation, respects guards, and supports custom event names.

## Router bridge usage

```jsx
import { Analytics, AnalyticsRouterBridge } from '@guidogerb/components-analytics'
import { BrowserRouter } from 'react-router-dom'

function App() {
  return (
    <Analytics measurementId="G-123456" sendPageView={false}>
      <BrowserRouter>
        <AnalyticsRouterBridge trackInitialPageView />
        {/* routes */}
      </BrowserRouter>
    </Analytics>
  )
}
```

### Options

- `trackInitialPageView` — dispatches the first location when mounting instead of waiting for a navigation event.
- `includeSearch` / `includeHash` — toggles whether query strings or hash fragments are appended to the tracked path.
- `getPath` / `getParams` — override how the tracked path or GA parameters are generated.
- `shouldTrack` — receives `{ path, location, navigationType, isInitial }` and can return `false` to skip dispatching.
- `eventName` — custom GA event name; defaults to `page_view` but can be switched to events such as `screen_view`.
- `onTrack` — invoked after an event is dispatched with the resolved path, params, and router context.
