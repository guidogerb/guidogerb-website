# SPEC-1 — Creative Assets Marketplace (Vite React + AWS)

> Consolidated specification reflecting all confirmed recommendations (multi‑tenant + custom domains at launch; global sales enablement), ready for implementation kickoff.

## 1) Background & Objectives

Build a scalable, offline‑capable marketplace for creative digital and physical products (music, albums, books/e‑books, videos, podcasts) plus subscriptions/tokens. Frontend is Vite + React deployed to AWS S3/CloudFront with a service worker for offline access to public routes. Backend is serverless on AWS (API Gateway + Python Lambdas) with DynamoDB as the primary datastore. Stripe powers payments, subscriptions, invoicing; crypto is feature‑flagged for Phase 2.

## 2) Scope (MoSCoW)

### Must
- Multi‑tenant storefronts on shared domain **and** BYO custom domains at launch; automated TLS; per‑tenant/region price lists.
- Global sales: multi‑currency presentment, region‑aware tax (US sales tax, EU VAT, CA GST/HST), tax‑inclusive/exclusive display, compliant invoicing.
- Regional POS behavior: local payment methods, address/ID requirements, currency rounding rules, localized checkout copy.
- Vite + React (TypeScript strict); monorepo with reusable packages; ESLint/Prettier.
- Offline capability: PWA service worker that precaches the app shell and caches assets; public routes work read‑only offline with fallbacks; versioning & invalidation.
- Hosting: S3 + CloudFront (SPA routing, security headers, gzip/brotli, WAF).
- AuthN/AuthZ: Amazon Cognito (Hosted UI + JWT) with Google/Apple/Facebook/Microsoft; role/claim‑based authorization.
- APIs: API Gateway (HTTPS/REST) → Python Lambda micro‑functions; request validation; throttling; structured error model.
- Secure downloads: S3 with permission‑hashed, short‑lived pre‑signed URLs; device/IP rate limits; audit logging.
- Catalog: artists/authors, works, products; full‑text search + autocomplete; SEO metadata & sitemaps.
- Commerce: cart (digital + physical), discounts, tax/shipping estimates, Stripe checkout, refunds, disputes.
- Post‑purchase: My Products (entitlements/downloads), EULA acceptance, Invoices.
- Admin console: users/roles, artists/authors, stores, catalog, pricing/inventory, orders/refunds, payouts/royalties, reporting & audit.
- Tokens & subscriptions: token packs (metered) and subscriptions with capacity + top‑ups; usage metering and alerts.
- Data layer: DynamoDB single‑table (Global Tables); streams for audit/events.
- Observability: logs/metrics/traces; dashboards & alerts.
- Security & compliance: PCI SAQ‑A, GDPR/CCPA controls, encryption at rest/in transit, IAM least privilege, secrets in Secrets Manager/SSM.
- Quality: WCAG 2.1 AA, i18n/l10n, performance budgets & Core Web Vitals.
- Reliability: explicit SLOs, RPO/RTO, backup/restore & DR runbooks.
- Abuse prevention: rate limits, link‑abuse detection, captchas as needed.

### Should
- PWA installability & Background Sync; optional push notifications.
- Edge logic (CloudFront Functions/Lambda@Edge) for geo‑based prices, redirects, A/B testing.
- Managed search (OpenSearch/Algolia) with synonyms/typo tolerance.
- Bulk import/export; product & catalog APIs.
- Physical fulfilment via 3PL (Shippo/ShipStation) and live shipping rates.
- Analytics/BI (S3 + Glue + Athena; QuickSight) with per‑tenant cost allocation.
- Media processing (image renditions, audio normalization, video transcode, captions).
- DRM/watermarking for videos/e‑books where required.
- Marketplace payouts using Stripe Connect (Express/Standard).
- Custom‑domain automation across Route 53 and external DNS.
- Webhooks for tenant integrations; feature flags.

### Could
- Headless CMS for marketing (MDX/Contentful/Sanity).
- Community features (ratings/reviews, comments, follows).
- Gift cards & referrals/affiliates.
- Native wrappers (Capacitor).
- WYSIWYG editor for artist/author profiles (server‑side sanitized).

