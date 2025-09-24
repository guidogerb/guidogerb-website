# AddCF-Tenant.ps1 operator runbook

This runbook guides operations through validating and scaffolding a new CloudFront tenant using [`AddCF-Tenant.ps1`](./AddCF-Tenant.ps1). Follow the checklist end-to-end so new tenants immediately integrate with repository tooling, local simulators, and release automation.

## Prerequisites

- **Runtime tooling** — PowerShell 7.4+, AWS CLI v2, Git, Node.js 20+, and pnpm (via `corepack`). Confirm with `pwsh --version`, `aws --version`, and `pnpm -v` before starting.
- **Local repository** — A clean checkout of `guidogerb-website` on the `work` branch. Resolve or stash any pending changes and pull the latest commits.
- **Environment** — macOS/Linux shell with access to `/etc/hosts` so new `local.<tenant>` hostnames can be added if previewing locally.
- **Tenant brief** — Domain, display name, CloudFront distribution ID, and the list of environment secret keys the tenant requires (for GitHub, SSM, and `.env` parity).

## IAM access

`AddCF-Tenant.ps1` itself writes to the repository, but operators must verify CloudFront metadata and prep secrets in AWS and GitHub. Use an IAM role that grants:

- `cloudfront:ListDistributions` and `cloudfront:GetDistribution` — validate the provided distribution ID and ensure the tenant’s domain is mapped in the target connection group.
- `cloudfront:ListInvalidations` and `cloudfront:CreateInvalidation` — support follow-up smoke tests once the tenant ships.
- `ssm:PutParameter`, `secretsmanager:CreateSecret`, or equivalent access used by the secrets automation for the supplied `EnvSecretKeys`.

The managed policy `arn:aws:iam::aws:policy/CloudFrontFullAccess` plus your platform’s secrets-management policy is sufficient. Confirm credentials with `aws sts get-caller-identity` before executing the runbook.

## Invocation workflow

1. Create or switch to a feature branch named after the tenant (for example, `tenant/exampletenant.com`).
2. Run a contract dry run to confirm inputs resolve correctly:

   ```powershell
   pwsh ./infra/ps1/AddCF-Tenant.ps1 \
     -Domain 'exampletenant.com' \
     -DisplayName 'Example Tenant' \
     -DistributionId 'EGG1850W4K2XV' \
     -EnvSecretKeys 'VITE_API_BASE_URL','VITE_COGNITO_CLIENT_ID' \
     -ValidateOnly
   ```

   The command emits an object describing the resolved workspace slug, package name, and generated secret filename without touching disk.
3. Remove `-ValidateOnly` and run the scaffold once the contract looks correct:

   ```powershell
   pwsh ./infra/ps1/AddCF-Tenant.ps1 \
     -Domain 'exampletenant.com' \
     -DisplayName 'Example Tenant' \
     -DistributionId 'EGG1850W4K2XV' \
     -EnvSecretKeys 'VITE_API_BASE_URL','VITE_COGNITO_CLIENT_ID'
   ```

4. Capture the JSON object printed by the script for the ticket. It includes the derived workspace slug, npm package name, and secret file name.
5. If you need to scaffold inside an isolated Git worktree, append `-RepoRoot <worktreePath>` so the script writes into that checkout.

## Generated assets

Successful runs add or update the following paths:

- `websites/<domain>/` — Vite workspace with `README.md`, `tasks.md`, `.env.example`, `<TENANT>_VITE_ENV-secrets`, and starter React files.
- `package.json` — Adds the workspace entry plus `build:site:<slug>` and `dev:site:<slug>` scripts.
- `infra/ps1/cf-distributions.json` — Maps the domain to the supplied CloudFront distribution ID.
- `websites/README.md` — Lists the new tenant in the “Current tenants” section.
- `infra/local-dev/scripts/sync-sites.sh` — Extends site syncing and workspace resolution for the tenant.
- `infra/local-dev/cloudfront/nginx.conf` — Adds host-based routing for `local.<domain>` and wildcard variants.
- `infra/local-dev/s3/nginx.conf` — Provisions the static S3 simulator entry for `local.<domain>`.

Use `git status` to review the diff before proceeding.

## Post-run verification

1. Ensure hosts are appended to `/etc/hosts` for `local.<domain>` and `*.local.<domain>` (matching the entries injected into the NGINX configs).
2. Execute repository checks from the workspace root:

   ```bash
   pnpm clean
   pnpm install
   pnpm build
   pnpm lint
   pnpm format
   ```

   All commands must succeed without modifying additional files.
3. Bootstrap the tenant preview and confirm it serves the shared `<AppBasic />` shell:

   ```bash
   pnpm --filter websites-<workspaceSlug> preview -- --host 127.0.0.1 --port 4280
   ```

   Load `https://local.<domain>:4280/` in a browser (trust the mkcert certificate when prompted). The HTML should render `<title><DisplayName></title>`.
4. Inspect `websites/<domain>/<TENANT>_VITE_ENV-secrets` and share it with the secrets-management team so GitHub Actions can provision the keys listed in `-EnvSecretKeys`.
5. Confirm `infra/ps1/cf-distributions.json` and the local NGINX configs contain the expected hostnames so CloudFront/S3 simulators resolve the tenant.

## Secrets and IAM follow-up

- Register each `EnvSecretKey` inside GitHub Environments and the platform’s secrets manager using the generated secret filename as a hand-off artifact.
- Coordinate with the CloudFront team to create the production origin or behavior for the new domain if it does not already exist.

## Cleanup and rollback

If scaffolding needs to be undone before commit:

1. Remove the generated workspace directory and secrets file:

   ```bash
   git clean -fd websites/<domain>
   ```

2. Restore modified repository files:

   ```bash
   git restore package.json infra/ps1/cf-distributions.json \
     websites/README.md infra/local-dev/scripts/sync-sites.sh \
     infra/local-dev/cloudfront/nginx.conf infra/local-dev/s3/nginx.conf
   ```

3. If a dry-run worktree was used, remove it with `git worktree remove <path>`.
4. Re-run the contract validation with corrected parameters before attempting another scaffold.

## Troubleshooting

- **Validation failures** — The script enforces domain format, duplicate detection, and secret key naming. Review the thrown error, adjust inputs, and rerun with `-ValidateOnly`.
- **Preview access errors** — Confirm `/etc/hosts` includes the `local.<domain>` entry and restart the preview so mkcert certificates regenerate if needed.
- **Missing IAM rights** — `aws cloudfront list-distributions --output text | grep <distributionId>` should succeed. If it fails, assume credentials lack the CloudFront permissions described above.

Document every execution in the tenant’s ticket, attaching the contract object and verification logs.
