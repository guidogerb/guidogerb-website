# infra/terraform

Terraform modules and environments are **out of scope for Phase-1** (CloudFormation-first). This directory exists for future parity or vendor integration that prefers Terraform.

## Structure
- `modules/` — reusable modules (certificates, content-delivery, etc.)
- `environments/` — workspace folders (`dev`, `prod`)
- `scripts/` — helper scripts

> Prefer the CloudFormation starters in `infra/cfn/stream4cloud` for Phase-1.
