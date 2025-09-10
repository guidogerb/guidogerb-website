# @guidogerb/components/menu

Accessible, data‑driven site navigation used by all sites.

## Components

- `SiteMenu` (brand slot + primary nav + auth button)
- `MobileDrawer` (off‑canvas)
- `NavLink` (active‑aware)
- `UserMenu` (profile/sign‑out)

## Props

```ts
type MenuItem = { label: string; to: string; external?: boolean; children?: MenuItem[] }
interface SiteMenuProps {
  items: MenuItem[]
  brand?: React.ReactNode
  cta?: React.ReactNode
  onSignIn?: () => void
  onSignOut?: () => void
}
```
