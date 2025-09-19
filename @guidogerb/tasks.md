# @guidogerb Package Follow-ups

## Component library

- [ ] Stand up the `storage`, `analytics`, and `catalog` component packages referenced in the shared components README so the documented layout matches the repository structure.
- [ ] Flesh out `@guidogerb/components/api-client` with typed client helpers for the planned API surface beyond the `/health` stub called out in the package README.

## Authentication

- [ ] Deliver a first-class sign-out control inside `Auth`—the implementation is currently commented out around `signOutRedirect` and needs a production-ready UI.

## Responsive layout system

- [ ] Resolve the open questions in `ResponsiveSlot.spec.md` (design token integration, per-tenant registry overrides, and design tool alignment) to complete the responsive slot roadmap.
