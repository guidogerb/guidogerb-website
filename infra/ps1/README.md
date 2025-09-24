# CloudFront tenant PowerShell utilities

This folder houses the PowerShell helpers that operations uses to inspect and
refresh the AWS CloudFront multi-tenant distribution that fronts every hosted
website. Each script assumes PowerShell 7+, the AWS CLI v2, and credentials with
CloudFront permissions. `Export-CloudFront.ps1` additionally requires the
[`powershell-yaml`](https://www.powershellgallery.com/packages/powershell-yaml)
module.

## Available scripts

### `Export-CloudFront.ps1`

Exports a normalized YAML summary for a CloudFront distribution. Optional flags
allow the export of CloudFront Function metadata and the currently deployed
LIVE code. The script is primarily used to snapshot tenant/origin/behavior
configuration and store the results in `cloudfront-export-*/` directories for
review.

### `CF-InvalidateAll.ps1`

Automates invalidations across every tenant that belongs to a CloudFront
Connection Group. Tenants are discovered via the AWS CLI and each receives an
invalidation request using either a shared JSON batch or a generated batch based
on the provided paths. The helper can operate in dry-run mode to preview the
commands it will execute.

### `AddCF-Tenant.ps1`

Validates the tenant contract **and** scaffolds a new Vite/React workspace wired
to the shared CloudFront distribution. The script ensures the domain, human
readable display name, distribution identifier, and environment secret keys are
well-formed before generating a site that renders the shared `<AppBasic />`
shell. Successful runs create the `websites/<domain>/` workspace, update root
pnpm workspaces and build scripts, append the CloudFront distribution map, and
extend local development assets (nginx configs, sync scripts) so the tenant
flows through existing tooling automatically. Usage example:

```powershell
pwsh ./AddCF-Tenant.ps1 \
  -Domain 'exampletenant.com' \
  -DisplayName 'Example Tenant' \
  -DistributionId 'EGG1850W4K2XV' \
  -EnvSecretKeys @('VITE_API_BASE_URL','VITE_COGNITO_CLIENT_ID')
```

Follow-on automation (documented in [`tasks.md`](./tasks.md)) will generalise
CI/CD workflows and regression testing around the generated scaffold.

Consult the [`AddCF-Tenant.ps1` operator runbook](./AddCF-Tenant.runbook.md) for step-by-step execution, IAM guidance, and cleanup procedures.

## Supporting data files

### `cf-distributions.json`

Map of tenant domains to CloudFront distribution IDs used by release and
invalidation workflows. `AddCF-Tenant.ps1` now updates the file automatically
whenever a new tenant scaffold is created.

### `invalidation.json`

Reference JSON payload that mirrors the structure CloudFront expects when
creating invalidations. It can be reused by `CF-InvalidateAll.ps1` with the
`-InvalidationJson` flag.

### `cloudfront-export-*/*`

Captured exports from `Export-CloudFront.ps1`. These directories hold historical
snapshots of the CloudFront distribution for auditing and change-review
purposes.

## Tenant automation roadmap

The current automation covers end-to-end scaffolding. Upcoming work will:

- Generalise GitHub Actions so build/deploy matrices discover tenants generated
  by the script and pull their secrets from a shared contract.
- Add regression tests that invoke `AddCF-Tenant.ps1` in CI, run `pnpm
clean/install/build/lint/format`, and boot a preview to verify the welcome
  experience renders.
- Publish operator runbooks that document IAM requirements, cleanup steps, and
  post-scaffold verification.

See [`tasks.md`](./tasks.md) for the detailed breakdown.
