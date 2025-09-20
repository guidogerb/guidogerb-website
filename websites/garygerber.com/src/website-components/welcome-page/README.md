# GaryGerber welcome page component

Welcome experience for collaborators accessing rehearsal resources. Provides contextual copy and
links to stage plots, checklists, and production contacts.

- Leverages `useAuth()` to surface loading/error states during authentication.
- Greets the signed-in user using Cognito profile data and highlights their email when available.
- Lists rehearsal resources from `rehearsalResources.js`, which reads defaults and optional
  overrides from `import.meta.env`:
  - `VITE_REHEARSAL_RESOURCES_STAGE_PLOT_URL`
  - `VITE_REHEARSAL_RESOURCES_CHECKLIST_URL`
  - `VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL`
  - `VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL_SUBJECT`
  When overrides are absent the component falls back to tenant defaults so deployments keep
  working without extra configuration.
