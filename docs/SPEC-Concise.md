Here’s a reduced version of your **SPEC-1 Creative Assets Marketplace** document, trimmed to **\~7,950 characters** while keeping all meaning and structure intact.

---

# SPEC-1 — Creative Assets Marketplace (Vite React + AWS)

> Consolidated spec reflecting confirmed recommendations (multi-tenant + custom domains at launch; global sales enablement).

## 1) Background & Objectives

Build a scalable, offline-capable marketplace for digital/physical creative products (music, albums, books/e-books, videos, podcasts) plus subscriptions/tokens.
Frontend: Vite + React (PWA, offline public routes) on S3/CloudFront.
Backend: Serverless (API Gateway + Python Lambdas), DynamoDB single-table. Stripe powers payments/subscriptions; crypto is Phase 2.

## 2) Scope (MoSCoW)

### Must

- Multi-tenant storefronts on shared + BYO domains at launch; auto-TLS; per-tenant/region price lists.
- Global sales: multi-currency, region-aware tax (US, EU, CA), inclusive/exclusive display, compliant invoices.
- Regional POS behavior: local methods, address/ID rules, rounding, localized checkout.
- Vite + React (TS strict), monorepo packages, ESLint/Prettier.
- Offline PWA: app shell precache, cached assets, fallback offline pages, versioning.
- Hosting: S3 + CloudFront (SPA routing, security headers, WAF).
- AuthN/AuthZ: Cognito Hosted UI + JWT (Google/Apple/Facebook/MS); role/claim-based.
- APIs: API GW → Python Lambdas; validation, throttling, error model.
- Secure downloads: presigned S3 URLs (short TTL), rate limits, logging.
- Catalog: artists/authors, works, products; search + autocomplete; SEO.
- Commerce: cart (digital/physical), discounts, tax/shipping, Stripe checkout, refunds/disputes.
- Post-purchase: My Products, EULA, invoices.
- Admin: users/roles, stores, catalog, pricing, orders/refunds, payouts, reporting.
- Tokens/subscriptions: packs + subs with usage metering, alerts.
- Data: DynamoDB Global Tables, streams for audit/events.
- Observability: logs/metrics/traces, dashboards/alerts.
- Security: PCI SAQ-A, GDPR/CCPA, encryption, IAM least privilege, secrets in SSM.
- Quality: WCAG 2.1 AA, i18n/l10n, perf budgets.
- Reliability: SLOs, RPO/RTO, DR runbooks.
- Abuse prevention: rate limits, link-abuse detection, captchas.

### Should

- PWA installability, Background Sync, optional push.
- Edge logic (geo prices, redirects, A/B).
- Managed search (OpenSearch/Algolia).
- Bulk import/export APIs.
- Physical fulfilment (3PL).
- Analytics/BI (S3 + Athena + QuickSight).
- Media processing (renditions, transcode).
- DRM/watermarking for videos/e-books.
- Stripe Connect payouts.
- Custom domain automation, webhooks.

### Could

- Headless CMS for marketing.
- Community features (reviews, comments).
- Gift cards/referrals.
- Native wrappers.
- WYSIWYG editor for profiles.

### Won’t (MVP)

- On-prem/self-hosted.
- Custom DRM beyond watermarking unless required.

## 3) Architecture Overview

### Frontend

React (function components, contexts), React Router, Suspense/code-splitting.
Contexts: Auth, Cart, Catalog, Pricing, Offline.
PWA via `vite-plugin-pwa` (Workbox SW): precache shell/assets; runtime cache strategies; offline fallback; UX-gated updates.
Installability: manifest, A2HS prompts, iOS banners, optional push.

### Backend

CloudFront + S3 (SPA + static assets), WAF, security headers.
API GW → Python 3.12 Lambdas (per bounded context, shared layer for auth/logging/DDB/Stripe).
Cognito Auth Code + PKCE, roles via User Pool Groups.
DynamoDB single-table + Global Tables; streams → Lambdas (indexing/audit).
OpenSearch Serverless: catalog search + vector RAG embeddings.
Media in S3 (KMS, versioned).
Optional Ollama on ECS Fargate (via API GW VPC Link) for RAG chat.

### Multi-Tenant & Domains

Shared CloudFront; Alternate Domain Names per tenant.
Lambda\@Edge maps Host → tenant; inject `X-Tenant`.
ACM cert automation; Route 53 or external DNS flow.
Geo headers set defaults; user override persists.

## 4) APIs (sample)

```
GET  /public/catalog/search?q=
GET  /public/catalog/items/{id}
GET  /public/artist/{slug}

POST /downloads/link
GET  /me/entitlements
GET  /me/invoices

POST /cart
POST /checkout/create-session
POST /webhooks/stripe

# Admin
POST /admin/catalog/import
POST /admin/domains
POST /admin/users/{id}/roles
POST /store/create
POST /store/{id}/products
```

**Download flow:** verify entitlement → presign S3 URL → permissionHash (HMAC) + token → return URL + token → audit + rate limits.

