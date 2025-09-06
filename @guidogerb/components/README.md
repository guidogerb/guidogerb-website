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
