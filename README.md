# @guidogerb — Shared Packages

Reusable packages for all four sites.

## Packages (Phase–1)

- `@guidogerb/components` — cross–site React components (pages, router, menu, etc.)
- `@guidogerb/auth` — Cognito Hosted UI + Google OIDC helpers
- `@guidogerb/ui` — design tokens & primitives
- `@guidogerb/api-client` — typed HTTP client
- `@guidogerb/sw` — service worker / PWA helpers

## Task tracking

- [`global-tasks.md`](./global-tasks.md) captures repository-wide work.
- Each package or website folder includes a `tasks.md` outlining local follow-ups.

## Dev

```bash
pnpm -r build   # build all packages
pnpm -r dev     # watcher
pnpm -r test    # tests (where present)
```

Coding standards: TS strict, a11y-first components, no secret material in browser code.

## Third-party Node.js libraries

Runtime packages depend exclusively on `@guidogerb/*` workspaces; the third-party tools listed below support development and testing workflows across the monorepo. MIT-licensed entries are earmarked for future replacement with bespoke @guidogerb solutions.

| Library | License | Feature improved |
| --- | --- | --- |
| `@eslint/js` | MIT | Provides the baseline ESLint rule set that powers repository-wide linting. |
| `@testing-library/jest-dom` | MIT | Adds DOM-specific matchers so assertions can verify accessibility-friendly output. |
| `@testing-library/react` | MIT | Supplies lightweight utilities to render React components and query the virtual DOM in tests. |
| `@testing-library/user-event` | MIT | Simulates high-level user interactions (clicks, typing, tabbing) during component tests. |
| `@types/react` | MIT | Delivers TypeScript type definitions for React when authoring website code. |
| `@types/react-dom` | MIT | Provides TypeScript definitions for the React DOM renderer APIs. |
| `@vitejs/plugin-react` | MIT | Enables automatic JSX transform and fast refresh integration inside the Vite bundler. |
| `eslint` | MIT | Runs the ESLint engine to enforce code-quality and consistency rules. |
| `eslint-plugin-react-hooks` | MIT | Supplies ESLint rules that validate correct usage of React Hooks. |
| `eslint-plugin-react-refresh` | MIT | Guards React components against patterns that break Fast Refresh during development. |
| `globals` | MIT | Shares predefined global variables so ESLint understands the browser and Node environments. |
| `jsdom` | MIT | Creates a browser-like DOM implementation required for rendering components in Node-based tests. |
| `prettier` | MIT | Formats source files to a consistent style across the project. |
| `rimraf` | ISC | Offers cross-platform removal of build artifacts during cleanup tasks. |
| `vite-plugin-mkcert` | MIT | Generates local HTTPS certificates so Vite previews run with trusted origins. |
| `vitest` | MIT | Executes the unit and integration test suites with a Jest-compatible API. |

```
## Local development hosts`
127.0.0.1 local.guidogerbpublishing.com
127.0.0.1 *.local.guidogerbpublishing.com
127.0.0.2 local.picklecheeze.com
127.0.0.2 *.local.picklecheeze.com
127.0.0.3 local.this-is-my-story.org
127.0.0.3 *.local.this-is-my-store.org
127.0.0.4 local.stream4cloud.com
127.0.0.4 *.local.stream4cloud.com
127.0.0.7 local.garygerber.com
127.0.0.7 *.local.garygerber.com
```

## Where to add rules

- Lint rules (ESLint): add or change them in each workspace’s eslint.config.js (for example: websites/stream4cloud.com/eslint.config.js → rules: { ... }). The root `pnpm -r lint` will pick them up per package.
  - If you want shared rules across all sites, create a shared config package (e.g., @guidogerb/eslint-config) later and extend it in each site. For now, rules are per-site.
- CI/CD rules: adjust GitHub Actions workflows in .github/workflows/
  - build.yml controls PR CI and basic build/lint.
  - deploy.yml controls the multi-tenant build and deploy matrix (branches main/prod, environment selection, S3/CloudFront steps).
  - See [S3_DEPLOYMENT_ROLES.md](docs/S3_DEPLOYMENT_ROLES.md) for complete IAM roles and permissions needed for deployment.
- Formatting rules: Prettier is not configured yet in the repo. If/when added, place the config at the repo root (e.g., .prettierrc) and a format script in package.json, or per workspace.
- TypeScript rules: when TypeScript is introduced, place compiler options in tsconfig.json at the root (and extend per package as needed), and enable type-aware linting in the eslint configs.

## Architecture at a glance (SPEC-1)

- Core stack: Vite, React, TypeScript on the web; AWS with API Gateway, Lambda, DynamoDB, CloudFront, S3, Cognito; Stripe for payments.
- Multi-tenant + custom domains via CloudFront; TLS with ACM; DNS with Route 53.
- PWA with a service worker: offline precache of the shell, Background Sync for writes, offline.html fallback.
- Security & compliance: PCI SAQ-A boundary (Stripe-hosted), GDPR, encryption with KMS, WAF protections, IAM least privilege.
- Secure downloads use a pre-signed URL plus a permission-hash with TTL, limited uses, and audit logging.
- Search: OpenSearch Serverless (BM25) to start; vector/RAG optional later.
- Observability: Lambda Powertools, CloudWatch + X-Ray; performance KPIs (p95) and Core Web Vitals (LCP/INP/CLS).

```bash
node -v
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

## License

GuidoGerb Publishing, LLC distributes this repository under the [Apache License 2.0](./LICENSE).

- Author: Gary Gerber
- Copyright © 2025 GuidoGerb Publishing, LLC
