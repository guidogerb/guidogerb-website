# PickleCheeze welcome page component

Authenticated welcome card shown inside the PickleCheeze partner portal. It greets the signed-in
user, surfaces partner-facing PDFs, and renders any nested children passed by the app shell.

- Displays loading and error states provided by `useAuth()`.
- Greets partners by Cognito username or email when available.
- Lists quick links to cellar inventory, care guides, and contact emails.

Wrap the component inside the shared `<Protected />` guard exported by
`@guidogerb/components-pages-protected` to ensure only authenticated users can access the content.
