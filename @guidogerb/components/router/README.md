# @guidogerb/components/router

Routing helpers & guards (React Router).

Exports: `RequireAuth`, `RequireAnon`, `TenantRouter` (future), `NavLink`, `ScrollToTop`.

Example:
```tsx
import { RequireAuth } from '@guidogerb/components/router/protected'
<Route path="/app" element={<RequireAuth><DashboardShell/></RequireAuth>} />
```
