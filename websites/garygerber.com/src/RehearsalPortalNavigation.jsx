import { useMemo } from 'react'

function toArray(value) {
  if (Array.isArray(value)) return value
  if (!value) return []
  return [value]
}

function getPrimaryContact(contacts = []) {
  return contacts.find((contact) => contact?.id === 'production') ?? contacts[0]
}

export default function RehearsalPortalNavigation({ onNavigate, resources = {} }) {
  const downloads = useMemo(() => {
    return [
      resources?.stagePlotHref
        ? {
            id: 'stage-plot',
            label: 'Download stage plot',
            href: resources.stagePlotHref,
          }
        : null,
      resources?.rehearsalChecklistHref
        ? {
            id: 'rehearsal-checklist',
            label: 'Review rehearsal checklist',
            href: resources.rehearsalChecklistHref,
          }
        : null,
      resources?.productionEmailHref
        ? {
            id: 'email-production',
            label: 'Email production team',
            href: resources.productionEmailHref,
          }
        : null,
    ].filter(Boolean)
  }, [resources?.productionEmailHref, resources?.rehearsalChecklistHref, resources?.stagePlotHref])

  const nextEvent = useMemo(() => {
    const events = toArray(resources?.upcomingEvents)
    return events[0]
  }, [resources?.upcomingEvents])

  const productionContact = useMemo(() => {
    const contacts = toArray(resources?.contacts)
    return getPrimaryContact(contacts)
  }, [resources?.contacts])

  const handleNavigate = (event) => {
    if (typeof onNavigate !== 'function') return
    onNavigate(event, '/rehearsal/resources')
  }

  return (
    <div className="rehearsal-portal-nav" aria-labelledby="rehearsal-portal-heading">
      <div className="rehearsal-portal-nav__primary">
        <h4 id="rehearsal-portal-heading">Rehearsal quick access</h4>
        <p>
          Open the resource library for the latest schedules, hospitality notes, and download links
          tailored to this residency.
        </p>
        <ul className="rehearsal-portal-nav__links">
          <li>
            <a href="/rehearsal/resources" onClick={handleNavigate}>
              Open rehearsal resources
            </a>
          </li>
          {downloads.map((download) => (
            <li key={download.id}>
              <a href={download.href}>{download.label}</a>
            </li>
          ))}
        </ul>
      </div>

      {nextEvent ? (
        <section className="rehearsal-portal-nav__summary" aria-labelledby="rehearsal-next-event">
          <p className="rehearsal-portal-nav__eyebrow">Next call time</p>
          <h5 id="rehearsal-next-event">{nextEvent.title}</h5>
          <p className="rehearsal-portal-nav__meta">{nextEvent.date}</p>
          {nextEvent.location ? (
            <p className="rehearsal-portal-nav__meta">{nextEvent.location}</p>
          ) : null}
          {Array.isArray(nextEvent.callTimes) && nextEvent.callTimes.length > 0 ? (
            <ul className="rehearsal-portal-nav__call-times">
              {nextEvent.callTimes.map((entry, index) => (
                <li key={`${nextEvent.id}-call-${index}`}>
                  <span>{entry.label}</span>
                  <span>{entry.value}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {productionContact ? (
        <section
          className="rehearsal-portal-nav__summary"
          aria-labelledby="rehearsal-portal-contact"
        >
          <p className="rehearsal-portal-nav__eyebrow">Production contact</p>
          <h5 id="rehearsal-portal-contact">{productionContact.name}</h5>
          {productionContact.role ? (
            <p className="rehearsal-portal-nav__meta">{productionContact.role}</p>
          ) : null}
          <ul className="rehearsal-portal-nav__links">
            {productionContact.phoneHref ? (
              <li>
                <a href={productionContact.phoneHref}>
                  Call {productionContact.phoneLabel ?? productionContact.name}
                </a>
              </li>
            ) : null}
            {productionContact.emailHref ? (
              <li>
                <a href={productionContact.emailHref}>
                  Email {productionContact.emailLabel ?? productionContact.name}
                </a>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
