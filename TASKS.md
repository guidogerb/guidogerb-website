# TASKS — Kickoff Plan from SPEC-1

This document captures a prioritized, actionable task list derived from SPEC.md and the current repository state. Aim for small, verifiable increments. Items are grouped by area with suggested owners and acceptance criteria.

## 0) Repo Hygiene & Tooling

- [ ] Switch root scripts to pnpm (SPEC + README recommend pnpm; current scripts use npm workspaces)
  - Update root package.json scripts to: build/dev/lint/test using `pnpm -r`
  - Acceptance: `pnpm -r build` builds all workspaces; `pnpm -r dev` runs watchers where present.
- [ ] Align workspace naming and versions
  - Current workspaces include `@guidogerb/components/*` but packages are not present. Either add stubs (see 2) or remove until ready.
  - Acceptance: `pnpm install` succeeds with no missing workspace warnings.
- [ ] Add baseline lint/format config (ESLint + Prettier, TS config once TS is introduced)
  - Acceptance: `pnpm -r lint` runs and passes (or reports real linting issues).

## 1) CSS Tokens & Reset (Low Effort, Immediate Value)

- [ ] Populate `@guidogerb/css/reset.css` with a modern reset (e.g., Andy Bell / Josh Comeau / normalize.css-inspired)
- [ ] Populate `@guidogerb/css/tokens.css` with CSS variables for colors, spacing, radii, typography, etc.
  - Acceptance: Importing these files applies baseline styles; sample page renders with tokens available under `:root`.

## 2) Workspace Stubs (Unblock Builds)

Create minimal package stubs for listed shared packages so that builds resolve dependencies. Each package: package.json, src/index.(ts|js), and README.

- [ ] `@guidogerb/components-api`
- [ ] `@guidogerb/components-auth`
- [ ] `@guidogerb/components-menu`
- [ ] `@guidogerb/components-pages-public`
- [ ] `@guidogerb/components-pages-protected`
- [ ] `@guidogerb/components-router-public`
- [ ] `@guidogerb/components-router-protected`
- [ ] `@guidogerb/footer`
- [ ] `@guidogerb/header`
  - Acceptance: `pnpm -r build` succeeds (packages can export placeholders).

## 3) Websites — Vite App Baseline

- [ ] Verify that error handling routes exist for each tenent website i.e. If any site should throw a 404 error, the app should have a route for that page.;
- [ ] Confirm websites/garygerber.com runs locally (vite dev) with placeholder routes using shared packages.
- [ ] Create similar scaffolds for other sites listed in workspaces (copy garygerber.com as baseline) or remove from workspaces until ready.
  - Acceptance: Each included website can `pnpm --filter <site> dev` and `build` successfully.

## 4) Environment & Secrets

- [ ] Document and template `.env` requirements per site (see SPEC §11 and PUBLISHING.md §11)
- [ ] Add `.env.example` for each website with VITE\_\* keys.
  - Acceptance: New dev can copy `.env.example` → `.env` and run dev server.

## 5) PWA & Offline Shell

- [ ] Add vite-plugin-pwa and a minimal Workbox service worker package `@guidogerb/sw` (stub now; real logic later)
- [ ] Provide `infra/scripts/writeHtml` utilities for offline.html and sitemap
  - Acceptance: Dev build includes manifest and registers SW behind a feature flag (can be disabled in dev).

## 6) CI/CD Scaffolding (GitHub Actions + AWS OIDC)

- [ ] Add basic GitHub Actions workflow that builds workspaces and artifacts for one website (stream4cloud.com or garygerber.com)
- [ ] Add placeholder for AWS OIDC role assumption (no secrets in repo)
  - Acceptance: Workflow passes on pull requests; produces build artifacts.

## 7) Infra Notes & Placeholders

- [ ] Validate `infra/cfn/` presence vs PUBLISHING.md steps; if missing, create directory structure and README placeholders
  - Acceptance: Clear path for infra deployment; no build coupling.

## 8) Documentation Upkeep

- [ ] Cross-link SPEC.md, PUBLISHING.md, README.md, and TASKS.md
- [ ] Add ADRs directory for future architectural decisions
  - Acceptance: Onboarding flow: read SPEC → follow PUBLISHING → run websites locally.

## 9) Milestone M0 Deliverables (per SPEC §12)

- [ ] Monorepo structure finalized; pnpm workspaces stable
- [ ] One Vite app deployed to S3/CloudFront (manual steps OK)
- [ ] Cognito Hosted UI integrated at least for local login flow (redirect handler stub)
- [ ] DynamoDB table + API skeleton noted in infra (no BE code required yet)
  - Acceptance: Public routes render; auth redirect works; deployment documented and repeatable.

---

## 10) Spec-alignment checklist (must-haves)

To ensure tasks remain aligned with SPEC-1 and compliance rules, confirm these areas are covered during M0–M1:

- Core stack: Vite, React, TypeScript; AWS with API Gateway, Lambda, DynamoDB, CloudFront, S3, Cognito; Stripe for payments.
- Multi-tenant + custom domains via CloudFront; ACM certificates; Route 53 DNS.
- PWA with a service worker: offline precache, Background Sync, offline.html fallback.
- Security & compliance: PCI SAQ-A, GDPR, encryption with KMS, WAF, least privilege IAM.
- Secure downloads: pre-signed URL + permission-hash with TTL, limited uses, audit logging.
- Search/observability mentions: OpenSearch (BM25/Serverless) and Lambda Powertools/CloudWatch/X-Ray with p95 Core Web Vitals (LCP/INP/CLS).
