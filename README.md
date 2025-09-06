# @guidogerb — Shared Packages

Reusable packages for all four sites.

## Packages (Phase‑1)
- `@guidogerb/components` — cross‑site React components (pages, router, menu, etc.)
- `@guidogerb/auth` — Cognito Hosted UI + Google OIDC helpers
- `@guidogerb/ui` — design tokens & primitives
- `@guidogerb/api-client` — typed HTTP client
- `@guidogerb/sw` — service worker / PWA helpers

## Dev
```bash
pnpm -r build   # build all packages
pnpm -r dev     # watcher
pnpm -r test    # tests (where present)
```
Coding standards: TS strict, a11y-first components, no secret material in browser code.
