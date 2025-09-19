# @guidogerb/components-analytics/src

Source modules powering the shared Google Analytics 4 integration.

- `Analytics.jsx` — provider component that injects the GA tag, merges configuration, and exposes the analytics context.
- `index.js` — barrel file exporting the provider and `useAnalytics` hook to consumers.

## Implementation notes

- The provider guards against duplicate script injection and respects the `debugMode` and `sendPageView` props before calling `gtag`.
- Consent defaults and initial events are dispatched immediately after configuration to align with CMP requirements.
- All helpers no-op on the server or when no measurement ID is supplied, keeping SSR builds safe.

## Testing

Unit tests live under `__tests__/Analytics.test.jsx`. They mock the global `gtag` function to verify
script loading, consent updates, and event dispatch sequencing.
