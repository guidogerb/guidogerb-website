# infra/cfn/stream4cloud

Pure **CloudFormation** starters for Phase-1.

## Templates

- `edge-site.yaml` — S3 + CloudFront (OAC) + optional Route 53
- `auth.yaml` — Cognito User Pool + App Client (+ optional Hosted UI + Google IdP)
- `api.yaml` — HTTP API + Lambda + JWT authorizer
- `data.yaml` — DynamoDB single-table starter
- `media-audio-video.yaml` — MediaConvert JobTemplates + Step Functions + submitter Lambdas
- `opensearch-serverless.yaml` — OpenSearch Serverless collection + policies

See **`PUBLISHING.md`** for install & deploy instructions.
