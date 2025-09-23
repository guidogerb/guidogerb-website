function asArray(value) {
  return Array.isArray(value) ? value : []
}

export default function RehearsalResourcesLanding({ resources = {} }) {
  const downloads = [
    resources?.stagePlotHref
      ? {
          id: 'stage-plot',
          label: 'Download latest stage plot (PDF)',
          href: resources.stagePlotHref,
        }
      : null,
    resources?.rehearsalChecklistHref
      ? {
          id: 'rehearsal-checklist',
          label: 'Rehearsal checklist (PDF)',
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

  const upcomingEvents = asArray(resources?.upcomingEvents)
  const rehearsalNotes = asArray(resources?.rehearsalNotes)
  const contacts = asArray(resources?.contacts)
  const calendar = resources?.calendar ?? {}

  return (
    <section className="rehearsal-resources" aria-label="Rehearsal resources">
      <header className="rehearsal-resources__intro">
        <p className="rehearsal-resources__eyebrow">Rehearsal library</p>
        <h3>Everything you need for the next residency</h3>
        <p>
          Setlists, call times, and production contacts refresh here the moment we publish an update.
          Bookmark the page so you always have the latest logistics.
        </p>
      </header>

      <div className="rehearsal-resources__grid">
        <section className="rehearsal-resources__panel" aria-labelledby="rehearsal-schedule-heading">
          <h4 id="rehearsal-schedule-heading">Upcoming schedule</h4>
          <p>
            Review call times for each rehearsal block. We’ll flag hospitality windows and livestream
            holds as soon as they change.
          </p>
          <ul className="rehearsal-resources__events">
            {upcomingEvents.map((event) => (
              <li key={event.id} className="rehearsal-resources__event">
                <h5>{event.title}</h5>
                <p className="rehearsal-resources__event-meta">
                  <span>{event.date}</span>
                  <span>{event.location}</span>
                </p>
                {event.details ? <p>{event.details}</p> : null}
                {Array.isArray(event.callTimes) && event.callTimes.length > 0 ? (
                  <dl className="rehearsal-resources__call-times">
                    {event.callTimes.map((entry, index) => (
                      <div key={`${event.id}-call-${index}`}>
                        <dt>{entry.label}</dt>
                        <dd>{entry.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </li>
            ))}
          </ul>
          {calendar?.embedSrc ? (
            <div className="rehearsal-resources__calendar">
              <iframe
                src={calendar.embedSrc}
                title="Northern Lights rehearsal calendar"
                loading="lazy"
                allowFullScreen
              />
              {calendar?.description ? <p>{calendar.description}</p> : null}
              {calendar?.subscribeHref ? (
                <a href={calendar.subscribeHref}>Open full calendar</a>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rehearsal-resources__panel" aria-labelledby="rehearsal-notes-heading">
          <h4 id="rehearsal-notes-heading">Rehearsal notes</h4>
          <ul className="rehearsal-resources__notes">
            {rehearsalNotes.map((note, index) => (
              <li key={`rehearsal-note-${index}`}>{note}</li>
            ))}
          </ul>

          {downloads.length > 0 ? (
            <div className="rehearsal-resources__downloads">
              <h5>Quick downloads</h5>
              <ul>
                {downloads.map((link) => (
                  <li key={link.id}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="rehearsal-resources__panel" aria-labelledby="rehearsal-contacts-heading">
          <h4 id="rehearsal-contacts-heading">Production contacts</h4>
          <ul className="rehearsal-resources__contacts">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <h5>{contact.name}</h5>
                {contact.role ? <p className="rehearsal-resources__contact-role">{contact.role}</p> : null}
                <ul className="rehearsal-resources__contact-links">
                  {contact.phoneHref ? (
                    <li>
                      <a href={contact.phoneHref}>Call {contact.phoneLabel ?? contact.name}</a>
                    </li>
                  ) : null}
                  {contact.emailHref ? (
                    <li>
                      <a href={contact.emailHref}>Email {contact.emailLabel ?? contact.name}</a>
                    </li>
                  ) : null}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  )
}
