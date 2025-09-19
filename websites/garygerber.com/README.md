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

| Variable | Description |
| --- | --- |
| `VITE_COGNITO_CLIENT_ID` | Cognito app client for the rehearsal portal. |
| `VITE_COGNITO_AUTHORITY` or `VITE_COGNITO_METADATA_URL` | Hosted UI discovery endpoint. |
| `VITE_REDIRECT_URI` | Callback URL (e.g., `https://garygerber.com/auth/callback`). |
| `VITE_COGNITO_POST_LOGOUT_REDIRECT_URI` | Logout destination. |
| `VITE_RESPONSE_TYPE` | Typically `code`. |
| `VITE_COGNITO_SCOPE` | Requested scopes. |
| `VITE_ENABLE_SW` | Enables/disables service-worker registration. |

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

Upcoming work—including rehearsal portal expansion and localized error routes—is tracked in
[`tasks.md`](./tasks.md).
