# @guidogerb/components

Cross‑site React components organized by feature area.

## Layout

```
components/
  menu/
  pages/
    public/
    protected/
  router/
    public/
    protected/
  ui/
  auth/
  storage/
  analytics/
  catalog/
```

Core rules:

- Compose visuals from `@guidogerb/ui`.
- No site‑specific imports.
- All exports SSR‑safe and accessible.
- Keep `index.js` updated so every component package is exported from the root entry point.

## Exports

The root `index.js` re-exports all component sub-packages. Whenever new components are added, update this file to keep the package surface complete for consumers importing from `@guidogerb/components`.

## Component catalog overview

Use the map below to decide which packages to pull into a tenant project and how they compose with the rest of the system.

| Package                                  | Use when you need...                                                                                                                         | Typically paired with...                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@guidogerb/components-app`              | Drop-in application shells (such as `<AppBasic />`) that prewire routers, analytics, and shared providers for marketing and dashboard flows. | `@guidogerb/components-ui`, `@guidogerb/components-menu`, `@guidogerb/components-router-public`, `@guidogerb/components-router-protected`, `@guidogerb/components-pages-public`, `@guidogerb/components-pages-protected`, `@guidogerb/components-auth`, `@guidogerb/components-analytics`, `@guidogerb/components-sw`, `@guidogerb/components-storage`. |
| `@guidogerb/components-ui`               | Layout primitives, theming, and utilities (`ResponsiveSlot`, `JsonViewer`, design tokens) that keep tenant UIs consistent.                   | Imported by every visual package—especially `@guidogerb/components-app`, `@guidogerb/components-pages-public`, `@guidogerb/components-pages-protected`, `@guidogerb/components-menu`, and commerce surfaces.                                                                                                                                            |
| `@guidogerb/components-analytics`        | Google Analytics 4 instrumentation with a provider + hook to track events, page views, and consent.                                          | Compose near the app shell and routers so navigation events report correctly.                                                                                                                                                                                                                                                                           |
| `@guidogerb/components-auth`             | OIDC wiring, login callbacks, and sign-out controls ready for production tenants.                                                            | `@guidogerb/components-app`, `@guidogerb/components-router-protected`, `@guidogerb/components-pages-protected`, `@guidogerb/components-storage`.                                                                                                                                                                                                        |
| `@guidogerb/components-api-client`       | Typed REST/GraphQL client helpers (`createClient`, `createApi`) with retries, logging, and domain-specific helpers.                          | `@guidogerb/components-catalog`, `@guidogerb/components-point-of-sale`, `@guidogerb/components-ai-support`, any bespoke data providers.                                                                                                                                                                                                                 |
| `@guidogerb/components-storage`          | Cross-environment storage controllers and hooks for persisting preferences, tokens, and cart state.                                          | `@guidogerb/components-auth`, `@guidogerb/components-catalog`, `@guidogerb/components-shopping-cart`, `@guidogerb/components-point-of-sale`, `@guidogerb/components-app`.                                                                                                                                                                               |
| `@guidogerb/components-sw`               | Service worker registration helpers that align caching with storage and offline policies.                                                    | `@guidogerb/components-app`, `@guidogerb/components-storage`, tenant bootstrap scripts.                                                                                                                                                                                                                                                                 |
| `@guidogerb/components-menu`             | Accessible navigation menus and action slots for shared site chrome.                                                                         | `@guidogerb/components-app`, `@guidogerb/components-pages-public`, `@guidogerb/components-router-public`, `@guidogerb/components-router-protected`.                                                                                                                                                                                                     |
| `@guidogerb/components-pages-public`     | Marketing shell, maintenance and error pages, and slot-based hero/section layouts.                                                           | `@guidogerb/components-router-public`, `@guidogerb/components-app`, `@guidogerb/components-menu`, `@guidogerb/components-analytics`.                                                                                                                                                                                                                    |
| `@guidogerb/components-pages-protected`  | Authenticated dashboard frame, loading states, and default protected routes.                                                                 | `@guidogerb/components-router-protected`, `@guidogerb/components-auth`, `@guidogerb/components-app`.                                                                                                                                                                                                                                                    |
| `@guidogerb/components-router-public`    | React Router factories + `<PublicRouter>` wrapper for marketing routes and static pages.                                                     | `@guidogerb/components-pages-public`, `@guidogerb/components-app`, `@guidogerb/components-analytics`.                                                                                                                                                                                                                                                   |
| `@guidogerb/components-router-protected` | Protected router helpers that enforce auth guards around dashboard modules.                                                                  | `@guidogerb/components-pages-protected`, `@guidogerb/components-auth`, `@guidogerb/components-app`.                                                                                                                                                                                                                                                     |
| `@guidogerb/components-catalog`          | GraphQL-driven product catalog with filters, search, persistent layout preferences, and default product renderers.                           | `@guidogerb/components-api-client`, `@guidogerb/components-storage`, `@guidogerb/components-shopping-cart`, `@guidogerb/components-point-of-sale`.                                                                                                                                                                                                      |
| `@guidogerb/components-shopping-cart`    | Cart context, promo/tax engine, and Stripe Elements checkout surface.                                                                        | `@guidogerb/components-catalog`, `@guidogerb/components-point-of-sale`, `@guidogerb/components-storage`.                                                                                                                                                                                                                                                |
| `@guidogerb/components-point-of-sale`    | End-to-end POS workflow that ties catalog browsing, cart management, payments, invoices, and operator profiles together.                     | `@guidogerb/components-catalog`, `@guidogerb/components-shopping-cart`, `@guidogerb/components-auth`, `@guidogerb/components-storage`, `@guidogerb/components-api-client`.                                                                                                                                                                              |
| `@guidogerb/components-ai-support`       | AI-powered support chat widget with guardrails, RAG hooks, and per-user context.                                                             | `@guidogerb/components-app`, tenant API gateways created with `@guidogerb/components-api-client`, analytics for usage tracking.                                                                                                                                                                                                                         |

Start with the app shell, layer in routing/page packages, and then add feature-specific modules (catalog, cart, POS, AI support) as a tenant’s business model expands. Everything remains available from the root `@guidogerb/components` barrel so new workspaces inherit the full design system by default.
