# @guidogerb/components-auth/src

Implementation details for the shared authentication helpers. The folder exports three main modules:

- `Auth.jsx` — guard component that triggers redirects, handles loading/error UI, and renders children when authenticated.
- `AuthProvider.jsx` — wrapper around `react-oidc-context` that merges Cognito configuration from props and `import.meta.env`.
- `LoginCallback.jsx` — finalizes PKCE redirects, restores stored `returnTo` hints, and replaces the history entry.

## Key behaviours

- `AuthProvider` normalizes empty strings to `undefined`, logs actionable errors when required fields are missing, and warns if the configured redirect URI does not match the current origin.
- `Auth` prevents duplicate redirect calls by tracking whether `signinRedirect` has already been triggered inside a `useEffect` guard.
- `LoginCallback` supports `returnTo` hints stored as strings, JSON payloads, or structured objects and falls back to `/` when no target is available.

## Testing tips

Vitest tests should mock `react-oidc-context` to emit the desired auth states. Use the exported utilities to
simulate errors, sign-in callbacks, and logout flows without touching real Cognito endpoints.
