# @guidogerb/components-auth

Shared authentication primitives built on top of [`react-oidc-context`](https://github.com/authts/react-oidc-context).
The package exposes a drop-in `<AuthProvider />` that normalizes Cognito/OpenID Connect configuration,
convenience guards for protected routes, and a login callback component that finalizes PKCE redirects.

## Installation

```bash
pnpm add @guidogerb/components-auth
```

## Quick start

```tsx
import { AuthProvider, Auth, useAuth } from '@guidogerb/components-auth'

export function App({ children }) {
  return (
    <AuthProvider
      authority={import.meta.env.VITE_COGNITO_AUTHORITY}
      client_id={import.meta.env.VITE_COGNITO_CLIENT_ID}
      loginCallbackPath="/auth/callback"
    >
      <Auth
        autoSignIn
        logoutUri={import.meta.env.VITE_COGNITO_POST_LOGOUT_REDIRECT_URI}
        signOutButtonProps={{
          pendingText: 'Signing out…',
          successText: 'Signed out — see you soon!',
        }}
      >
        <ProtectedArea />
      </Auth>
    </AuthProvider>
  )
}

function ProtectedArea() {
  const auth = useAuth()
  return <pre>Signed in as {auth?.user?.profile?.email}</pre>
}
```

`AuthProvider` merges props with environment variables (`VITE_COGNITO_*` and `VITE_REDIRECT_URI`) and
gracefully reports misconfiguration before rendering children. The optional `loginCallbackPath`
controls where the hosted UI redirects after authentication; the `LoginCallback` component will
consume the redirect response, restore any stored `returnTo` hint, and send the user back to their
previous location.

### Branded sign-out control

Use the `SignOutControl` when you want a production-ready panel that surfaces
account metadata alongside the sign-out action. It reads the current user from
context, shows avatar initials, and reuses the same redirect handling as the raw
button.

```tsx
import { SignOutControl } from '@guidogerb/components-auth'

export function AccountMenu() {
  return (
    <SignOutControl
      title="Signing off?"
      message="Redirecting through Cognito keeps your session clean."
      buttonProps={{
        redirectUri: import.meta.env.VITE_COGNITO_POST_LOGOUT_REDIRECT_URI,
        variant: 'secondary',
      }}
    />
  )
}
```

Need the bare button? Import `SignOutButton` directly—it shares the same pending
states, error messaging, and redirect fallbacks.

## Components

| Export | Description |
| ------ | ----------- |
| `AuthProvider` | Configures `react-oidc-context` with Cognito-friendly defaults and renders `<LoginCallback />` when the current pathname matches `loginCallbackPath`. |
| `Auth` | Lightweight guard that triggers `signinRedirect()` when `autoSignIn` is enabled, surfaces loading/error states, and otherwise renders its children. Optional sign-out control renders when `logoutUri` is supplied or `showSignOut` is set. |
| `LoginCallback` | Finalizes the PKCE redirect, restores `returnTo` targets from storage, and replaces the history entry so callback URLs do not linger. |
| `useAuth` | Re-exported hook from `react-oidc-context` for teams that need direct access to the underlying context. |
| `useTokenRenewal` | Hook that tracks token expiration, exposes silent renew status, and provides a `renew()` helper around `signinSilent()`. |
| `SignOutControl` | Full-width card that displays account metadata alongside the sign-out action, suitable for account menus and dashboards. |
| `SignOutButton` | Branded action that wraps `signoutRedirect`, handles redirect URIs, and conveys pending/error states to the UI with accessible feedback. |

### Monitor silent token renewal

Use `useTokenRenewal` (also exported as `useSilentTokenRenewal`) to react when the
current access token is about to expire. The hook subscribes to OIDC events, sets
up early-warning timers, and exposes a `renew()` helper for manual refresh flows.

```tsx
import { useTokenRenewal } from '@guidogerb/components-auth'

export function SessionWatcher() {
  const { shouldRenew, renew, expiresIn, isRenewing, error } = useTokenRenewal({
    earlyRefreshMs: 60_000,
  })

  if (!shouldRenew) return null

  return (
    <div role="status" aria-live="polite">
      {isRenewing ? 'Refreshing session…' : `Session expiring in ${Math.ceil((expiresIn ?? 0) / 1000)}s`}
      <button onClick={() => renew()} disabled={isRenewing}>
        Refresh now
      </button>
      {error ? <span style={{ color: '#dc2626' }}>Refresh failed: {error.message}</span> : null}
    </div>
  )
}
```

## Error handling & logging

- Missing configuration (authority/metadata URL, client ID, redirect URI) renders an inline warning and logs a descriptive error to the console.
- Redirect URI mismatches are logged with remediation steps to help developers align Cognito app client settings with the current origin.
- Authentication errors bubble through the `Auth` component and appear next to the protected content, making it obvious when a tenant has misconfigured hosted UI settings.

## Testing

Vitest coverage lives under `src/__tests__`. Mock `react-oidc-context` to simulate loading, error,
and authenticated states when writing additional tests.
