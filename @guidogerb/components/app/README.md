# @guidogerb/components-app

Guidogerb application shells live in this package. Each exported React component targets a
specific site template and prewires the shared providers, routers, and page collections so an
application can render with minimal setup in a tenant project.

## Variant roadmap

The package will eventually expose multiple `<App />` variants. Each variant composes the same
baseline infrastructure but tunes data sources, navigation, and page routes for a specific
scenario.

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
| `@guidogerb/components-sw`               | Register the standard service worker (`/sw.js`) so offline caching is immediately available.                                                | `serviceWorkerUrl` when a tenant self-hosts an alternate worker.                |
| `@guidogerb/components-storage`          | Create a storage namespace (`guidogerb.app`) used by auth and feature flags.                                                                | `storagePrefix` for white-label deployments.                                    |

Until the providers above are fully wired, `<AppBasic />` renders a placeholder wrapper. The unit
suite already includes a "renders without crashing" smoke test so we can replace the internals with
confidence once the wiring lands.

## Testing

Run the Vitest suite directly from this package while the workspace manifest is being updated:

```bash
pnpm --dir @guidogerb/components/app test
```

## Status

Work-in-progress. The [tasks plan](./tasks.md) tracks detailed milestones for delivering the
composition described above and for adding additional variants beyond `<AppBasic />`.
