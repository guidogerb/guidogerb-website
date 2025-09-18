import { useAuth } from '@guidogerb/components-auth'

export default function Welcome({ children }) {
  const auth = useAuth()

  if (auth?.error) {
    return <div className="welcome-error">Sign-in failed: {auth.error.message}</div>
  }

  if (!auth?.isAuthenticated) {
    return <div className="welcome-loading">Loading partner pantry…</div>
  }

  const name =
    auth?.user?.profile?.['cognito:username'] ?? auth?.user?.profile?.name ?? 'guest partner'
  const email = auth?.user?.profile?.email

  return (
    <div className="welcome-card">
      <h3>Welcome back, {name}!</h3>
      {email ? <p className="welcome-subhead">Signed in as {email}</p> : null}
      <p>
        Browse seasonal release sheets, download spec labels, and review handling notes before your
        next pickup or delivery.
      </p>
      <ul className="welcome-links">
        <li>
          <a href="/files/picklecheeze-cellar-inventory.pdf">Download current cellar inventory</a>
        </li>
        <li>
          <a href="/files/cheese-care-guide.pdf">Cheeze care &amp; plating guide</a>
        </li>
        <li>
          <a href="mailto:partners@picklecheeze.com?subject=Partner%20portal%20question">
            Email the fermentation team
          </a>
        </li>
      </ul>
      {children}
    </div>
  )
}
