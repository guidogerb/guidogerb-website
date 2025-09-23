import Protected from '@guidogerb/components-pages-protected'
import Welcome from '../welcome-page/index.jsx'

export function PartnerHubSection({ logoutUri }) {
  return (
    <section className="protected" id="partner-hub">
      <h2>Partner pantry</h2>
      <p className="protected-copy">
        Chefs, buyers, and collaborators can review seasonal availability, download product specs,
        and schedule tasting pickups once signed in.
      </p>
      <Protected logoutUri={logoutUri}>
        <Welcome>
          <p>
            Explore the latest cellar inventory, download plating guides, and coordinate joint
            events directly with the PickleCheeze team.
          </p>
        </Welcome>
      </Protected>
    </section>
  )
}
