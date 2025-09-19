# This-Is-My-Story welcome page component

Simple authenticated welcome view for storytellers. It currently renders placeholder copy while we
draft editorial guidance.

- Relies on `useAuth()` to show loading/error feedback during the OIDC handshake.
- Greets the storyteller using their Cognito username when available.
- Accepts children so the app shell can inject additional resources under the greeting.

The component should always be rendered inside `<Protected />` from
`@guidogerb/components-pages-protected`.
