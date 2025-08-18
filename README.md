## AWS Amplify React+Vite Starter Template

This repository provides a starter template for creating applications using React+Vite and AWS Amplify, emphasizing easy setup for authentication, API, and database capabilities.

## Overview

This template equips you with a foundational React application integrated with AWS Amplify, streamlined for scalability and performance. It is ideal for developers looking to jumpstart their project with pre-configured AWS services like Cognito, AppSync, and DynamoDB.

## Features

- **Authentication**: Setup with Amazon Cognito for secure user authentication.
- **API**: Ready-to-use GraphQL endpoint with AWS AppSync.
- **Database**: Real-time database powered by Amazon DynamoDB.

## Deploying to AWS

This project is configured for AWS Amplify Hosting (Gen 2). You can deploy the backend and frontend in one command using the Amplify Gen 2 CLI.

Quick path (us-east-1, existing app):
- Prereqs: AWS CLI configured with a profile that has access to your Amplify app, Node 18+.
- Identify your Amplify appId and region. This repo shows existing apps:
  - us-east-1 → guidogerb-website: d295eioxqacudl

Local deployment (run on your machine):
  1. npm ci
  2. npm run build
  3. npm run sandbox
  4. npm run outputs

- This provisions/updates your backend in a local sandbox environment and generates amplify_outputs.json used by the client.
- If you try to run pipeline-deploy locally you will get: [RunningPipelineDeployNotInCiError]. Use sandbox for local.

CI/CD deployment (Amplify Hosting build runner):
- The included amplify.yml uses pipeline-deploy automatically during Amplify Hosting builds.
- If you need the raw command in CI, it is:
  npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID

Notes:
- If your default branch is not "main", set AWS_BRANCH accordingly in your CI environment.
- If you’re deploying to a different region/app, use your appId in the CI environment or adjust scripts.
- On first-time setup, connect your repository to Amplify Hosting in the AWS Console or provision an app via CLI, then trigger a build.

Reference: Amplify React quickstart deploy docs: https://docs.amplify.aws/react/start/quickstart/#deploy-a-fullstack-app-to-aws

## Custom domain setup (Amplify Hosting)

If your site loads on the default Amplify domain but https://yourdomain.com fails with DNS_PROBE_FINISHED_NXDOMAIN, it means the custom domain isn’t associated or DNS isn’t configured yet.

There are two parts:
1) Associate the domain to your Amplify app (so Amplify knows which branch serves it).
2) Create DNS records at your registrar (or Route 53) so the domain resolves to Amplify.

Quick automation (Route 53 or external DNS):
- Prereqs: AWS CLI v2 with permissions for Amplify, and your Amplify appId.
- Run the helper script (Windows PowerShell example):

  powershell -ExecutionPolicy Bypass -File .\amplify\setupCustomDomain.ps1 -AppId d295eioxqacudl -DomainName guidogerbpublishing.com -Branch main -Region us-east-1

What this does:
- Associates www.guidogerbpublishing.com to the main branch.
- Associates the apex/root guidogerbpublishing.com (you can configure redirect to www in the Amplify console).
- If your DNS is hosted in Route 53 in this account, Amplify can auto-create DNS records.
- If your DNS is external, the script will output CNAME/ALIAS targets that you must add at your registrar.

Manual steps (Amplify Console):
- Open AWS Amplify Console → Hosting → Domain management → Connect domain.
- Enter guidogerbpublishing.com and add subdomains:
  - www → main branch
  - root/apex (no prefix) → redirect to www (recommended)
- If DNS is in Route 53 in the same account, accept record creation. Otherwise copy the DNS instructions and create records at your registrar.

DNS record examples (external registrar):
- CNAME www → <Amplify provided target> (e.g., xxxxx.cloudfront.net)
- ALIAS/ANAME A apex → <Amplify/CloudFront target> (or use registrar’s ALIAS/ANAME feature). If ALIAS/ANAME isn’t supported, use the Amplify-provided apex guidance.

Verification:
- Propagation usually takes 15–30 minutes (can take up to 24–48 hours globally).
- Test:
  - https://www.guidogerbpublishing.com
  - https://guidogerbpublishing.com
- In Amplify Console → Domain management, status should become AVAILABLE.

