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

Captures the input contract and guard rails for the forthcoming automation that
will provision a brand new tenant inside the shared CloudFront distribution. The
script validates the tenant domain, human readable display name, distribution
identifier, and the list of environment secret keys to ensure callers cannot
accidentally scaffold duplicate tenants or provide malformed configuration. The
orchestration that scaffolds a workspace and updates repository wiring will plug
into this validated contract in upcoming tasks documented in
[`tasks.md`](./tasks.md).

## Supporting data files

### `cf-distributions.json`

A manually maintained map of tenant domains to CloudFront distribution IDs used
by release and invalidation workflows. This file will eventually become
automatically generated once the `AddCF-Tenant` automation lands.

### `invalidation.json`

Reference JSON payload that mirrors the structure CloudFront expects when
creating invalidations. It can be reused by `CF-InvalidateAll.ps1` with the
`-InvalidationJson` flag.

### `cloudfront-export-*/*`

Captured exports from `Export-CloudFront.ps1`. These directories hold historical
snapshots of the CloudFront distribution for auditing and change-review
purposes.

## Tenant automation roadmap

A new automation pass will:

- Provision CloudFront tenants without manual CLI usage.
- Generate a Vite/React workspace for the new domain (including `AppBasic`
  wiring and tenant-specific environment files).
- Update configuration files, scripts, and GitHub Actions workflows so new
  tenants participate in builds, deployments, and local development without
  manual edits.
- Provide verification that root `package.json` scripts (`clean`, `install`,
  `build`, `lint`, `format`, `preview`) continue to succeed across every
  workspace after scaffolding a tenant.
- Ship regression tests that assert the automation produced a runnable website
  and the preview server renders the welcome page.

See [`tasks.md`](./tasks.md) for the detailed breakdown.
