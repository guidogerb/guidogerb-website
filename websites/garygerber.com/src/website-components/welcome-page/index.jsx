import { useAuth } from '@guidogerb/components-auth'

export default function Welcome({ children }) {
  const auth = useAuth()

  if (auth?.error) {
    return <div className="welcome-error">Sign-in failed: {auth.error.message}</div>
  }

  if (!auth?.isAuthenticated) {
    return <div className="welcome-loading">Loading rehearsal room…</div>
  }

  const name =
    auth?.user?.profile?.['cognito:username'] ?? auth?.user?.profile?.name ?? 'userNotAvailable'
  const email = auth?.user?.profile?.email

  return (
    <div className="welcome-card">
      <h3>Welcome back, {name}!</h3>
      {email ? <p className="welcome-subhead">Signed in as {email}</p> : null}
      <p>
        You now have access to scores, stage plots, and rehearsal notes for upcoming engagements. Reach out if anything
        looks out of date before the next planning session.
      </p>
      <ul className="welcome-links">
        <li>
          <a href="/files/stage-plot.pdf">Download latest stage plot</a>
        </li>
        <li>
          <a href="/files/rehearsal-checklist.pdf">Rehearsal checklist</a>
        </li>
        <li>
          <a href="mailto:hello@garygerber.com?subject=Collaboration%20Notes">Email production team</a>
        </li>
      </ul>
      {children}
    </div>
  )
}
