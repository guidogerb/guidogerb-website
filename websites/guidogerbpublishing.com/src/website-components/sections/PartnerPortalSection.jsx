import Protected from '@guidogerb/components-pages-protected'
import Welcome from '../welcome-page/index.jsx'

export function PartnerPortalSection({ logoutUri }) {
  return (
    <section className="protected" id="partner-portal">
      <h2>Partner operations portal</h2>
      <p className="protected-copy">
        Signed-in partners can review royalty dashboards, download assets, and coordinate release
        plans with our production team.
      </p>
      <Protected logoutUri={logoutUri}>
        <Welcome />
      </Protected>
    </section>
  )
}