## 5) Data Model (examples)

`TENANT#id`, `DOMAIN#host`, `USER#id` + GSI email, `ARTIST#id`, `AUTHOR#id`, `WORK#id`, `PRODUCT#id`, `PRICE#id`, `ORDER#id`, `ENTITLEMENT#userId#productId`, `DOWNLOAD#token`, `USAGE#subId#yyyymm`, `STORE#id`, `CRYPTOCHARGE#id` (Phase 2), `AUDIT#entity#ts`.

## 6) Payments & Subscriptions

Stripe: multi-currency, Payment Element (cards/local), Apple/Google Pay, SCA.
Subscriptions via Stripe Billing; licensed quantities, usage meters, alerts.
Webhooks update orders/entitlements; invoice PDFs cached to S3.
**Phase 2:** Coinbase/BitPay checkout, fiat lock, entitlements post-confirm.

## 7) PWA Offline Data

Ship small catalog JSON snapshot to IndexedDB.
Background Sync refreshes snapshots.
Writes queued via Workbox with backoff.

## 8) Admin Console

CRUD for users/roles, tenants/domains, catalog, pricing, orders, payouts, tax exports, infra costs, RAG content.
Admin/staff only; per-tenant feature flags.

## 9) Observability & Security

Lambda Powertools (tracing/metrics/logger), CloudWatch dashboards, X-Ray.
WAF bot control, upload malware scanning, KMS S3, Secrets Manager.
PCI SAQ-A boundary (Stripe-hosted UI).
GDPR/CCPA compliance.
CloudFront headers: CSP (nonce), HSTS, X-Frame-Options.

## 10) i18n, Tax, FX

Locale detection via CF headers + user setting.
Intl number/date/currency formatting.
Stripe Tax handles VAT ID, inclusive/exclusive rules.
Price lists per region; fallback conversion for display.

## 11) CI/CD & Environments

GitHub Actions OIDC → AWS.
Frontend: build → S3 → CF invalidate.
Packages: typecheck/test/build; Changesets publish.
Infra: CDK deploy (dev/stage/prod).
Tests: Vitest, PyTest, Playwright, k6.

**`VITE_ENV` secrets:** Cognito IDs/redirects, scopes, paths.
Localhost: match port, add callback URLs in Cognito.

## 12) Milestones

- M0: Foundations & CI/CD (2w).
- M1: Catalog + Offline (3w).
- M2: Commerce core (3w).
- M3: Multi-Tenant + Domains (3w).
- M4: Creator stores/media (3w).
- M5: AI (RAG) (2w).
- M6: Admin/reporting v1 (2w).
- M7: i18n + Shipping (2w).
- M8: Phase 2: Crypto + WYSIWYG (3w).
- M9: Hardening & Launch (2w).

Cross-milestone gates: observability, docs/ADRs, threat model, CWV budgets.

## 13) KPIs

**Business:** GMV, ≥2% conversion, AOV, ≤2% refund, MRR/ARR, churn, payouts ≥99% timely, ≤0.5% disputes.
**Product:** ≤3% zero-result search, ≥35% CTR, p95 search ≤300ms, ≥80% profile completeness, ≥99.9% download success, ≥3% PWA installs, ≥95% offline success.
**Technical:** API 99.9%, static 99.95%, p95 read ≤300ms, checkout ≤800ms, LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, CDN cache-hit ≥90%, DDB throttling <0.1%, OpenSearch p95 ≤150ms (catalog), ≤400ms (RAG).
**AI Support:** ≥50% self-serve (→70% Phase 2), ≥70% accepted, ≥95% citations, ≤5% hallucination (→2%), TTFT avg ≤3s, p95 ≤6s.
**Security:** 0 P1s, WAF blocks tracked, download-abuse down.

## 14) Next Steps

1. Init pnpm monorepo (`apps/web`, `ui`, `auth`, `api-client`, `catalog`, `commerce`, `sw`, `storage`, `analytics`, `ai-support`).
2. GitHub Actions OIDC → AWS; add `VITE_ENV` secrets.
3. Baseline infra: dev S3/CF/WAF, Cognito, API GW, DDB table, OpenSearch.
4. Tenant bootstrap: seed `TENANT#`/`DOMAIN#`; alt domain; cert automation.
5. Stripe accounts + Tax, test webhooks.
6. Observability: dashboards/alarms/tracing; doc SLOs.
7. Security: CSP/HSTS headers, WAF, Secrets Manager, KMS.
8. Runbooks: webhooks DLQ, OpenSearch backfill, DDB hot partition, CF invalidation.
9. QA: Playwright canaries (login/search/cart/checkout/download/RAG); perf budgets in CI.

---

### Appendix A — SW registration

```ts
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true, onNeedRefresh() {}, onOfflineReady() {} })
```

### Appendix B — Lambda permission-hash

```py
h = hmac.new(SECRET_KEY, f"{user_id}|{asset_id}|{entitlement_id}|{exp}".encode(), hashlib.sha256).hexdigest()
```
