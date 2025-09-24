# CloudFront PowerShell tasks

| name                                                | createdDate | lastUpdatedDate | completedDate | status   | description |
| --------------------------------------------------- | ----------- | --------------- | ------------- | -------- | ----------- |
| Document existing CloudFront utility scripts        | 2025-09-30  | 2025-09-30      | 2025-09-30    | complete | Capture current helper coverage in `README.md` so operators know when to use each script. |
| Define `AddCF-Tenant` input contract and guardrails | 2025-09-30  | 2025-09-30      | -             | planned  | Specify required parameters (domain, display name, distribution ID, env secret keys) and validation to prevent duplicate tenants. |
| Automate CloudFront tenant provisioning             | 2025-09-30  | 2025-09-30      | -             | planned  | Use AWS CLI/SDK calls to create the distribution tenant and persist its ID back to `cf-distributions.json`. |
| Scaffold Vite tenant workspace + repo wiring        | 2025-09-30  | 2025-09-30      | -             | planned  | Generate a Vite site with `<AppBasic />`, register it in pnpm workspaces, root scripts, nginx configs, env templates, and CloudFront mappings. |
| Generalize CI/CD workflows and secrets management   | 2025-09-30  | 2025-09-30      | -             | planned  | Update GitHub Actions to derive tenants dynamically, manage per-site secrets, and ensure new tenants flow through build/deploy jobs automatically. |
| Ship regression tests for tenant scaffolding        | 2025-09-30  | 2025-09-30      | -             | planned  | Add automation that scaffolds a test tenant, runs `pnpm clean/install/build/lint/format`, and boots a preview to confirm the welcome page renders. |
| Publish runbook for operating the automation        | 2025-09-30  | 2025-09-30      | -             | planned  | Document how to invoke `AddCF-Tenant.ps1`, required IAM roles, cleanup steps, and verification checks once the tooling ships. |
