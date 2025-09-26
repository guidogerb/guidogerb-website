# GaryGerber.com — Vite tenant

Artist microsite for Gary Gerber. Combines a long-form landing page for presenters with a protected
rehearsal portal that links collaborators to stage plots, rehearsal checklists, and contact info.

## Local development

```bash
pnpm --filter websites/garygerber.com install
pnpm --filter websites/garygerber.com dev
```

Create a `.env` file from `.env.example` and populate the Cognito credentials listed below.

### Required environment variables

| Variable                                                | Description                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `VITE_COGNITO_CLIENT_ID`                                | Cognito app client for the rehearsal portal.                 |
| `VITE_COGNITO_AUTHORITY` or `VITE_COGNITO_METADATA_URL` | Hosted UI discovery endpoint.                                |
| `VITE_REDIRECT_URI`                                     | Callback URL (e.g., `https://garygerber.com/auth/callback`). |
| `VITE_COGNITO_POST_LOGOUT_REDIRECT_URI`                 | Logout destination.                                          |
| `VITE_RESPONSE_TYPE`                                    | Typically `code`.                                            |
| `VITE_COGNITO_SCOPE`                                    | Requested scopes.                                            |
| `VITE_ENABLE_SW`                                        | Enables/disables service-worker registration.                |

## Structure

```
src/
  App.jsx                # Landing sections + rehearsal portal entry point
  headerSettings.js
  footerSettings.js
  website-components/
    welcome-page/        # Authenticated welcome copy for collaborators
```

The header navigation scrolls through marketing sections (programs, consulting, recordings, etc.).
Once authenticated, collaborators see quick links to PDFs and rehearsal resources defined in the
welcome component.

## Build commands

```bash
pnpm --filter websites/garygerber.com build
pnpm --filter websites/garygerber.com preview
```

## Automation touch points

Automation and provisioning scripts still rely on hard-coded references to this
tenant. The tracked inventory lives in
[`automation-touchpoints.json`](./automation-touchpoints.json) and includes:

- **Root scripts** — `package.json` exposes `build:site:garygerber` and
  `dev:site:garygerber` commands so CI can target this workspace directly.
- **Site configuration** — `vite.config.js`, `generate-sitemap.mjs`, and the
  published `public/sitemap.xml` embed the production domain and local dev
  hostnames.
- **Local development** — the CloudFront/S3 simulators (`infra/local-dev/*`) and
  sync scripts restrict allowed hosts to `local.garygerber.com`.
- **Secrets and runbooks** — `docs/CICD.md` and the seeded
  `GARYGERBER_COM_VITE_ENV-secrets` file document the required environment
  variables for deployments.

Upcoming work—including rehearsal portal expansion and localized error routes—is tracked in
[`tasks.md`](./tasks.md).
