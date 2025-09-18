import { NavigationMenu } from '@guidogerb/components-menu'
import { useMemo } from 'react'
import { DEFAULT_HEADER_SETTINGS } from './settings.js'
import { useHeaderContext } from './useHeaderContext.js'

const BASE_CLASS = 'gg-header'

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const getActionKey = (action, index) => {
  if (isNonEmptyString(action?.id)) return action.id
  if (isNonEmptyString(action?.href)) return action.href
  if (isNonEmptyString(action?.label)) return `${index}:${action.label}`
  return `${index}`
}

const defaultRenderAction = ({ action }) => {
  if (!isNonEmptyString(action?.label) || !isNonEmptyString(action?.href)) return null
  const variant = ['primary', 'secondary', 'link'].includes(action?.variant)
    ? action.variant
    : 'link'

  const anchorProps = {
    className: `${BASE_CLASS}__action ${BASE_CLASS}__action--${variant}`,
    href: action.href,
    'data-variant': variant,
  }

  if (action.external) {
    anchorProps.target = '_blank'
    anchorProps.rel = 'noreferrer noopener'
  }

  return <a {...anchorProps}>{action.label}</a>
}

const defaultRenderAnnouncement = ({ announcement }) => {
  if (!isNonEmptyString(announcement?.message)) return null
  const tone = isNonEmptyString(announcement?.tone) ? announcement.tone : 'neutral'
  const content = isNonEmptyString(announcement?.href) ? (
    <a className={`${BASE_CLASS}__announcement-link`} href={announcement.href}>
      {announcement.message}
    </a>
  ) : (
    <span className={`${BASE_CLASS}__announcement-message`}>{announcement.message}</span>
  )

  return (
    <div className={`${BASE_CLASS}__announcement`} data-tone={tone}>
      {content}
    </div>
  )
}

const defaultRenderBrand = ({ brand }) => {
  const title = isNonEmptyString(brand?.title) ? brand.title : 'Guido & Gerber'
  const href = isNonEmptyString(brand?.href) ? brand.href : '#'
  const tagline = isNonEmptyString(brand?.tagline) ? brand.tagline : null
  const logoSrc = isNonEmptyString(brand?.logoSrc) ? brand.logoSrc : null

  return (
    <a className={`${BASE_CLASS}__brand-link`} href={href} aria-label={tagline ?? title}>
      {logoSrc ? <img className={`${BASE_CLASS}__brand-logo`} src={logoSrc} alt="" /> : null}
      <span className={`${BASE_CLASS}__brand-text`}>
        <span className={`${BASE_CLASS}__brand-title`}>{title}</span>
        {tagline ? <span className={`${BASE_CLASS}__brand-tagline`}>{tagline}</span> : null}
      </span>
    </a>
  )
}

/**
 * @param {{
 *   className?: string
 *   activePath?: string
 *   onNavigate?: (details: {
 *     item: import('./settings.js').HeaderNavItem
 *     event: Event
 *   }) => void
 *   primaryNavigationLabel?: string
 *   secondaryNavigationLabel?: string
 *   utilityNavigationLabel?: string
 *   announcementsLabel?: string
 *   renderAction?: (params: {
 *     action: import('./settings.js').HeaderAction
 *     index: number
 *   }) => import('react').ReactNode
 *   renderAnnouncement?: (params: {
 *     announcement: import('./settings.js').HeaderAnnouncement
 *     index: number
 *   }) => import('react').ReactNode
 *   renderBrand?: (params: {
 *     brand: import('./settings.js').HeaderBrand
 *   }) => import('react').ReactNode
 *   renderAuthControls?: (params: {
 *     settings: import('./settings.js').HeaderSettings
 *   }) => import('react').ReactNode
 *   renderTenantSwitcher?: (params: {
 *     settings: import('./settings.js').HeaderSettings
 *   }) => import('react').ReactNode
 *   renderThemeToggle?: (params: {
 *     settings: import('./settings.js').HeaderSettings
 *   }) => import('react').ReactNode
 * }} [props]
 */
