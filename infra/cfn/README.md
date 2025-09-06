# Stream4Cloud — Pure CloudFormation Starters

This folder contains **pure CloudFormation** starter templates for Phase 1 (V1). They are modular and can be deployed independently per site/service. No existing code/IaC was changed — these are new starters.

> Defaults are conservative. All resources are parameterized. You can lift these into a mono-repo under `/stacks/*`.

## Templates

- `edge-site.yaml` — S3 static hosting, CloudFront (with **Origin Access Control**), optional Route 53 DNS, ACM cert (us-east-1). Deploy once **per website/domain**.
- `auth.yaml` — Cognito User Pool, App Client (PKCE), optional Hosted UI domain, optional Google OIDC IdP (parameterized).
- `api.yaml` — HTTP API (API Gateway v2) + a hello Lambda, JWT authorizer wired to Cognito, stage, and basic `/health` route.
- `data.yaml` — DynamoDB single-table starter (PK/SK) with stream + two GSIs; PITR optional.
- `media-audio-video.yaml` — MediaConvert **JobTemplates** (audio & video), IAM roles, and a Step Functions **State Machine** that uses two inline Lambda starters to submit jobs (they auto-discover the account endpoint).
- `opensearch-serverless.yaml` — OpenSearch Serverless collection (search) with encryption/network/data access policies (admin principal parameter).

## Quick Deploy (examples)

```bash
# 1) Edge (one per site)
aws cloudformation deploy   --template-file edge-site.yaml   --stack-name s4c-edge-site-a   --capabilities CAPABILITY_NAMED_IAM   --parameter-overrides     SiteDomainName=example1.com     CertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/abcd-efgh     HostedZoneId=Z123456ABCDEFG

# 2) Auth
aws cloudformation deploy   --template-file auth.yaml   --stack-name s4c-auth   --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND   --parameter-overrides     UserPoolName=Stream4CloudUsers     CreateHostedUIDomain=true     HostedUIDomainPrefix=stream4cloud-auth-xyz     EnableGoogleIdP=false

# 3) API
aws cloudformation deploy   --template-file api.yaml   --stack-name s4c-api   --capabilities CAPABILITY_NAMED_IAM   --parameter-overrides     ApiName=stream4cloud-api     StageName=prod     CognitoIssuerUrl=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXX     CognitoAudienceClientIds='["1h2j3kexampleclientid"]'

# 4) Data
aws cloudformation deploy   --template-file data.yaml   --stack-name s4c-data   --parameter-overrides TableName=Stream4Cloud

# 5) Media (audio/video)
aws cloudformation deploy   --template-file media-audio-video.yaml   --stack-name s4c-media   --capabilities CAPABILITY_NAMED_IAM   --parameter-overrides     InputBucketName=s4c-ingest-bucket     OutputBucketName=s4c-media-output

# 6) OpenSearch Serverless
aws cloudformation deploy   --template-file opensearch-serverless.yaml   --stack-name s4c-oss   --parameter-overrides AdminPrincipalArn=arn:aws:iam::123456789012:role/Admin
```

### Notes
- **Certificates** for CloudFront **must** live in **us-east-1**.
- For Route 53 records, set `HostedZoneId`. If omitted, DNS record is not created.
- The MediaConvert submitters are **minimal** (Python inline). Replace with your production Lambdas later.
- For Google IdP, set `GoogleClientId`, `GoogleClientSecret` and enable the toggle.
