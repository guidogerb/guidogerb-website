# @guidogerb/components/pages

Page‑level shells shared by all four sites.

## Structure

```
pages/
  public/       # open routes
  protected/    # auth‑required routes
```

Public: `PublicShell`, `MarketingShell`  
Protected: `ProtectedShell` (wraps with `RequireAuth`), `DashboardShell`
