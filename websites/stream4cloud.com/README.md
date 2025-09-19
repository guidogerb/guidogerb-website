# Stream4Cloud.com — Vite tenant

Marketing + partner portal for Stream4Cloud broadcasters. The site ships with a simple public
teaser and a protected welcome card that reuses shared authentication packages.

## Local development

```bash
pnpm --filter websites/stream4cloud.com install
pnpm --filter websites/stream4cloud.com dev
```

Copy `.env.example` to `.env` and configure the Cognito + API variables listed below.

### Required environment variables

| Variable | Description |
| --- | --- |
| `VITE_COGNITO_CLIENT_ID` | Cognito app client ID for Stream4Cloud. |
| `VITE_COGNITO_AUTHORITY` or `VITE_COGNITO_METADATA_URL` | Hosted UI discovery endpoint. |
| `VITE_REDIRECT_URI` | Hosted UI callback (e.g., `https://stream4cloud.com/auth/callback`). |
| `VITE_COGNITO_POST_LOGOUT_REDIRECT_URI` | Where users land after signing out. |
| `VITE_RESPONSE_TYPE` | Usually `code`. |
| `VITE_COGNITO_SCOPE` | Requested scopes. |
| `VITE_LOGOUT_URI` | Optional override used by `<Protected />`. |
| `VITE_API_BASE_URL` | Reserved for upcoming dashboard APIs. |
| `VITE_ENABLE_SW` | Enables service worker registration. |

## Structure

- `src/App.jsx` — renders public copy plus the protected welcome region.
- `src/website-components/welcome-page/` — component that greets authenticated broadcasters.

## Build commands

```bash
pnpm --filter websites/stream4cloud.com build
pnpm --filter websites/stream4cloud.com preview
```

Consult [`tasks.md`](./tasks.md) for outstanding work such as richer marketing copy and offline
fallbacks.
