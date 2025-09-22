# @guidogerb/components/router/protected

Protected-route helpers built on top of the public router utilities. These
helpers apply the shared `<Protected />` guard from
`@guidogerb/components-pages-protected` and keep fallback routes public by
default.

## Exports

- `createProtectedRouteObjects(routes, options)` – Produces route objects that
  wrap each element with the configured guard component while still allowing
  per-route overrides.
- `ProtectedRouter` – A drop-in replacement for `PublicRouter` that injects the
  guard when rendering protected applications.

## Usage

```jsx
import { ProtectedRouter } from '@guidogerb/components-router-protected'
import { createMemoryRouter } from 'react-router-dom'

function PortalApp() {
  return (
    <ProtectedRouter
      router={createMemoryRouter}
      routerOptions={{ initialEntries: ['/dashboard'] }}
      routes={[
        { path: '/dashboard', element: <Dashboard /> },
        { path: '/settings', element: <Settings /> },
        { path: '/login', element: <Login />, isProtected: false },
      ]}
      fallback={<NotFound />}
    />
  )
}
```

Set `protectFallback` to guard the catch-all route, or pass a custom `guard`
component/`guardProps` to integrate alternative authentication flows. When you
omit `fallback`, the helpers generate a default catch-all page – customise or
disable it via the shared `defaultFallback` option.

### Route configuration

- `guard` – Supply a React component or a configuration object to customise the
  guard for an individual route. Configuration objects support `component`,
  `props`, and `disabled` keys so routes can inject bespoke guards or opt out of
  protection entirely.
- `guardProps` – Route-level props merge with the package-level `guardProps`
  options. When both are provided, route props win.
- `isProtected` – Explicitly set to `false` to keep a route public without
  touching guard configuration objects.
