# Stream4Cloud welcome page component

Protected welcome view for Stream4Cloud broadcasters. The component displays minimal copy today and
will eventually surface integration resources and support links.

- Uses `useAuth()` to determine the signed-in user and to surface loading/error states.
- Falls back to a generic name when the Cognito profile lacks identifying information.
- Supports rendering children beneath the greeting for additional callouts supplied by the host app.
