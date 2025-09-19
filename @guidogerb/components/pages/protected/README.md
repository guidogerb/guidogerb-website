# @guidogerb/components/pages/protected

Authenticated layout helpers that wrap shared Cognito/OIDC flows. The package exports a single
`Protected` component today, which combines the `@guidogerb/components-auth` guard with a simple
loading/error experience.

## Usage

```tsx
import Protected from '@guidogerb/components-pages-protected'
import Dashboard from './Dashboard.jsx'

export function ProtectedRoute() {
  return (
    <Protected logoutUri={import.meta.env.VITE_COGNITO_POST_LOGOUT_REDIRECT_URI}>
      <Dashboard />
    </Protected>
  )
}
```

`Protected` will:

1. Render a loading message while `react-oidc-context` determines the current session.
2. Surface authentication errors inline so tenants can see configuration issues during development.
3. Trigger the hosted UI redirect automatically when `autoSignIn` is enabled (default behaviour).
4. Render children only after the user is authenticated.

Pass a `logoutUri` to redirect users back to the hosted UI logout endpoint. Future iterations will
accept custom loading/unauthenticated render props so tenants can provide branded experiences.
