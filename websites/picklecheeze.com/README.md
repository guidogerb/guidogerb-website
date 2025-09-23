# PickleCheeze.com — Vite tenant

Partner-facing microsite for PickleCheeze, featuring a marketing landing page and a protected
portal with seasonal resources. The app uses shared packages for the header, footer, theme, and
authenticated welcome card copy tailored to fermentation partners.

## Local development

```bash
pnpm --filter websites/picklecheeze.com install
pnpm --filter websites/picklecheeze.com dev
```

Copy `.env.example` to `.env` and provide the Cognito and API values listed below before running the
site.

### Required environment variables

| Variable | Description |
| -------- | ----------- |
| `VITE_COGNITO_CLIENT_ID` | App client ID for the PickleCheeze Cognito user pool. |
| `VITE_COGNITO_AUTHORITY` or `VITE_COGNITO_METADATA_URL` | Discovery endpoint for the hosted UI. |
| `VITE_REDIRECT_URI` | Callback URL that Cognito should redirect to after login (`https://.../auth/callback`). |
| `VITE_COGNITO_POST_LOGOUT_REDIRECT_URI` | Where Cognito should send users after logout. |
| `VITE_RESPONSE_TYPE` | Usually `code` (PKCE). |
| `VITE_COGNITO_SCOPE` | Space-separated scopes; defaults to `openid email phone profile`. |
| `VITE_API_BASE_URL` | Backing API gateway for partner resources (currently unused but reserved). |
| `VITE_ENABLE_SW` | `true`/`false` flag that controls service-worker registration. |
| `VITE_FLAG_PARTNER_INVENTORY` | Enables the cellar inventory PDF link in the protected partner welcome card. |
| `VITE_FLAG_PARTNER_CARE_GUIDE` | Enables the cheeze care guide download in the protected partner welcome card. |
| `VITE_FLAG_PARTNER_CONTACT_EMAIL` | Enables the partner support email link in the protected partner welcome card. |

## Structure

```
src/
  App.jsx                # Landing sections + protected partner hub
  headerSettings.js      # Shared header navigation definition
  footerSettings.js      # Shared footer links and copy
  website-components/
    welcome-page/        # Authenticated welcome card personalised for partners
```

The header navigation scrolls to marketing sections using the shared router, which also powers the `/maintenance` route and branded 404 experience. Authenticated partners see quick links to PDF resources and contact emails sourced from the welcome component, and each resource can be toggled with the feature flags above.

## Build commands

```bash
pnpm --filter websites/picklecheeze.com build   # Production bundle
pnpm --filter websites/picklecheeze.com preview # Preview the build locally
```

Refer to [`tasks.md`](./tasks.md) for upcoming work such as branded 404 routes and feature flagging
partner resources.
