# GGP.llc welcome page component

Authenticated welcome view for the regulator portal.

- Uses `useAuth()` from `@guidogerb/components-auth` to surface error/loading states and personalise
  the greeting with the collaborator's profile details.
- Presents curated sections for filings, licensing dashboards, and AI assistance with
  multi-tenant-friendly links.
- Accepts children so the host application can append additional portal widgets beneath the
  resource overview.
