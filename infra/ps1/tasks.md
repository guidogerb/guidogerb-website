# CloudFront PowerShell tasks

| name                                                | createdDate | lastUpdatedDate | completedDate | status   | description                                                                                                                                        |
| --------------------------------------------------- | ----------- | --------------- | ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document existing CloudFront utility scripts        | 2025-09-30  | 2025-09-30      | 2025-09-30    | complete | Capture current helper coverage in `README.md` so operators know when to use each script.                                                          |
| Define `AddCF-Tenant` input contract and guardrails | 2025-09-30  | 2025-10-01      | 2025-10-01    | complete | Specify required parameters (domain, display name, distribution ID, env secret keys) and validation to prevent duplicate tenants.                  |
|  |
| Scaffold Vite tenant workspace + repo wiring        | 2025-09-30  | 2025-10-02      | 2025-10-02    | complete | Script now generates `<AppBasic />` workspaces, updates root scripts, CloudFront mappings, and local dev assets so new tenants run without manual edits. |
| Generalize CI/CD workflows and secrets management   | 2025-09-30  | 2025-09-30      | -             | planned  | Update GitHub Actions to derive tenants dynamically, manage per-site secrets, and ensure new tenants flow through build/deploy jobs automatically. |
| Ship regression tests for tenant scaffolding        | 2025-09-30  | 2025-09-30      | -             | planned  | Add automation that scaffolds a test tenant, runs `pnpm clean/install/build/lint/format`, and boots a preview to confirm the welcome page renders. |
| Publish runbook for operating the automation        | 2025-09-30  | 2025-09-30      | -             | planned  | Document how to invoke `AddCF-Tenant.ps1`, required IAM roles, cleanup steps, and verification checks once the tooling ships.                      |
