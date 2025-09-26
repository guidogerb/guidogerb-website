# This-Is-My-Story.org — Vite tenant

Story-sharing microsite that mixes a public teaser card with a protected area for authenticated
contributors. The app reuses the shared protected-page shell and displays a simple welcome card
while we flesh out editorial content.

## Local development

```bash
pnpm --filter websites/this-is-my-story.org install
pnpm --filter websites/this-is-my-story.org dev
```

Copy `.env.example` → `.env` and configure the Cognito values below.

### Required environment variables

| Variable                                                | Description                                                 |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| `VITE_COGNITO_CLIENT_ID`                                | Cognito app client ID for storytellers.                     |
| `VITE_COGNITO_AUTHORITY` or `VITE_COGNITO_METADATA_URL` | Hosted UI discovery endpoint.                               |
| `VITE_REDIRECT_URI`                                     | Callback URL (`https://tenant/.../auth/callback`).          |
| `VITE_COGNITO_POST_LOGOUT_REDIRECT_URI`                 | Logout destination.                                         |
| `VITE_RESPONSE_TYPE`                                    | Usually `code`.                                             |
| `VITE_COGNITO_SCOPE`                                    | Space-separated scopes.                                     |
| `VITE_LOGOUT_URI`                                       | Optional override forwarded to the `<Protected />` wrapper. |
| `VITE_ENABLE_SW`                                        | Enables service-worker registration when `true`.            |

## Structure

- `src/App.jsx` — renders a public teaser card plus a protected storyteller section.
- `src/website-components/welcome-page/` — welcome component that greets authenticated users.

## Build commands

```bash
pnpm --filter websites/this-is-my-story.org build
pnpm --filter websites/this-is-my-story.org preview
```

## Automation touch points

Automation and provisioning scripts still rely on hard-coded references to this
tenant. The tracked inventory lives in
[`automation-touchpoints.json`](./automation-touchpoints.json) and includes:

- **Root scripts** — `package.json` exposes `build:site:this-is-my-story` and
  `dev:site:this-is-my-story` commands so CI can target this workspace.
- **Site configuration** — `vite.config.js`, `generate-sitemap.mjs`, and the
  published `public/sitemap.xml` embed the production domain and local dev
  hostnames.
- **Local development** — the CloudFront/S3 simulators (`infra/local-dev/*`)
  and sync scripts restrict allowed hosts to `local.this-is-my-story.org`.
- **Secrets and runbooks** — `docs/CICD.md` and the seeded
  `THISISMYSTORY_VITE_ENV-secrets` file document the required environment
  variables for deployments.
- **Infrastructure metadata** — CloudFront exports and backup params under
  `infra/ps1` and `infra/cfn` enumerate the tenant domain and buckets.
- **Provisioning manifest** — `infra/ps1/tenant-manifest.json` records the
  workspace slug consumed by the tenant generator.

See [`tasks.md`](./tasks.md) for roadmap items such as richer public content and branded error
routes.
