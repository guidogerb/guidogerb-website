# @guidogerb/components-app

Guidogerb application shells live in this package. Each exported React component targets a
specific site template and prewires the shared providers, routers, and page collections so an
application can render with minimal setup in a tenant project.

## Variant roadmap

The package will eventually expose multiple `<App />` variants. Each variant composes the same
baseline infrastructure but tunes data sources, navigation, and page routes for a specific
scenario.

### Variant catalog helpers

`@guidogerb/components-app` publishes metadata describing every planned variant. Consumers can
inspect the catalog through the new `APP_VARIANT_SPECS` constant or helper functions.

```js
import { APP_VARIANT_SPECS, getAppVariantSpec } from '@guidogerb/components-app'

const variants = Object.values(APP_VARIANT_SPECS)
const analytics = getAppVariantSpec('analytics')
```

### `<AppBasic />`

The first variant focuses on marketing-forward sites that still require authenticated dashboards.
The composition plan bakes in the following integrations so consuming sites only pass the pieces
that truly differ per tenant:

| Integration package                      | Hard-coded defaults                                                                                                                         | Site-specific props                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `@guidogerb/components-pages-public`     | Load the shared marketing shell and 404 view so every site has a working public route tree out of the box.                                  | `publicPages` lets tenants register additional routes or override hero content. |
| `@guidogerb/components-pages-protected`  | Attach the default dashboard layout and loading/error states so protected routes feel cohesive across tenants.                              | `protectedPages` accepts feature modules (reports, bookings, etc.) per tenant.  |
| `@guidogerb/components-api`              | Point at the production API domain and enable retry + logging defaults required by other providers.                                         | `apiBaseUrl`, optional `fetch`/`logger` overrides.                              |
| `@guidogerb/components-auth`             | Ship the OIDC provider wiring with the shared authority URL, silent renew, and storage keys.                                                | `clientId`, `redirectUri`, and tenant copy for the login experience.            |
| `@guidogerb/components-menu`             | Render the global navigation menu with default styling and accessibility props.                                                             | `navigationItems`, `activePath`, and custom link renderers.                     |
| `@guidogerb/components-ui`               | Wrap the app in the design system provider and expose shared layout primitives so tokens, typography, and chrome match the Guidogerb brand. | `themeOverrides` plus slot props for header/footer overrides.                   |
| `@guidogerb/components-router-public`    | Provide the canonical public router instance so marketing URLs resolve consistently.                                                        | `publicRoutes` prop to register tenant-specific routes.                         |
| `@guidogerb/components-router-protected` | Supply the protected router configured with authentication guards.                                                                          | `protectedRoutes`, optional breadcrumb metadata.                                |
| `@guidogerb/components-sw`               | Register the standard service worker (`/sw.js`) so offline caching is immediately available.                                                | `serviceWorker` prop forwards custom registration options.                      |
| `@guidogerb/components-storage`          | Create a storage namespace (`guidogerb.app`) used by auth and feature flags.                                                                | `storage` props configure alternate namespaces and persistence.                 |

`<AppBasic />` now composes the provider stack, shared marketing landing, protected router, and
chrome so tenant projects can render both public and authenticated routes without manual wiring.
Override navigation, header, footer, authentication, API client, storage, service worker, theming,
and page collections through the component props.

#### Blueprint & planning helpers

`@guidogerb/components-app` now exports metadata describing the shared shell contract so new
variants can reason about provider order and tenant extension points:

- **`APP_SHELL_PROVIDER_BLUEPRINT`** – ordered list of providers (`storage → auth → header → ui`)
  with the package each slot relies on.
- **`APP_SHELL_LAYOUT_BLUEPRINT`** – layout regions (`header`, `main`, `footer`) that every
  variant must render along with the ARIA role and dependency hints.
- **`createAppBasicPlan(props)`** – pure helper that normalises `<AppBasic />` props into a plan
  object containing defaults, resolved provider props, router wiring, and tenant controls.
- **`useAppBasicPlan()`** – hook that exposes the runtime plan from context for diagnostics or
  custom analytics.

```jsx
import {
  AppBasic,
  APP_SHELL_PROVIDER_BLUEPRINT,
  createAppBasicPlan,
  useAppBasicPlan,
} from '@guidogerb/components-app'

const plan = createAppBasicPlan()
console.log(plan.providerBlueprint.order) // ['storage', 'auth', 'header', 'ui']

function DebugPanel() {
  const runtimePlan = useAppBasicPlan()
  return <pre>{JSON.stringify(runtimePlan?.router.routes.map((route) => route.path), null, 2)}</pre>
}

function App() {
  return (
    <AppBasic>
      <DebugPanel />
    </AppBasic>
  )
}
```

### `AppAnalytics`

The analytics-focused variant builds on `<AppBasic />` with dashboards, benchmarking utilities, and
instrumentation helpers.

- **Target tenants** – labels and analytics teams tracking streaming KPIs, release velocity, and
  territory performance.
- **Provider additions** – registers `@guidogerb/components-analytics` after the API and storage
  providers so consent-aware instrumentation is available across public and protected routes.
- **Default routes** – introduces `/analytics` and `/reports` protected paths plus an optional
  `/insights` marketing page showcasing curated case studies.
- **Operational notes** – requires GA4 measurement IDs (or equivalent keys) and an export bucket for
  scheduled report delivery.

### `AppCommerce`

The commerce variant layers catalog, checkout, and point-of-sale flows on top of `<AppBasic />`.

- **Target tenants** – artists and partners monetising catalogues or managing inventory through
  offline-friendly registers.
- **Provider additions** – wires the catalog, shopping cart, and point-of-sale packages so product
  data, checkout flows, and Stripe-powered registers reuse shared storage and analytics defaults.
- **Default routes** – adds a `/shop` storefront plus `/orders` and `/catalog` protected workspaces
  for fulfilment and merchandising teams.
- **Operational notes** – expects Stripe publishable/secret keys, webhook endpoints, and inventory
  integration settings; background sync keeps POS transactions resilient offline.

## Testing

Run the Vitest suite directly from this package while the workspace manifest is being updated:

```bash
pnpm --dir @guidogerb/components/app test
```

The test suite mocks dependent providers to assert routing, authentication, service worker, and
storage wiring. Refer to the [tasks plan](./tasks.md) for upcoming variant work.