## Troubleshooting: Local vs CI Deploy
- Error: [RunningPipelineDeployNotInCiError] when running npx ampx pipeline-deploy locally.
  - Cause: pipeline-deploy is meant for CI/CD runners (like Amplify Hosting build) and will fail locally.
  - Fix: Use npx ampx sandbox (or npm run sandbox) on your local machine. After that, run npx ampx generate outputs (or npm run outputs) to refresh amplify_outputs.json.
- Error: AmplifyError [NoPackageManagerError]: npm_config_user_agent environment variable is undefined when running amplify directly.
  - Cause: Running amplify outside of a package manager (npm/yarn/pnpm) means npm_config_user_agent isn’t set, and Amplify CLI expects it.
  - Fix: Run through your package manager. Examples:
    - npm run amplify:pull -- --appId <APP_ID> --envName <ENV>
    - or: npx ampx pull --appId <APP_ID> --envName <ENV>
- Important: --app-id must be the alphanumeric Amplify appId, not the app name. Examples for CI:
  - guidogerb-website: appId d295eioxqacudl (us-east-1)
  - garygerber-website: appId d31al9t04be7ye (us-east-1)
  Example CI command: npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id d31al9t04be7ye

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

## Getting Started
npx ampx sandbox
npm run dev
npx ampx generate outputs


for r in us-east-1 us-west-2 eu-west-1 ap-southeast-2; do
echo "🔎 $r"
aws amplify list-apps --region $r --query 'apps[*].[appId,name]' --output text
done
🔎 us-east-1
d295eioxqacudl  guidogerb-website
d31al9t04be7ye  garygerber-website
🔎 us-west-2
🔎 eu-west-1
🔎 ap-southeast-2

## Project Evaluation and Feature Summary

This repository is a working AWS Amplify + React (Vite + TypeScript) starter that already includes:

- Frontend
  - React 18 + Vite + TypeScript baseline (index.html → src/main.tsx → src/App.tsx).
  - Amplify UI Authenticator wrapper providing out‑of‑the‑box sign in/sign up flows.
- Authentication and Security
  - Amazon Cognito user pools integrated via aws-amplify and @aws-amplify/ui-react.
  - Custom authentication challenge flow with Google reCAPTCHA verification:
    - Lambda triggers: CreateAuthChallenge, DefineAuthChallenge, VerifyAuthChallengeResponse.
    - Verify step uses Google reCAPTCHA server‑side validation.
- API and Data
  - Amplify Gen 2 Data (AppSync GraphQL) configured in amplify/data/resource.ts.
  - One example model: Todo with owner‑based auth (only the owner can CRUD).
  - Default authorization mode set to userPool (no public apiKey), enforcing authenticated access.
- Database
  - Backed by DynamoDB via Amplify/AppSync resolvers for defined models.
- Dev Experience
  - Scripts: npm run dev (Vite dev server), npm run build (TS + Vite), npm run preview.
  - Type-safe client generated by aws-amplify/data (generateClient<Schema> usage in App.tsx).
- Deployment
  - Amplify hosting readiness (amplify.yml present). README includes link to Amplify deploy docs.
- Utilities
  - s3/Command.txt example for recursive S3 copy.

Overall, this is a secure, production‑leaning starter with Cognito + AppSync + DynamoDB and a minimal Todo UI, suitable as a foundation for domain features.


## Roadmap: Music and Book Publishing Website

Below is a phased, practical plan to turn this starter into a music and book publishing platform.

### Product Goals
- Allow creators (musicians, authors, publishers) to upload and manage works (tracks, albums, books).
- Provide a public catalog for discovery, preview (audio samples, book excerpts), and purchase/download.
- Support licensing options (free, paid, subscription, limited time), with order history and receipts.
- Ensure content protection (signed URLs/DRM options) and compliance (copyright, TOS, GDPR/CCPA readiness).

### Phase 0 — Foundations (MVP-Ready Enhancements)
1. Authentication and Roles
   - Keep Cognito and Authenticator. Add user groups/roles: visitor, customer, creator, admin.
   - Add profile completion flow on first login (display name, avatar, bio, links).
