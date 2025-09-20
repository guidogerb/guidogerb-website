# @guidogerb/components/router/public

Helper utilities for building React Router configurations that only expose
public pages. The package focuses on normalizing route definitions and wiring a
`RouterProvider` so tenant apps can opt into data routers without repetitive
boilerplate.

## Exports

- `createRouteObjects(routes, options)` – Converts a lightweight route
  definition array into React Router `RouteObject`s. Automatically appends a
  catch-all route using the supplied `fallback` definition or a generated
  default when no fallback is provided.
- `PublicRouter` – Convenience component that creates a browser (or memory)
  router under the hood and renders a `RouterProvider` with the supplied
  routes. Accepts an optional `defaultFallback` prop for tuning the generated
  not-found experience.

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

### Customising the generated fallback

When the `fallback` prop is omitted, the router emits an accessible not-found
experience that includes a heading, descriptive copy, and navigation links. The
copy defaults to English strings, but you can override them with
`defaultFallback`:

```jsx
<PublicRouter
  routes={[{ path: '/', element: <Home /> }]}
  defaultFallback={{
    title: 'Nicht gefunden',
    description: 'Bitte prüfen Sie die Adresse oder wählen Sie eine Option.',
    homeHref: '/start',
    homeLabel: 'Zur Startseite',
    supportHref: 'mailto:hallo@example.com',
    supportLabel: 'Support kontaktieren',
  }}
/>
```

Provide `defaultFallback: false` to opt out of the generated catch-all entirely
when you plan to append your own terminal route later in the list.
