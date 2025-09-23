import { useAuth } from '@guidogerb/components-auth'
import { getPartnerFeatureFlags } from '../../featureFlags.js'

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
  const features = getPartnerFeatureFlags()

  const resourceLinks = []

  if (features.showInventoryDownload) {
    resourceLinks.push({
      href: '/files/picklecheeze-cellar-inventory.pdf',
      label: 'Download current cellar inventory',
    })
  }

  if (features.showCareGuide) {
    resourceLinks.push({
      href: '/files/cheese-care-guide.pdf',
      label: 'Cheeze care & plating guide',
    })
  }

  if (features.showContactEmail) {
    resourceLinks.push({
      href: 'mailto:partners@picklecheeze.com?subject=Partner%20portal%20question',
      label: 'Email the fermentation team',
    })
  }

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
            <li key={link.href}>
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
