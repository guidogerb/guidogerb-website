import { useAuth } from '@guidogerb/components-auth'
import { getPartnerFeatureFlags } from '../../featureFlags.js'
import { getPartnerResourceLinks } from '../../partnerResources.js'

export default function Welcome({ children }) {
  const auth = useAuth()

  if (auth?.error) {
    return <div className="welcome-error">Sign-in failed: {auth.error.message}</div>
  }

  if (!auth?.isAuthenticated) {
    return <div className="welcome-loading">Loading partner pantry…</div>
  }

  const profile = auth?.user?.profile ?? {}
  const name = profile['cognito:username'] ?? profile.name ?? 'guest partner'
  const email = profile.email
  const features = getPartnerFeatureFlags()
  const resourceLinks = getPartnerResourceLinks(features)
  const hasResources = resourceLinks.length > 0

  return (
    <div className="welcome-card">
      <h3>Welcome back, {name}!</h3>
      {email ? <p className="welcome-subhead">Signed in as {email}</p> : null}
      <p>
        Browse seasonal release sheets, download spec labels, and review handling notes before your
        next pickup or delivery.
      </p>
      {hasResources ? (
        <ul className="welcome-links">
          {resourceLinks.map((link) => (
            <li key={link.id ?? link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="welcome-empty">
          New partner resources are curing. We’ll notify you when downloads are ready.
        </p>
      )}
      {children}
    </div>
  )
}
