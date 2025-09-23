# This-Is-My-Story welcome page component

Authenticated welcome view for storytellers. The component now introduces branded copy that
highlights writing prompts, curated resources, and care-team touchpoints while also replacing
console debugging with structured analytics events.

- Relies on `useAuth()` to show loading/error feedback during the OIDC handshake.
- Emits `thisismystory.auth.context_change` via `useAnalytics()` whenever the auth context changes so
  the care team can monitor sign-in success, loading, and error states.
- Greets the storyteller using their Cognito username when available and falls back to a generic
  label.
- Lists writing prompts, documentation, and contact channels tailored to the storytelling brand.
- Accepts children so the app shell can inject additional resources under the greeting.

The component should always be rendered inside `<Protected />` from
`@guidogerb/components-pages-protected`.