### Won’t (MVP)
- On‑prem/self‑hosted deployment.
- Custom DRM beyond watermarking unless contractually required.

## 3) Architecture Overview

### Frontend
- React (function components + Contexts), React Router, Suspense/code‑splitting.
- Key contexts: Auth, Cart, Catalog, Pricing (FX/tax‑display), Offline.
- PWA via `vite-plugin-pwa` (injectManifest) with a hand‑written Workbox service worker:
  - Precache app shell (index.html), route bundles, fonts, icons, immutable JS/CSS (revisioned).
  - Runtime: `CacheFirst` for images/fonts, `StaleWhileRevalidate` for JSON & chunks, `NetworkOnly` + Background Sync for writes.
  - `navigationFallback` → `/offline.html` shell.
  - SW `skipWaiting`/`clientsClaim` gated by UX prompt.
- Installability & UX: web manifest, iOS banners, A2HS prompts; optional push scaffold for “back in stock”.

### Backend (Serverless on AWS)
- CloudFront + S3 (SPA + static assets); WAF attached; gzip/brotli; security headers.
- API Gateway (HTTPS/REST) → Python 3.12 Lambdas (per bounded context) with shared layer (auth/logging/DynamoDB/Stripe/OpenSearch).
- Cognito Hosted UI (Auth Code + PKCE); User Pool Groups for roles.
- DynamoDB single‑table design + Global Tables; Streams → Lambdas (indexing, audit).
- OpenSearch Serverless: `catalog-search` (BM25 + facets) and `cs-kb-vector` (RAG embeddings).
- Media assets in S3 (versioned, KMS).
- Optional local inference (Ollama on ECS Fargate via internal ALB + API GW VPC Link) for RAG chat.

### Multi‑Tenant & Custom Domains
- Shared CloudFront distribution; Alternate Domain Names per tenant.
- Lambda@Edge/Function resolves `Host` → tenant via `DOMAIN#<host>` item; injects `X‑Tenant` header.
- ACM cert automation (DNS validation); Route 53 auto‑records; external DNS flow with polling & status.
- Geo headers select defaults (currency/locale/payment methods); user can override & persist.

## 4) APIs (sample)

```
GET  /public/catalog/search?q=&type=artist|album|book|video|podcast
GET  /public/catalog/items/{id}
GET  /public/artist/{slug}

POST /downloads/link                      # permission-hashed, presigned download
GET  /me/entitlements
GET  /me/invoices

POST /cart
POST /checkout/create-session             # Stripe Payment Element/Checkout
POST /webhooks/stripe

# Admin & creator
POST /admin/catalog/import
POST /admin/domains
POST /admin/users/{id}/roles
POST /store/create
POST /store/{id}/products
```

**Permission‑hashed downloads (flow)**  
1) Client requests `assetId(s)` → Lambda verifies entitlement.  
2) On success, create zip (if many) and pre‑sign S3 URL (short TTL).  
3) Generate `permissionHash = HMAC_SHA256(secretRotationKey, userId|assetId|entitlementId|ttl)`; put `DOWNLOAD#<token>` with TTL/limited uses.  
4) Return `{ url, dlToken }`; access is audit‑logged; enforce rate limits.

## 5) Data Model (DynamoDB single‑table, examples)

- `TENANT#<id>` → tenant config (plan/settings/default currency)  
- `DOMAIN#<host>` → `tenantId`, `certArn`, `cfDistributionId`, `status`  
- `USER#<id>` + `USEREMAIL#<email>` (GSI1)  
- `ARTIST#<id>` / `AUTHOR#<id>`  
- `WORK#<id>` (album/book/video/podcast series)  
- `PRODUCT#<id>` (digital/physical/token/subscription) + variants/prices  
- `PRICE#<id>` (currency, list price, region, tax class)  
- `ORDER#<id>` (provider `stripe|crypto`, charge id, optional `txHash`)  
- `ENTITLEMENT#<userId>#<productId>`  
- `DOWNLOAD#<token>` (TTL, limited uses)  
- `USAGE#<subId>#<yyyymm>` (metering)  
- `STORE#<id>` (connect account id)  
- `CRYPTOCHARGE#<id>` (Phase 2)  
- `AUDIT#<entity>#<ts>` (streamed to S3)

