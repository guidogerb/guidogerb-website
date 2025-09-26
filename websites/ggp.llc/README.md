# GGP.llc — Vite tenant

Landing page prototype for the GGP regulatory platform. The site currently renders placeholder copy
and a protected welcome card while we translate the broader SPEC into a focused marketing message.

## Local development

```bash
pnpm --filter websites/ggp.llc install
pnpm --filter websites/ggp.llc dev
```

Duplicate `.env.example` to `.env` and fill in the Cognito settings that will back the regulator
portal once content is ready.

### Required environment variables

| Variable                                                | Description                                  |
| ------------------------------------------------------- | -------------------------------------------- |
| `VITE_COGNITO_CLIENT_ID`                                | Cognito app client for the regulator portal. |
| `VITE_COGNITO_AUTHORITY` or `VITE_COGNITO_METADATA_URL` | Hosted UI discovery endpoint.                |
| `VITE_REDIRECT_URI`                                     | Callback URL for the hosted UI.              |
| `VITE_COGNITO_POST_LOGOUT_REDIRECT_URI`                 | Logout destination.                          |
| `VITE_RESPONSE_TYPE`                                    | Typically `code`.                            |
| `VITE_COGNITO_SCOPE`                                    | Requested scopes.                            |
| `VITE_ENABLE_SW`                                        | Enables service worker registration.         |

## Structure

- `src/App.jsx` — renders a placeholder marketing card plus the protected portal shell.
- `src/website-components/welcome-page/` — welcome component that will eventually link to filing and licensing dashboards.

## Build commands

```bash
pnpm --filter websites/ggp.llc build
pnpm --filter websites/ggp.llc preview
```

## Automation touch points

Automation and provisioning scripts still hard-code references to this tenant. The
tracked inventory lives in [`automation-touchpoints.json`](./automation-touchpoints.json)
and includes:

- **Root scripts** — the repo `package.json` exposes `build:site:ggp-llc` and
  related commands so CI can target this workspace.
- **Site configuration** — `generate-sitemap.mjs` and the published
  `public/sitemap.xml` embed the production `ggp.llc` host.
- **Preview hosts** — `vite.config.js` restricts HTTPS preview traffic to the
  `llc.guidogerbpublishing.com` alias used during staging.
- **Secrets and runbooks** — the seeded `GGP-LLC_VITE_ENV-secrets` file and
  `docs/CICD.md` map the tenant to the correct environment secret.
- **Local development** — CloudFront/S3 simulators in `infra/local-dev/*`
  enumerate `local.ggp.llc` and related hostnames.
- **Infrastructure** — `infra/ps1/cf-distributions.json` and the tenant manifest
  keep the workspace slug available to provisioning scripts.

See [`tasks.md`](./tasks.md) for next steps, including real marketing copy, portal routing, and branded
error pages.
