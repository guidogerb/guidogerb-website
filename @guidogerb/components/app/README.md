# @guidogerb/components-app

Placeholder export for the eventual multi-tenant application shell. The current implementation
returns a simple heading to keep workspace builds happy while other packages stabilise.

## Planned surface

- Unified `<App />` component that wires global providers (theme, analytics, router, auth).
- Slot-based layout that composes header/footer, navigation, and tenant-specific pages.
- Environment-aware bootstrapping so the same bundle can serve marketing and authenticated routes.

Until those features are implemented, tenants should import more specific packages (e.g.,
`@guidogerb/components-pages-public`, `@guidogerb/components-pages-protected`) to compose
their applications.
