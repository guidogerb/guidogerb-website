# Tenant websites

The `websites/` workspace contains one Vite-powered React application per domain.
Each tenant is currently wired into build and deploy workflows manually and
relies on tenant-specific environment secrets.

## Current tenants

- `garygerber.com`
- `guidogerbpublishing.com`
- `picklecheeze.com`
- `stream4cloud.com`
- `this-is-my-story.org`
- `ggp.llc`

## Manual wiring inventory

New tenants require edits in several places. The forthcoming automation needs to
cover each of the following touch points so the repository stays consistent:

- Root `package.json` scripts (`build:site:*`, `dev:site:*`, etc.).
- `pnpm-workspace.yaml` workspace definitions.
- `.github/workflows/build.yml` and `.github/workflows/deploy.yml` matrix entries
  and secret lookups.
- Local development assets (`infra/local-dev/**`, nginx configs, sync scripts).
- CloudFront helper data (`infra/ps1/cf-distributions.json`).
- Site-specific documentation and environment templates (each `websites/<tenant>`
  README and `.env` scaffolding).

Documenting these dependencies here ensures the `AddCF-Tenant` automation has a
clear checklist when it starts generating new tenants.