2. Core Data Models (Amplify Data schema)
   - UserProfile: id (userId), displayName, role, avatarUrl, bio, socialLinks.
   - CreatorProfile: owner (userId), penName/artistName, payout info (tokenized), verified flag.
   - Asset: S3 object metadata (bucket, key, contentType, size, duration/pages), kind: AUDIO|EBOOK|COVER.
   - Work (base): id, title, description, tags, genre, coverAssetId, owner, visibility: PUBLIC|UNLISTED|PRIVATE.
   - MusicTrack: extends Work { audioAssetId, previewAssetId, isrc?, contributors[] }.
   - Album: extends Work { trackIds[], releaseDate }.
   - Book: extends Work { bookAssetId (PDF/EPUB), sampleAssetId, isbn?, contributors[] }.
   - PricingPlan: workId, type: FREE|ONE_TIME|SUBSCRIPTION, currency, amount, trialDays?, licenseTerms.
   - Order: buyerId, items[], total, status, providerRef, receiptUrl.
   - Review: workId, authorId, rating, text, createdAt (moderation flags).
   - Playlist/Bookshelf (optional later): userId, workIds[], public flag.
3. Storage and Delivery
   - S3 buckets for originals and derived assets (separate prefixes). Use Amplify Storage.
   - CloudFront distributions with signed URLs for secure previews/downloads.
4. UI Skeleton
   - Public pages: Home, Catalog (Music, Books), Work detail, Creator profile.
   - Authenticated: Dashboard (My Works), Upload wizard, Orders, Settings.
5. Payments (Design)
   - Plan Stripe integration for one‑time purchases first (webhooks via Lambda). Store minimal PII.

### Phase 1 — Creator Onboarding and Uploads
- Implement upload wizard using Amplify Storage with pre‑signed URLs.
- Serverless processing pipelines:
  - Audio: Generate 30–60s preview (Lambda + ffmpeg layer) and normalize to streaming format; update Asset entries.
  - Book: Extract sample pages (first N pages) or generate EPUB preview; optionally watermark PDFs.
- Metadata forms per type (Track/Album/Book) with validation and schema mapping.
- Cover image handling: resize and optimize derivatives (Lambda). Store in COVER assets.

### Phase 2 — Catalog, Search, and Discovery
- Public catalog with filters (genre, tags, price, release date) powered by AppSync queries.
- Full‑text search via OpenSearch Serverless or client‑side search for MVP; index key fields.
- Work detail pages: streaming audio preview (HLS or progressive) and book sample viewer (in‑browser PDF/EPUB).
- SEO: dynamic meta tags, sitemaps, OpenGraph, friendly URLs (/music/{slug}, /books/{slug}).

### Phase 3 — Commerce and Licensing
- Stripe checkout for one‑time purchases of tracks/books; store Orders with providerRef.
- Secure file delivery with short‑lived signed CloudFront URLs post‑purchase.
- Licenses: simple EULA acceptance on checkout; later add commercial license SKUs.
- Receipts and order history pages; email notifications via SES.

### Phase 4 — Governance and Moderation
- Admin dashboard: content moderation (flag/approve), takedown workflows, abuse reporting.
- Rate limiting and bot protection: reuse existing reCAPTCHA flow during sensitive actions.
- Legal pages: Terms of Service, Privacy Policy, Copyright Policy (DMCA), Cookie notice.

### Phase 5 — Enhancements
- Subscriptions for catalogs or patronage tiers (Stripe Billing); gated content based on entitlements.
- Social features (likes, follows), curated playlists/bookshelves, recommendations.
- Analytics: per‑work views, preview plays, conversions (Pinpoint/GA/CloudWatch metrics).

### Technical Notes for This Stack
- Amplify Data: expand amplify/data/resource.ts with the new models and owner/role‑based auth rules.
- Storage: add Amplify Storage resources (private/protected/public levels) and S3 event triggers for processing.
- Media processing: use Lambda with ffmpeg layer, or AWS Elemental MediaConvert for HLS if needed.
- Delivery: CloudFront with origin access to S3; sign URLs in a Lambda/API route.
- Payments: create a minimal Node Lambda for Stripe webhooks; store Orders via AppSync.
- CI/CD: keep amplify.yml for build/deploy; add environment vars for Stripe keys and reCAPTCHA.

