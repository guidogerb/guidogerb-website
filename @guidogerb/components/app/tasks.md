# @guidogerb/components-app — Tasks

The package will ship a catalogue of `<App />` variants so tenant websites can opt into a
pre-configured Guidogerb experience without re-implementing provider wiring.

## Roadmap

| name                                    | createdDate | lastUpdatedDate | completedDate | status   | description                                                                                                                     |
| --------------------------------------- | ----------- | --------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Capture placeholder scope in README     | 2025-09-19  | 2025-09-21      | 2025-09-19    | complete | Documented that the package currently exports a stub while long-term variants are prepared.                                     |
| Design shared app shell structure       | 2025-09-19  | 2025-09-23      | 2025-09-23    | complete | Finalise the provider order, layout regions, and dependency contracts that every variant must honour.                           |
| Blueprint `<AppBasic />` provider stack | 2025-09-21  | 2025-09-23      | 2025-09-23    | complete | Specify default values and tenant-provided props for the base variant so router, auth, API, and UI layers interoperate.         |
| Scaffold `<AppBasic />` component       | 2025-09-21  | 2025-09-21      | 2025-09-21    | complete | Implement the React component that composes all required providers and renders public/protected routes plus shared chrome.      |
| Harden `<AppBasic />` smoke tests       | 2025-09-21  | 2025-09-21      | 2025-09-21    | complete | Extend the current render-only test suite with mocked providers to guard against regression in routing, auth, and data loading. |
| Add future variant specs                | 2025-09-21  | 2025-09-29      | 2025-09-29    | complete | Captured analytics- and commerce-focused variant blueprints for downstream planning tools.                                      |
| Document AppAnalytics variant spec      | 2025-09-29  | 2025-09-29      | 2025-09-29    | complete | Documented dashboards, routes, and provider additions for the analytics-heavy variant catalog entry.                            |
| Document AppCommerce variant spec       | 2025-09-29  | 2025-09-29      | 2025-09-29    | complete | Outlined storefront, checkout, and point-of-sale defaults so the commerce variant can be prioritised next.                      |
| Align `<AppBasic />` defaults with automation | 2025-09-30  | 2025-09-30      | -             | planned  | Define the props/slots the tenant generator must populate so scaffolded sites boot with working marketing and dashboard shells. |

## `<AppBasic />` implementation notes

- **`@guidogerb/components-pages-public`** — ship with marketing, 404, and legal routes so every
  tenant gets a fully functional public surface. Allow overrides via a `publicPages` prop.
- **`@guidogerb/components-pages-protected`** — mount the shared dashboard frame, using a
  `protectedPages` prop for tenant modules and gating everything behind auth guards.
- **`@guidogerb/components-api`** — initialise the shared API client with the production host,
  logging, and retry defaults. Provide props for `apiBaseUrl`, optional headers, and request hooks.
- **`@guidogerb/components-auth`** — bundle the OIDC provider with silent renew and storage defaults;
  collect tenant-specific IDs, secrets, and redirect URIs through props.
- **`@guidogerb/components-menu`** — output the global navigation with Guidogerb defaults while
  accepting `navigationItems`, `activePath`, and optional render overrides to reflect tenant content.
- **`@guidogerb/components-ui`** — wrap the tree in the design system provider to expose theming,
  tokens, and layout primitives. Surface a `themeOverrides` prop for brand accents.
- **`@guidogerb/components-router-public`** — expose a pre-baked router that understands marketing
  routes and fallbacks. Accept `publicRoutes` for tenant additions.
- **`@guidogerb/components-router-protected`** — guard protected routes with auth-aware navigation.
  Support `protectedRoutes` and breadcrumb metadata props.
- **`@guidogerb/components-sw`** — register the shared service worker (`/sw.js`) and expose opt-out or
  custom worker path via props.
- **`@guidogerb/components-storage`** — configure storage namespaces and caching defaults that other
  providers rely on; allow overriding via `storagePrefix`.
- **`@guidogerb/components-ui` widgets** — provide baseline layout wrappers (header, footer, page
  sections) so tenants only slot in copy, imagery, or feature components.

`<AppBasic />` now renders the composed provider stack, marketing landing, and protected routes.
The expanded test suite guards provider wiring so future variants can build on a stable baseline.
