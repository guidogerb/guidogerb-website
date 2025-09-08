# PickleCheeze.com — Web App (Vite + React)

Quickstart
- Copy env template: `.env.example` → `.env` and fill VITE_* values.
- Dev: `pnpm --filter websites/picklecheeze.com dev`
- Build: `pnpm --filter websites/picklecheeze.com build`

Required env (VITE_*)
- VITE_ENABLE_SW=false|true (gate service worker)
- VITE_COGNITO_CLIENT_ID, VITE_COGNITO_AUTHORITY or VITE_COGNITO_METADATA_URL
- VITE_REDIRECT_URI, VITE_RESPONSE_TYPE=code, VITE_COGNITO_SCOPE, VITE_COGNITO_POST_LOGOUT_REDIRECT_URI
- VITE_LOGIN_CALLBACK_PATH=/auth/callback
- VITE_API_BASE_URL

PWA/offline
- Set VITE_ENABLE_SW=true to register /sw.js; offline.html is served as fallback for navigations when offline.

Notes
- Uses shared packages under @guidogerb/* (workspace linked).
- See repo PUBLISHING.md for deploy steps (S3 upload + CloudFront invalidation).
