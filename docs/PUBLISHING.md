# PUBLISHING.md — Install & Deployment Guide (Phase-1)

This document consolidates all install and deployment instructions for **Stream4Cloud Phase-1**.

> Related references: the [SPEC](./SPEC.md) details platform architecture, the [ADR log](./adr/README.md) captures accepted decisions, and the [repository README](../README.md) maps workspaces and shared packages.

---

## Architecture summary (SPEC-1)

- Core stack: Vite, React, TypeScript; AWS with API Gateway, Lambda, DynamoDB, CloudFront, S3, Cognito; Stripe for payments.
- Multi-tenant + custom domains via CloudFront; TLS with ACM; DNS records with Route 53.
- PWA with a service worker: offline precache of shell, Background Sync for writes, offline.html fallback.
- Security & compliance: PCI SAQ-A, GDPR/CCPA, encryption with KMS, WAF, least privilege IAM.
- Secure downloads: pre-signed URL + permission-hash with TTL, limited uses, and audit logging.

## 1) Prerequisites

- Node.js ≥ 20 and pnpm
- AWS CLI v2 configured (admin/deployer role)
- ACM certificates (us-east-1) for each domain
- Optional: GNU Make (macOS/Linux) or PowerShell (Windows)

---

## 2) Monorepo Setup

1. Install deps

```bash
pnpm install
```

2. Recommended workspace scripts (root `package.json`)

```json
{
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test"
  }
}
```

3. Environment variables per site
   Create `websites/<site>/.env`:

```ini
VITE_COGNITO_CLIENT_ID=...
VITE_COGNITO_AUTHORITY=https://cognito-idp.<region>.amazonaws.com/<userPoolId>
VITE_REDIRECT_URI=https://<domain>/auth/callback
VITE_COGNITO_SCOPE=openid profile email
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com
```

> Never store secrets in the SPA. Use Cognito Hosted UI (Auth Code + PKCE).

---

## 3) Cloud Infrastructure (CloudFormation)

All templates are under `infra/cfn/stream4cloud/`. Parameters live in `infra/cfn/stream4cloud/params/`.

### 3.1 Fill parameter files

- `edge-<domain>.json` → set `CertificateArn` (ACM) and `HostedZoneId` for Route 53 (or skip DNS record creation).
- `auth.json` → choose unique `HostedUIDomainPrefix`; set Google IdP if desired.
- `api.json` → placeholders for now (auto-filled via script).
- `media.json` → S3 buckets for input/output.
- `opensearch.json` → Admin principal ARN.

### 3.2 Deploy sequence (PowerShell)

From `infra/cfn/stream4cloud/`:

```powershell
.\deploy.ps1 -Action DeployEdgeAll -Region us-east-1
.\deploy.ps1 -Action DeployAuth -Region us-east-1
.\deploy.ps1 -Action GenerateApiParams -Region us-east-1
.\deploy.ps1 -Action DeployApi -Region us-east-1
.\deploy.ps1 -Action DeployData -Region us-east-1
.\deploy.ps1 -Action DeployMedia -Region us-east-1
.\deploy.ps1 -Action DeploySearch -Region us-east-1
```

Or with Make:

```bash
make deploy-edge-all REGION=us-east-1
make deploy-auth REGION=us-east-1
make deploy-api REGION=us-east-1
make deploy-data REGION=us-east-1
make deploy-media REGION=us-east-1
make deploy-search REGION=us-east-1
```

### 3.3 Verify stacks

- CloudFront distributions = Enabled/Deployed; alternate domain names configured for multi-tenant custom domains.
- Route 53 DNS records created (if HostedZoneId provided) and ACM certs issued.
- Cognito Hosted UI domain reachable.
- API `GET /health` returns `{"ok": true}`.

### 3.4 Tear-down (reverse order)

```powershell
.\deploy.ps1 -Action DeleteSearch -Region us-east-1
.\deploy.ps1 -Action DeleteMedia -Region us-east-1
.\deploy.ps1 -Action DeleteApi -Region us-east-1
.\deploy.ps1 -Action DeleteAuth -Region us-east-1
.\deploy.ps1 -Action DeleteData -Region us-east-1
.\deploy.ps1 -Action DeleteEdgeAll -Region us-east-1
```

---

## 4) Web Build & Publish

### 4.1 Build a site

```bash
pnpm --filter websites/stream4cloud.com build
```

### 4.2 Upload to S3 (static hosting bucket from `edge-site.yaml`)

```bash
aws s3 sync websites/stream4cloud.com/dist s3://<SiteBucketName>/ --delete
```

### 4.3 Invalidate CloudFront

```bash
aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
```

### 4.4 Repeat for each site

- `garygerber.com`
- `guidogerbpublishing.com`
- `picklecheeze.com`
- `this-is-my-story.org`

> Consider GitHub Actions to automate: build → S3 upload → invalidation per site.

---

## 5) Auth Integration (Frontend)

Use the shared package `@guidogerb/components-auth` (Cognito Hosted UI + PKCE) to initiate login and retrieve access tokens.

Minimal flow:

```ts
import { loginWithHostedUI, handleRedirect, getAccessToken } from '@guidogerb/components-auth'
handleRedirect()
loginWithHostedUI()
const token = await getAccessToken()
```

---

## 6) PWA Offline & Static Pages

- Add `@guidogerb/sw` or `vite-plugin-pwa` with a service worker.
- Precache the app shell; use Background Sync for writes.
- Provide `/offline.html` fallback (see `infra/scripts/writeHtml`).

---

## 7) Media Ingest & Transcode (Audio + Video)

The `media-audio-video.yaml` stack provisions:

- MediaConvert JobTemplates (audio AAC/HLS, video H.264/HLS)
- Two minimal submitter Lambdas
- Step Functions State Machine (`s4c-media-pipeline`)

Invoke example

```json
{
  "mediaType": "audio",
  "inputBucket": "s4c-ingest-bucket",
  "inputKey": "uploads/myfile.wav"
}
```

Outputs land under the `OutputBucketName` with `audio/` or `video/` prefixes.

---

## 8) Secure Downloads (API)

Downloads must use pre-signed URLs from S3 and a permission-hash token with TTL and limited uses; all accesses are audit logged.

---

## 9) Security & Compliance

- PCI SAQ-A boundary (Stripe-hosted elements/links)
- GDPR/CCPA: consent + DSRs
- Encryption with KMS and least privilege IAM
- WAF managed rules and rate limits

---

## 10) Troubleshooting

- Cognito redirect mismatch → ensure callback/logout URIs exactly match Hosted UI settings.
- CloudFront 403 to S3 origin → verify OAC and S3 policy allow CloudFront service principal (via distribution ARN).
- MediaConvert access errors → service role must have S3 list/get/put for input/output buckets.
- CORS → set appropriate `Access-Control-Allow-*` on API responses if calling from the SPA.

---

## 11) Appendix: Required build-time env (VITE\_\*)

```
VITE_COGNITO_CLIENT_ID=...
VITE_COGNITO_AUTHORITY=...
VITE_REDIRECT_URI=...
VITE_COGNITO_SCOPE=openid profile email
VITE_API_BASE_URL=...
```
