function getStageManagerContact(contacts = []) {
  return contacts.find((contact) => contact?.id === 'stage-manager')
}

export default function NotFound({ onNavigateHome, resources = {} }) {
  const stageManager = getStageManagerContact(resources.contacts)
  const productionEmailHref = resources.productionEmailHref
  const callHref = stageManager?.phoneHref
  const callLabel = stageManager?.phoneLabel ?? stageManager?.name

  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <p className="not-found__eyebrow">404</p>
      <h1 id="not-found-title">We couldn’t find that page</h1>
      <p>
        It looks like the link has been retired between tour stops. Head back to the main stage or reach
        out so we can resend the right rehearsal materials.
      </p>
      <div className="not-found__actions">
        <a href="/" onClick={onNavigateHome} data-variant="primary">
          Back to main stage
        </a>
        {productionEmailHref ? <a href={productionEmailHref}>Email production team</a> : null}
        {callHref ? <a href={callHref}>Call {callLabel}</a> : null}
      </div>
      <p className="not-found__support">
        Need a download fast? Let us know which residency you’re prepping for and we’ll resend stage
        plots, scores, and hospitality notes.
      </p>
    </section>
  )
}
