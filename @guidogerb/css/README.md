# @guidogerb/css

Shared styles, design tokens, and theme management utilities for Guido & Gerber
web applications.

- `tokens.css` — base color/spacing/radius/shadow/typography scales
- `reset.css` — normalize baseline
- `ThemeProvider` — React provider that applies CSS variables, exposes the
  active theme, and persists changes to local storage (with a service worker
  notification for offline support)
- `ThemeSelect` — ready-made selector that can be embedded in
  `@guidogerb/header` to switch between themes and create new ones

## Usage

```tsx
import '@guidogerb/css/reset.css'
import '@guidogerb/css/tokens.css'
import { ThemeProvider, ThemeSelect } from '@guidogerb/css'
import { Header } from '@guidogerb/header'

export function AppShell({ children }) {
  return (
    <ThemeProvider defaultThemeId="midnight">
      <Header
        renderThemeToggle={() => (
          <ThemeSelect label="Theme" createLabel="New theme" />
        )}
      />
      {children}
    </ThemeProvider>
  )
}
```

### ThemeProvider props

- `themes` — optional array of theme definitions to supplement or replace the
  defaults. Each definition may include an `id`, `name`, and a `tokens` object
  mapping CSS custom properties (`--color-bg`, `--color-primary`, …) to values.
- `defaultThemeId` — the default theme applied when no persisted selection is
  found (`midnight` by default).
- `initialThemeId` — compile-time override for the active theme. Useful when a
  tenant wants to ship a preselected theme without waiting for persisted state
  to load in the browser.
- `onThemeChange` — optional callback invoked whenever the active theme changes
  (after persistence completes).

The provider persists the active theme id and custom theme definitions using
`window.localStorage`. Whenever themes are saved, a `guidogerb:css-theme-update`
message is posted to the service worker controller (when available) so offline
caches can react.

### ThemeSelect

`ThemeSelect` consumes the context exposed by `ThemeProvider` and renders:

- a `<select>` listing all available base + custom themes
- a button that reveals a simple form for creating custom color palettes
- inputs for the primary background/text/accent token values

Custom themes inherit the rest of the design tokens from the currently active
base theme and are stored alongside the active selection. Newly created themes
become active immediately, making it easy to wire into the header via the
`renderThemeToggle` slot.

Additional exports include:

- `useTheme()` — hook to access the theme context directly
- `DEFAULT_THEMES` / `DEFAULT_THEME_ID` — the out-of-the-box theme set
- `createThemeId()` / `normalizeThemeDefinition()` — helpers for custom flows
- storage helpers (`loadStoredThemes`, `saveCustomThemes`, …) if deeper control
  is needed
