# GuidoGerb Publishing welcome page component

Authenticated welcome card for label partners. Highlights release calendars, royalty templates, and
contact routes once the user signs in via Cognito.

- Renders partner-specific copy and quick links to downloadable resources.
- Pulls the signed-in user's email when present to reinforce account context.
- Allows nested children so the main app can insert additional partner widgets.
- Resource URLs and contact email addresses resolve through `partnerResources.js`, which reads
  `import.meta.env` overrides to keep operations configuration-driven.
