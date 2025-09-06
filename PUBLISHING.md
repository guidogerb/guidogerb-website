# PUBLISHING.md — Install & Deployment Guide (Phase-1)

This document consolidates all install and deployment instructions for **Stream4Cloud Phase-1**.

---

## 1) Prerequisites

- **Node.js** ≥ 20 and **pnpm**
- **AWS CLI v2** configured (admin/deployer role)
- **ACM certificates (us-east-1)** for each domain
- Optional: **GNU Make** (macOS/Linux) or **PowerShell** (Windows)

---

## 2) Monorepo Setup

1) Install deps
```bash
pnpm install
```

2) Recommended workspace scripts (root `package.json`)
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

3) Environment variables per site
Create `websites/<site>/.env`:
```ini
VITE_COGNITO_CLIENT_ID=...
VITE_COGNITO_AUTHORITY=https://cognito-idp.<region>.amazonaws.com/<userPoolId>
VITE_REDIRECT_URI=https://<domain>/auth/loginCallback
VITE_COGNITO_SCOPE=openid profile email
VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com
```

> **Never** store secrets in the SPA. Use **Cognito Hosted UI** (Auth Code + PKCE).

---

## 3) Cloud Infrastructure (CloudFormation)

All templates are under `infra/cfn/stream4cloud/`. Parameters live in `infra/cfn/stream4cloud/params/`.

### 3.1 Fill parameter files
- `edge-<domain>.json` → set `CertificateArn` and `HostedZoneId` (or leave empty to skip DNS record).
- `auth.json` → choose unique `HostedUIDomainPrefix`; set Google IdP if desired.
- `api.json` → leave placeholders for now (auto-filled via script).
- `media.json` → set S3 buckets for input/output.
- `opensearch.json` → set Admin principal ARN.

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

Or with **Make**:
```bash
make deploy-edge-all REGION=us-east-1
make deploy-auth REGION=us-east-1
make deploy-api REGION=us-east-1
make deploy-data REGION=us-east-1
make deploy-media REGION=us-east-1
make deploy-search REGION=us-east-1
```

### 3.3 Verify stacks
- CloudFront distributions = **Enabled/Deployed**
- DNS record created (if HostedZoneId provided)
- Cognito Hosted UI domain reachable
- API `GET /health` returns `{"ok": true}`

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
pnpm --filter websites/ggp-store.com build
```

### 4.2 Upload to S3 (static hosting bucket from `edge-site.yaml`)
```bash
aws s3 sync websites/ggp-store.com/dist s3://<SiteBucketName>/ --delete
```

### 4.3 Invalidate CloudFront
```bash
aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
```

### 4.4 Repeat for each site
- `garygerber.com`
- `ggp-store.com`
- `picklecheeze.com`
- `this-is-my-story.org`

> Consider adding GitHub Actions to automate build → S3 upload → invalidation per-site.

---

## 5) Auth Integration (Frontend)

Use the shared package **`@guidogerb/auth`** to initiate Hosted UI login and retrieve access tokens.

**Minimal flow**
```ts
import { loginWithHostedUI, handleRedirect, getAccessToken } from '@guidogerb/auth'
// On app start:
handleRedirect()
// On sign-in click:
loginWithHostedUI()
// For API calls:
const token = await getAccessToken()
```

---

## 6) Media Ingest & Transcode (Audio + Video)

The `media-audio-video.yaml` stack provisions:
- MediaConvert **JobTemplates** (audio AAC/HLS, video H.264/HLS)
- Two minimal submitter Lambdas
- Step Functions **State Machine** (`s4c-media-pipeline`)

**Invoke example**
```json
{
  "mediaType": "audio",
  "inputBucket": "s4c-ingest-bucket",
  "inputKey": "uploads/myfile.wav"
}
```

Outputs land under the `OutputBucketName` with `audio/` or `video/` prefixes.

---

## 7) Search (OpenSearch Serverless)

Provisioned collection (placeholder in Phase-1). Use for simple title/creator search first; expand later for discovery.

---

## 8) Troubleshooting

- **Cognito redirect mismatch** → ensure your callback/logout URIs exactly match Hosted UI settings.
- **CloudFront 403 to S3 origin** → verify OAC is attached and S3 bucket policy allows CloudFront service principal (via distribution ARN).
- **MediaConvert access errors** → the service role must have S3 list/get/put for input/output buckets.
- **CORS** → set appropriate `Access-Control-Allow-*` on API responses if calling from the SPA.

---

## 9) Appendix

### Required build-time env (`VITE_*`)
```
VITE_COGNITO_CLIENT_ID=...
VITE_COGNITO_AUTHORITY=...
VITE_REDIRECT_URI=...
VITE_COGNITO_SCOPE=openid profile email
VITE_API_BASE_URL=...
```