## 6) Payments & Subscriptions

- Stripe first: multi‑currency presentment, Payment Element (cards + local methods), Apple/Google Pay; SCA support.  
- Subscriptions: Stripe Billing; licensed quantities for capacity; usage‑based meters; alerts (80/100%).  
- Webhooks: signature‑verified; update `ORDER#`/`ENTITLEMENT#`; cache invoice PDFs to S3.  
- **Phase 2 (feature‑flagged):** Coinbase Commerce/BitPay hosted checkout; quote/lock fiat price at checkout; order pending until confirmations; entitlements post‑confirm; refunds per provider policy.

## 7) PWA Offline Data Strategy

- Ship small catalog snapshot JSON (top charts, last viewed) to IndexedDB.  
- Background Sync updates snapshots on reconnect.  
- Queue writes via Workbox Background Sync w/ exponential backoff.

## 8) Admin Console

- Users/roles, tenants/domains, catalog CRUD/import, pricing, orders/refunds, payouts, tax exports, infra cost reports, RAG content mgmt.  
- Access: `admin/staff` only; feature flags per tenant.

## 9) Observability, Security & Compliance

- Lambda Powertools (tracing/metrics/logger), CloudWatch dashboards/alarms, X‑Ray tracing; correlation IDs.  
- WAF bot control & rate limits; malware scanning on uploads; KMS‑encrypted S3; Secrets Manager.  
- PCI SAQ‑A boundary (Stripe‑hosted elements/links); GDPR/CCPA (consent + DSRs).  
- Headers via CloudFront: CSP (nonce), HSTS, X‑Frame‑Options, Referrer‑Policy.

## 10) Internationalization, Tax, and FX

- i18n: detect locale (CF viewer headers + user setting); Intl formats for number/date/currency.  
- Taxes: Stripe Tax; VAT ID collection where required; inclusive/exclusive display per region.  
- FX: price lists per region; fallback to conversion tables for display only; billing in checkout currency.

## 11) CI/CD & Environments

- GitHub Actions with OIDC to AWS.  
- Frontend: build & upload to S3 → CloudFront invalidation.  
- Packages: typecheck/test/build; Changesets for versioning & publish to GitHub Packages.  
- Infra: CDK synth/deploy per env (dev/stage/prod) behind approval.  
- Tests: Vitest (web), PyTest (Lambdas), Playwright (E2E auth/cart/checkout/download), k6 (API hot paths).

**Required `VITE_ENV` secrets (build):**
```
VITE_COGNITO_CLIENT_ID=...
VITE_COGNITO_AUTHORITY=...  # OR VITE_COGNITO_DOMAIN=... OR VITE_COGNITO_METADATA_URL=...
VITE_REDIRECT_URI=https://your.domain/auth/callback
# Recommended:
VITE_COGNITO_SCOPE="openid profile email"
VITE_RESPONSE_TYPE=code
VITE_COGNITO_POST_LOGOUT_REDIRECT_URI=https://your.domain/auth/logout
VITE_BASE_PATH=/
```
*(Prod redirect must exactly match a Cognito Hosted UI Callback URL; never include client secrets in the SPA.)*

**Localhost Cognito fix (redirect_mismatch)**
- Ensure dev server port matches `.env.development` (e.g., `VITE_SITE_PORT=4173`).  
- Set `VITE_LOGIN_CALLBACK_PATH=/auth/callback` and `VITE_REDIRECT_URI=http://localhost:4173/auth/callback`.  
- Add the exact callback/sign‑out URLs in Cognito App Client.

## 12) Milestones (timeboxes assume 2–3 FE, 2 BE, 1 DevOps)

