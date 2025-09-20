import { useAuth } from '@guidogerb/components-auth'
import partnerResources from '../../partnerResources.js'

export default function Welcome({ children }) {
  const auth = useAuth()

  if (auth?.error) {
    return <div className="welcome-error">Sign-in failed: {auth.error.message}</div>
  }

  if (!auth?.isAuthenticated) {
    return <div className="welcome-loading">Loading partner workspace…</div>
  }

  const name =
    auth?.user?.profile?.['cognito:username'] ?? auth?.user?.profile?.name ?? 'userNotAvailable'
  const email = auth?.user?.profile?.email
  const { releaseCalendarHref, royaltyTemplateHref, operationsEmailHref } = partnerResources

  return (
    <div className="welcome-card">
      <h3>Welcome back, {name}!</h3>
      {email ? <p className="welcome-subhead">Signed in as {email}</p> : null}
      <p>
        Access launch calendars, royalty statements, and marketing assets to keep upcoming releases
        on schedule. Let us know if you need additional formats or updated metadata.
      </p>
      <ul className="welcome-links">
        <li>
          <a href={releaseCalendarHref}>Download release calendar</a>
        </li>
        <li>
          <a href={royaltyTemplateHref}>Review latest royalty template</a>
        </li>
        <li>
          <a href={operationsEmailHref}>
            Email publishing operations
          </a>
        </li>
      </ul>
      {children}
    </div>
  )
}
