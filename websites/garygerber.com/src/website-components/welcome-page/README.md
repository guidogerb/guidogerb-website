# GaryGerber welcome page component

Welcome experience for collaborators accessing rehearsal resources. Provides contextual copy and
links to stage plots, checklists, and production contacts.

- Leverages `useAuth()` to surface loading/error states during authentication.
- Greets the signed-in user using Cognito profile data and highlights their email when available.
- Lists rehearsal resources as simple anchors; future revisions will make these configurable.
