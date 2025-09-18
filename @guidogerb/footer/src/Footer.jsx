import { useMemo } from 'react'

const BASE_CLASS = 'gg-footer'

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const normalizeLinks = (links) => {
  if (!Array.isArray(links)) return []
  return links
    .map((link) => {
      if (!isNonEmptyString(link?.label) || !isNonEmptyString(link?.href)) {
        return null
      }

      return {
        id: isNonEmptyString(link?.id) ? link.id : undefined,
        label: link.label.trim(),
        href: link.href,
        description: isNonEmptyString(link?.description) ? link.description.trim() : undefined,
        external: Boolean(link?.external),
        rel: isNonEmptyString(link?.rel) ? link.rel : undefined,
        target: isNonEmptyString(link?.target) ? link.target : undefined,
        icon: link?.icon,
        badge: isNonEmptyString(link?.badge) ? link.badge : undefined,
        badgeTone: isNonEmptyString(link?.badgeTone) ? link.badgeTone : undefined,
      }
    })
    .filter(Boolean)
}

const normalizeSections = (sections) => {
  if (!Array.isArray(sections)) return []
  return sections
    .map((section) => {
      const links = normalizeLinks(section?.links)
      if (!isNonEmptyString(section?.title) && links.length === 0) {
        return null
      }

      return {
        id: isNonEmptyString(section?.id) ? section.id : undefined,
        title: isNonEmptyString(section?.title) ? section.title.trim() : undefined,
        description: isNonEmptyString(section?.description)
          ? section.description.trim()
          : undefined,
        links,
      }
    })
    .filter(Boolean)
}

const getLinkKey = (link, index) => {
  if (isNonEmptyString(link?.id)) return link.id
  if (isNonEmptyString(link?.href)) return `${link.href}:${index}`
  return `${index}`
}

const getSectionKey = (section, index) => {
  if (isNonEmptyString(section?.id)) return section.id
  if (isNonEmptyString(section?.title)) return `${section.title}:${index}`
  return `${index}`
}

const buildLinkProps = (link, onNavigate, context) => {
  const props = {
    className: `${BASE_CLASS}__link`,
    href: link.href,
  }

  if (link.target) {
    props.target = link.target
  } else if (link.external) {
    props.target = '_blank'
  }

  if (link.rel) {
    props.rel = link.rel
  } else if (link.external) {
    props.rel = 'noreferrer noopener'
  }

  if (typeof onNavigate === 'function') {
    props.onClick = (event) => {
      if (typeof event?.preventDefault === 'function') {
        event.preventDefault()
      }

      onNavigate({ link, item: link, context, event })
    }
  }

  return props
}

const renderLink = (link, index, onNavigate, section) => {
  const key = getLinkKey(link, index)
  const linkProps = buildLinkProps(link, onNavigate, {
    type: 'section',
    section,
  })

  return (
    <li key={key} className={`${BASE_CLASS}__link-item`}>
      <a {...linkProps}>
        <span className={`${BASE_CLASS}__link-label`}>
          {link.icon ? <span className={`${BASE_CLASS}__link-icon`}>{link.icon}</span> : null}
          <span>{link.label}</span>
          {isNonEmptyString(link?.badge) ? (
            <span className={`${BASE_CLASS}__link-badge`} data-tone={link?.badgeTone ?? 'info'}>
              {link.badge}
            </span>
          ) : null}
        </span>
        {isNonEmptyString(link?.description) ? (
          <span className={`${BASE_CLASS}__link-description`}>{link.description}</span>
        ) : null}
      </a>
    </li>
  )
}

const renderSection = (section, index, onNavigate) => {
  const key = getSectionKey(section, index)
  const hasLinks = Array.isArray(section?.links) && section.links.length > 0

  return (
    <section key={key} className={`${BASE_CLASS}__section`}>
      {isNonEmptyString(section?.title) ? (
        <h2 className={`${BASE_CLASS}__section-title`}>{section.title}</h2>
      ) : null}
      {isNonEmptyString(section?.description) ? (
        <p className={`${BASE_CLASS}__section-description`}>{section.description}</p>
      ) : null}
      {hasLinks ? (
        <ul className={`${BASE_CLASS}__links`} role="list">
          {section.links.map((link, linkIndex) => renderLink(link, linkIndex, onNavigate, section))}
        </ul>
      ) : null}
    </section>
  )
}

const renderLegal = (items, onNavigate) => {
  if (!Array.isArray(items) || items.length === 0) return null

  return (
    <ul className={`${BASE_CLASS}__legal-list`} role="list">
      {normalizeLinks(items).map((link, index) => (
        <li key={getLinkKey(link, index)} className={`${BASE_CLASS}__legal-item`}>
          <a
            {...buildLinkProps(link, onNavigate, {
              type: 'legal',
            })}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function Footer({
  brand,
  sections,
  socialLinks,
  legalLinks,
  copyright,
  description,
  onNavigate,
  className,
  children,
  ...rest
} = {}) {
  const normalizedSections = useMemo(() => normalizeSections(sections), [sections])
  const normalizedSocial = useMemo(() => normalizeLinks(socialLinks), [socialLinks])
  const hasBrand =
    isNonEmptyString(brand?.name) || isNonEmptyString(description) || normalizedSocial.length > 0

  const footerClassName = [BASE_CLASS, className].filter(Boolean).join(' ')

  return (
    <footer className={footerClassName} {...rest}>
      <div className={`${BASE_CLASS}__inner`}>
        {hasBrand ? (
          <section className={`${BASE_CLASS}__brand`}>
            {isNonEmptyString(brand?.name) ? (
              <div className={`${BASE_CLASS}__brand-heading`}>
                {isNonEmptyString(brand?.href) ? (
                  <a className={`${BASE_CLASS}__brand-link`} href={brand.href}>
                    {brand?.logo}
                    <span className={`${BASE_CLASS}__brand-name`}>{brand.name}</span>
                  </a>
                ) : (
                  <span className={`${BASE_CLASS}__brand-name`}>{brand.name}</span>
                )}
              </div>
            ) : null}
            {isNonEmptyString(description) ? (
              <p className={`${BASE_CLASS}__description`}>{description}</p>
            ) : null}
            {normalizedSocial.length > 0 ? (
              <ul className={`${BASE_CLASS}__social-list`} role="list">
                {normalizedSocial.map((link, index) => (
                  <li key={getLinkKey(link, index)} className={`${BASE_CLASS}__social-item`}>
                    <a
                      {...buildLinkProps(link, onNavigate, {
                        type: 'social',
                      })}
                      className={`${BASE_CLASS}__social-link`}
                      aria-label={link.description ?? link.label}
                    >
                      {link.icon ? (
                        <span className={`${BASE_CLASS}__social-icon`}>{link.icon}</span>
                      ) : (
                        <span className={`${BASE_CLASS}__social-text`}>{link.label}</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {normalizedSections.length > 0 ? (
          <div className={`${BASE_CLASS}__sections`}>
            {normalizedSections.map((section, index) => renderSection(section, index, onNavigate))}
          </div>
        ) : null}
      </div>

      {children ? <div className={`${BASE_CLASS}__extra`}>{children}</div> : null}

      <div className={`${BASE_CLASS}__meta`}>
        {renderLegal(legalLinks, onNavigate)}
        {isNonEmptyString(copyright) ? (
          <p className={`${BASE_CLASS}__copyright`}>
            <small>{copyright}</small>
          </p>
        ) : null}
      </div>
    </footer>
  )
}

export default Footer
