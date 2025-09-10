# infra/scripts/writehtml

Utility scripts to generate static HTML pages (e.g., `offline.html`, `index.json` snapshots).

## Suggested scripts

- `write-offline-page.ts`: produce `/offline.html` with cache-busting hash.
- `generate-sitemap.ts`: emit `/sitemap.xml` from route config.
- `export-env.ts`: write `.well-known/app-config.json` for runtime config (non-secrets).

> Keep secrets **out** of static files. Use environment variables and Cognito Hosted UI for auth.
