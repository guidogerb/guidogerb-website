# GGP.llc source

Source directory for the GGP regulatory platform marketing site and the initial regulator portal skeleton.

- `main.jsx` — mounts the React application and registers the shared service worker when enabled.
- `App.jsx` — defines the marketing landing experience, portal routes, and public router configuration.
- `App.css` / `index.css` — brand styling for the modernization narrative and secure workspace preview.
- `headerSettings.js` / `footerSettings.js` — navigation, calls-to-action, and footer content for the site shell.
- `useRegulatorNavigation.js` — scroll-aware navigation handler shared by the header and footer links.
- `website-components/welcome-page/` — authenticated regulator workspace preview rendered behind `<Protected />`.
- `__tests__/` — Vitest suite validating landing content, routing, and portal scaffolding.
