# GGP.llc welcome page component

Placeholder authenticated welcome view for the regulator portal. Currently renders generic copy
until portal requirements are finalised.

- Uses `useAuth()` from `@guidogerb/components-auth` to gate access and surface error/loading states.
- Designed to host quick links to filings, licensing dashboards, and AI assistance tools in future iterations.
- Accepts children so the host application can append additional portal widgets.
