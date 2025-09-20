import Protected from '@guidogerb/components-pages-protected'

export default function RehearsalRoomSection({ children, logoutUri }) {
  return (
    <section className="protected" id="client-access">
      <h2>Client rehearsal room</h2>
      <p className="protected-copy">
        Presenters and collaborators can review rehearsal notes, download scores, and coordinate
        logistics once signed in.
      </p>
      <Protected logoutUri={logoutUri}>{children}</Protected>
    </section>
  )
}
