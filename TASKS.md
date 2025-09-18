# TASKS — Kickoff Plan from SPEC-1

This document captures a prioritized, actionable task list derived from SPEC.md and the current repository state. Aim for small, verifiable increments. Items are grouped by area with suggested owners and acceptance criteria.

## Prioritized Next Tasks

1. **Ship the PWA foundation** — Integrate `vite-plugin-pwa`, wire up the shared `@guidogerb/sw` package, and add offline/sitemap generators under `infra/scripts/writeHtml` to satisfy SPEC offline requirements (see §5).
2. **Add tenant error handling routes** — Ensure every website defines explicit 404/error boundaries so broken links resolve gracefully instead of falling through to the SPA (see §3).
3. **Deploy a reference site** — Use the existing CI/CD pipeline to publish at least one tenant (e.g., garygerber.com) to S3/CloudFront as a validation step for milestone M0 (see §9).
4. **Tighten documentation scaffolding** — Cross-link SPEC, PUBLISHING, README, and TASKS and stand up an ADR log to capture architectural decisions (see §8).

## 0) Repo Hygiene & Tooling

- [x] Switch root scripts to pnpm (SPEC + README recommend pnpm; current scripts use npm workspaces)
  - Update root package.json scripts to: build/dev/lint/test using `pnpm -r`
  - Acceptance: `pnpm -r build` builds all workspaces; `pnpm -r dev` runs watchers where present.
- [x] Align workspace naming and versions
  - Current workspaces include `@guidogerb/components/*` but packages are not present. Either add stubs (see 2) or remove until ready.
  - Acceptance: `pnpm install` succeeds with no missing workspace warnings.
- [x] Add baseline lint/format config (ESLint + Prettier, TS config once TS is introduced)
  - Acceptance: `pnpm -r lint` runs and passes (or reports real linting issues).

## 1) CSS Tokens & Reset (Low Effort, Immediate Value)

- [x] Populate `@guidogerb/css/reset.css` with a modern reset (e.g., Andy Bell / Josh Comeau / normalize.css-inspired)
- [x] Populate `@guidogerb/css/tokens.css` with CSS variables for colors, spacing, radii, typography, etc.
  - Acceptance: Importing these files applies baseline styles; sample page renders with tokens available under `:root`.

## 2) Workspace Stubs (Unblock Builds)

Create minimal package stubs for listed shared packages so that builds resolve dependencies. Each package: package.json, src/index.(ts|js), and README.

- [x] `@guidogerb/components-api`
- [x] `@guidogerb/components-auth`
- [x] `@guidogerb/components-menu`
- [x] `@guidogerb/components-pages-public`
- [x] `@guidogerb/components-pages-protected`
- [x] `@guidogerb/components-router-public`
- [x] `@guidogerb/components-router-protected`
- [x] `@guidogerb/footer`
- [x] `@guidogerb/header`
  - Acceptance: `pnpm -r build` succeeds (packages can export placeholders).

## 3) Websites — Vite App Baseline

- [ ] Verify that error handling routes exist for each tenent website i.e. If any site should throw a 404 error, the app should have a route for that page.;
- [x] Confirm websites/garygerber.com runs locally (vite dev) with placeholder routes using shared packages.
- [x] Create similar scaffolds for other sites listed in workspaces (copy garygerber.com as baseline) or remove from workspaces until ready.
  - Acceptance: Each included website can `pnpm --filter <site> dev` and `build` successfully.

## 4) Environment & Secrets

- [x] Document and template `.env` requirements per site (see SPEC §11 and PUBLISHING.md §11)
- [x] Add `.env.example` for each website with VITE\_\* keys.
  - Acceptance: New dev can copy `.env.example` → `.env` and run dev server.

## 5) PWA & Offline Shell

- [x] Add vite-plugin-pwa and a minimal Workbox service worker package `@guidogerb/sw` (stub now; real logic later)
- [x] Provide `infra/scripts/writeHtml` utilities for offline.html and sitemap
  - Acceptance: Dev build includes manifest and registers SW behind a feature flag (can be disabled in dev).

## 6) CI/CD Scaffolding (GitHub Actions + AWS OIDC)

- [x] Add basic GitHub Actions workflow that builds workspaces and artifacts for one website (stream4cloud.com or garygerber.com)
- [x] Add placeholder for AWS OIDC role assumption (no secrets in repo)
  - Acceptance: Workflow passes on pull requests; produces build artifacts.

## 7) Infra Notes & Placeholders

- [x] Validate `infra/cfn/` presence vs PUBLISHING.md steps; if missing, create directory structure and README placeholders
  - Acceptance: Clear path for infra deployment; no build coupling.

## 8) Documentation Upkeep

- [ ] Cross-link SPEC.md, PUBLISHING.md, README.md, and TASKS.md
- [ ] Add ADRs directory for future architectural decisions
  - Acceptance: Onboarding flow: read SPEC → follow PUBLISHING → run websites locally.

## 9) Milestone M0 Deliverables (per SPEC §12)

- [x] Monorepo structure finalized; pnpm workspaces stable
- [ ] One Vite app deployed to S3/CloudFront (manual steps OK)
- [x] Cognito Hosted UI integrated at least for local login flow (redirect handler stub)
- [x] DynamoDB table + API skeleton noted in infra (no BE code required yet)
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
