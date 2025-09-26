# GuidoGerbPublishing.com — Vite tenant

Publishing operations portal with a long-form marketing landing page and authenticated partner hub.
The site showcases publishing platform features, distribution channels, and provides resources for
label partners once signed in.

## Local development

```bash
pnpm --filter websites/guidogerbpublishing.com install
pnpm --filter websites/guidogerbpublishing.com dev
```

Duplicate `.env.example` to `.env` and supply the Cognito + API credentials listed below.

### Required environment variables

| Variable                                                | Description                                           |
| ------------------------------------------------------- | ----------------------------------------------------- |
| `VITE_COGNITO_CLIENT_ID`                                | Publishing portal Cognito app client.                 |
| `VITE_COGNITO_AUTHORITY` or `VITE_COGNITO_METADATA_URL` | Hosted UI discovery endpoint.                         |
| `VITE_REDIRECT_URI`                                     | Callback URL (`https://publishing.../auth/callback`). |
| `VITE_COGNITO_POST_LOGOUT_REDIRECT_URI`                 | Logout destination.                                   |
| `VITE_RESPONSE_TYPE`                                    | Typically `code`.                                     |
| `VITE_COGNITO_SCOPE`                                    | Cognito scopes requested at login.                    |
| `VITE_API_BASE_URL`                                     | Reserved for CMS/partner API integrations.            |
| `VITE_ENABLE_SW`                                        | Toggles service-worker registration.                  |

## Structure

```
src/
  App.jsx                # Landing sections + smooth-scroll navigation
  headerSettings.js
  footerSettings.js
  website-components/
    welcome-page/        # Authenticated welcome card for partner resources
```

Navigation links scroll to hero sections covering the publishing console, distribution channels, and
resources. Authenticated partners gain access to quick links for release calendars, royalty docs,
and direct contact with publishing ops.

## Build commands

```bash
pnpm --filter websites/guidogerbpublishing.com build
pnpm --filter websites/guidogerbpublishing.com preview
```

## Automation touch points

Automation and provisioning scripts still reference this tenant directly. The tracked
inventory lives in [`automation-touchpoints.json`](./automation-touchpoints.json) and includes:

- **Root scripts** — `package.json` exposes `build:site:guidogerbpublishing` and
  `dev:site:guidogerbpublishing` entries so CI and local tooling can target the workspace.
- **Site configuration** — `vite.config.js`, `generate-sitemap.mjs`, and the published
  `public/sitemap.xml` embed the production domain alongside local development hosts.
- **Local development** — CloudFront/S3 simulators and sync scripts in `infra/local-dev/*`
  enumerate the `guidogerbpublishing.com` hostnames that must be templated during scaffolding.
- **Secrets and runbooks** — `docs/CICD.md` and the seeded
  `GUIDOGERBPUBLISHING_VITE_ENV-secrets` document the required environment variables.
- **Deployment helpers** — the `scripts/deploy-reference.mjs` workflow depends on the
  `guidogerbpublishing` workspace slug for build orchestration.

See [`tasks.md`](./tasks.md) for outstanding work such as wiring CMS-driven content and building the
partner portal route.