- **M0 — Foundations & CI/CD (2w):** Monorepo, TS configs, S3/CloudFront baseline, Cognito + JWT authorizer, DDB + GSIs, OpenSearch collections, ECS scaffold for Ollama, PWA shell.  
- **M1 — Catalog & Offline Public Routes (3w):** Entities + import; search indexer; public pages; offline caching of snapshots.  
- **M2 — Commerce Core & Entitlements (3w):** Cart/checkout (multi‑currency + tax), orders/entitlements, presigned downloads, My Products & Invoices.  
- **M3 — Multi‑Tenant + Domains + Geo/Currency (3w):** Tenant onboarding, price lists, BYO domains (ACM DNS), geo defaults, admin basics.  
- **M4 — Creator Stores & Media Pipeline (3w):** Stripe Connect onboarding/KYC, uploader, media renditions, draft→publish.  
- **M5 — AI Support (RAG) (2w):** S3→embed→vector; Retriever Lambda; Ollama on ECS; chat widget w/ citations & handoff.  
- **M6 — Admin & Reporting v1 (2w):** Sales/usage dashboards; refunds/disputes; tax exports; infra cost snapshot.  
- **M7 — i18n + Physical Fulfillment (2w):** Locales (en‑US/en‑GB/fr‑FR/de‑DE); shipping estimator + one carrier; returns.  
- **M8 — Phase 2: Crypto/DeFi + WYSIWYG Profiles (3w).**  
- **M9 — Hardening & Launch (2w):** A11y audit, security fixes, load/chaos drills, DR validation, runbooks.

**Cross‑Milestone Gates:** observability in place; docs/ADRs updated; threat model & least‑privilege reviewed; CWV budgets honored.

## 13) KPIs & Success Criteria

**Business:** GMV/take rate; conversion ≥ 2.0% MVP; AOV; refund ≤ 2%; MRR/ARR; churn; token consumption; creator payout timeliness ≥ 99%; disputes ≤ 0.5%; regional revenue mix.  
**Product:** search zero‑result ≤ 3%; search CTR ≥ 35%; p95 search ≤ 300ms; profile completeness ≥ 80%; download success ≥ 99.9%; PWA install ≥ 3%; offline session success ≥ 95%.  
**Technical:** API availability 99.9% / static 99.95%; p95 read ≤ 300ms; p95 checkout APIs ≤ 800ms; LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1; CDN cache‑hit ≥ 90%; DDB throttling < 0.1%; OpenSearch p95 ≤ 150ms (catalog), ≤ 400ms (RAG top‑k).  
**AI Support (RAG):** self‑serve ≥ 50% (→70% Phase 2); answer acceptance ≥ 70%; citations ≥ 95%; hallucination ≤ 5% (→2% Phase 2); TTFT avg ≤ 3s, p95 ≤ 6s.  
**Security/Compliance:** P1 incidents = 0; WAF block ratio monitored; download‑abuse trend downward.

## 14) Immediate Next Steps (kickoff checklist)

1) **Repos & Workspaces** — Initialize pnpm monorepo; scaffold `apps/web` and packages (`ui`, `auth`, `api-client`, `catalog`, `commerce`, `sw`, `storage`, `analytics`, `ai-support`).  
2) **CI/CD & AWS OIDC** — Set up GitHub Actions w/ OIDC role; add `VITE_ENV` secret block; fail‑fast env validation.  
3) **Baseline Infra** — Create dev S3/CloudFront/WAF; Cognito (Hosted UI + social IdPs); API Gateway (JWT authorizer); DynamoDB table + GSIs; OpenSearch Serverless collections.  
4) **Tenant Bootstraps** — Seed `TENANT#` and `DOMAIN#` patterns; enable dev alternate domain; cert automation.  
5) **Stripe** — Configure accounts (standard + Connect test), Stripe Tax, webhooks (test mode).  
6) **Observability** — Lambda Powertools, dashboards/alarms, tracing; SLO definitions documented.  
7) **Security** — CSP/HSTS headers, WAF managed rules & rate limits, Secrets Manager, KMS policies.  
8) **Runbooks** — Webhooks DLQ drain, OpenSearch backfill, DDB hot partition mitigation, CloudFront invalidation.  
9) **QA** — Playwright canaries for login/search/cart/checkout/download/RAG; performance budgets in CI.

---

### Appendix A — Example SW registration
```ts
// apps/web/src/main.tsx
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true, onNeedRefresh(){}, onOfflineReady(){} })
```

### Appendix B — Lambda permission-hash (snippet)
```py
h = hmac.new(SECRET_KEY, f"{user_id}|{asset_id}|{entitlement_id}|{exp}".encode(), hashlib.sha256).hexdigest()
```
