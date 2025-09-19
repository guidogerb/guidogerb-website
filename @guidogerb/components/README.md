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