export function Header({
  className,
  activePath,
  onNavigate,
  primaryNavigationLabel = 'Primary navigation',
  secondaryNavigationLabel = 'Secondary navigation',
  utilityNavigationLabel = 'Utility navigation',
  announcementsLabel = 'Announcements',
  renderAction = defaultRenderAction,
  renderAnnouncement = defaultRenderAnnouncement,
  renderBrand = defaultRenderBrand,
  renderAuthControls,
  renderTenantSwitcher,
  renderThemeToggle,
} = {}) {
  const context = useHeaderContext()
  const settings = context?.settings ?? DEFAULT_HEADER_SETTINGS

  const {
    brand,
    primaryLinks,
    secondaryLinks,
    utilityLinks,
    actions,
    announcements,
    showAuthControls,
    showTenantSwitcher,
    showThemeToggle,
  } = settings ?? {}

  const hasPrimaryLinks = Array.isArray(primaryLinks) && primaryLinks.length > 0
  const hasSecondaryLinks = Array.isArray(secondaryLinks) && secondaryLinks.length > 0
  const hasUtilityLinks = Array.isArray(utilityLinks) && utilityLinks.length > 0
  const hasActions = Array.isArray(actions) && actions.length > 0
  const hasAnnouncements = Array.isArray(announcements) && announcements.length > 0

  const headerClassName = useMemo(
    () =>
      [
        BASE_CLASS,
        hasAnnouncements ? `${BASE_CLASS}--has-announcements` : null,
        hasPrimaryLinks ? `${BASE_CLASS}--has-primary-nav` : null,
        hasSecondaryLinks ? `${BASE_CLASS}--has-secondary-nav` : null,
        hasUtilityLinks ? `${BASE_CLASS}--has-utility-nav` : null,
        hasActions ? `${BASE_CLASS}--has-actions` : null,
        showAuthControls ? `${BASE_CLASS}--show-auth-controls` : null,
        showTenantSwitcher ? `${BASE_CLASS}--show-tenant-switcher` : null,
        showThemeToggle ? `${BASE_CLASS}--show-theme-toggle` : null,
        className,
      ]
        .filter(Boolean)
        .join(' '),
    [
      className,
      hasActions,
      hasAnnouncements,
      hasPrimaryLinks,
      hasSecondaryLinks,
      hasUtilityLinks,
      showAuthControls,
      showTenantSwitcher,
      showThemeToggle,
    ],
  )

  return (
    <header
      className={headerClassName}
      data-show-auth-controls={Boolean(showAuthControls)}
      data-show-tenant-switcher={Boolean(showTenantSwitcher)}
      data-show-theme-toggle={Boolean(showThemeToggle)}
    >
      {hasAnnouncements ? (
        <section className={`${BASE_CLASS}__announcements`} aria-label={announcementsLabel}>
          <ul className={`${BASE_CLASS}__announcements-list`} role="list">
            {announcements.map((announcement, index) => {
              const key = isNonEmptyString(announcement?.id)
                ? announcement.id
                : `${announcement?.message ?? 'announcement'}:${index}`
              const rendered = renderAnnouncement({ announcement, index })
              if (!rendered) return null
              return (
                <li key={key} className={`${BASE_CLASS}__announcements-item`}>
                  {rendered}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <div className={`${BASE_CLASS}__bar`}>
        <div className={`${BASE_CLASS}__brand`}>{renderBrand({ brand: brand ?? {} })}</div>

        {hasUtilityLinks ? (
          <NavigationMenu
            className={`${BASE_CLASS}__utility-nav`}
            items={utilityLinks}
            orientation="horizontal"
            label={utilityNavigationLabel}
            activePath={activePath}
            onNavigate={onNavigate}
            listProps={{ className: `${BASE_CLASS}__utility-nav-list` }}
          />
        ) : null}

        <div className={`${BASE_CLASS}__controls`}>
          {showTenantSwitcher && typeof renderTenantSwitcher === 'function'
            ? renderTenantSwitcher({ settings })
            : null}
          {showThemeToggle && typeof renderThemeToggle === 'function'
            ? renderThemeToggle({ settings })
            : null}
          {showAuthControls && typeof renderAuthControls === 'function'
            ? renderAuthControls({ settings })
            : null}
          {hasActions ? (
            <ul className={`${BASE_CLASS}__actions`} role="list">
              {actions.map((action, index) => {
                const key = getActionKey(action, index)
                const rendered = renderAction({ action, index })
                if (!rendered) return null
                return (
                  <li key={key} className={`${BASE_CLASS}__actions-item`}>
                    {rendered}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </div>

      {hasPrimaryLinks ? (
        <NavigationMenu
          className={`${BASE_CLASS}__primary-nav`}
          items={primaryLinks}
          orientation="horizontal"
          label={primaryNavigationLabel}
          activePath={activePath}
          onNavigate={onNavigate}
        />
      ) : null}

      {hasSecondaryLinks ? (
        <NavigationMenu
          className={`${BASE_CLASS}__secondary-nav`}
          items={secondaryLinks}
          orientation="vertical"
          label={secondaryNavigationLabel}
          activePath={activePath}
          onNavigate={onNavigate}
        />
      ) : null}
    </header>
  )
}

export default Header
