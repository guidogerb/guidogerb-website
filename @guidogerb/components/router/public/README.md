# @guidogerb/components/router/public

Helper utilities for building React Router configurations that only expose
public pages. The package focuses on normalizing route definitions and wiring a
`RouterProvider` so tenant apps can opt into data routers without repetitive
boilerplate.

## Exports

- `createRouteObjects(routes, options)` – Converts a lightweight route
  definition array into React Router `RouteObject`s. Automatically appends a
  fallback catch-all route when provided and supports redirect helpers.
- `PublicRouter` – Convenience component that creates a browser (or memory)
  router under the hood and renders a `RouterProvider` with the supplied routes.

## Usage

```jsx
import { PublicRouter } from '@guidogerb/components-router-public'
import { createMemoryRouter } from 'react-router-dom'

function MarketingApp() {
  return (
    <PublicRouter
      router={createMemoryRouter}
      routerOptions={{ initialEntries: ['/'] }}
      routes={[
        { path: '/', element: <LandingPage /> },
        { path: '/contact', element: <ContactForm /> },
      ]}
      fallback={<NotFoundPage />}
    />
  )
}
```

`wrapElement` can be supplied to decorate every route element—for example to
inject shared layouts or analytics boundaries—before the router renders it.