### Immediate Next Steps (MVP Path)
1. Define roles and extend Cognito groups; add basic UserProfile model and settings page. ✓
2. Add Storage category via Amplify and wire up an Upload page that saves Asset records.
3. Add Work, MusicTrack, Book models and a simple Creator Dashboard list + create flow.
4. Implement preview generation for audio and sample extraction for books via Lambda.
5. Publish a basic public Catalog and Work detail page with previews and purchase placeholder.

### Phase 0 — Authentication and Roles (Implemented)
- Cognito groups recognized: admin, creator, customer. Users without a group default to CUSTOMER.
- App derives a Role value (ADMIN | CREATOR | CUSTOMER | VISITOR) and stores it in a UserProfile on first login.
- First‑login profile completion screen prompts for: display name (required), avatar URL, bio, website.
- Data model added (Amplify Data):
  - Role enum: VISITOR, CUSTOMER, CREATOR, ADMIN.
  - UserProfile model: id (Cognito userId), displayName, role, avatarUrl, bio, socialLinks (JSON). Owner‑only auth.
- UI shows current role badge and requires profile creation before accessing the app.
- Note: Create Cognito user pool groups named Admin, Creator, Customer in your environment to use role mapping.


## Development conventions

- Site-specific pages should live under src/websites/{siteName}. For example: src/websites/pickleCheeze.
- Reusable UI and logic should be implemented as shared components under src/components and imported by website pages.
- Static/media assets should be hosted behind CloudFront at https://assets.guidogerbpublishing.com/ and referenced by absolute URLs from the React app. Avoid bundling large media into the app build.

## Tests

This project uses Vitest with jsdom and Testing Library for unit tests that validate implemented services and deployment configuration.

What’s covered:
- Amplify service configuration
  - Validates amplify_outputs.json contains required Auth and API fields.
  - Ensures src/main.tsx calls Amplify.configure(outputs).
- Voting service logic
  - Tests mutual exclusivity and count increment/decrement rules (extracted to src/services/voteLogic.ts).
- Deployment configuration
  - Parses amplify.yml and asserts backend pipeline-deploy and frontend build steps exist.

How to run:
1. Install dependencies (use a clean install):
   npm ci
2. Run the test suite once:
   npm test
3. Watch mode during development:
   npm run test:watch
4. Coverage report (text in terminal and HTML under coverage/):
   npm run coverage

Notes:
- These tests are unit-level and do not call live AWS services; the Amplify.configure test uses a mock for aws-amplify.
- To validate backend connectivity end-to-end, use your existing Amplify sandbox/pipeline and manual checks, or add integration tests with mocked network if desired.



### Troubleshooting: Domain management role missing (AWSAmplifyDomainRole-... cannot be found)
If Amplify Console → Hosting → Domain management shows:

  The role with name AWSAmplifyDomainRole-<something> cannot be found.

It means the per-domain IAM role Amplify uses to manage DNS validation was removed or never created. Fix it by recreating the role:

- Windows PowerShell (from this repo root):
  powershell -ExecutionPolicy Bypass -File .\amplify\fixAmplifyDomainRole.ps1 -RoleName AWSAmplifyDomainRole-Z09604182LJLD0XSED80O -Region us-east-1

- If you don’t recall the exact suffix, try the generic name first:
  powershell -ExecutionPolicy Bypass -File .\amplify\fixAmplifyDomainRole.ps1 -RoleName AWSAmplifyDomainRole -Region us-east-1

- Optional: scope to a specific Route 53 hosted zone (tighter permissions):
  powershell -ExecutionPolicy Bypass -File .\amplify\fixAmplifyDomainRole.ps1 -RoleName AWSAmplifyDomainRole -HostedZoneId Z123EXAMPLE -Region us-east-1

Next steps:
1) Return to Amplify Console → Hosting → Domain management and retry the previous action (connect domain / save settings).
2) If you still see the error, copy the role name from the error and rerun the script with that exact -RoleName value.
3) If your DNS is not in Route 53, you can bypass automation by creating the DNS records manually. Use:
   powershell -ExecutionPolicy Bypass -File .\amplify\setupCustomDomain.ps1 -AppId d295eioxqacudl -DomainName guidogerbpublishing.com -Branch main -Region us-east-1
   The script will print the required CNAME/ALIAS targets to add at your registrar.
