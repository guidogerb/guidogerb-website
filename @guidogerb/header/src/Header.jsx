import { NavigationMenu } from '@guidogerb/components-menu'
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { DEFAULT_HEADER_SETTINGS } from './settings.js'
import { useHeaderContext } from './useHeaderContext.js'

const BASE_CLASS = 'gg-header'
const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled])'

const defer = (fn) => {
  if (typeof fn !== 'function') return
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(fn)
    return
  }

  Promise.resolve()
    .then(fn)
    .catch(() => {
      /* noop */
    })
}

const getFocusableElements = (container) => {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.hasAttribute('disabled')) return false
    if (element.getAttribute('aria-hidden') === 'true') return false
    return typeof element.focus === 'function'
  })
}

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
 *   mobileNavigationLabel?: string
 *   mobileMenuButtonLabel?: string
 *   mobileMenuAriaLabel?: string
 *   mobileMenuCloseLabel?: string
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
  mobileNavigationLabel = 'Mobile navigation',
  mobileMenuButtonLabel = 'Menu',
  mobileMenuAriaLabel = 'Open navigation menu',
  mobileMenuCloseLabel = 'Close menu',
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
  const hasMobileNavigation =
    hasPrimaryLinks || hasSecondaryLinks || hasUtilityLinks || hasActions

  const mobileMenuId = useId()
  const mobileMenuRef = useRef(null)
  const mobileToggleRef = useRef(null)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const isMobileNavOpenRef = useRef(isMobileNavOpen)

  useEffect(() => {
    isMobileNavOpenRef.current = isMobileNavOpen
  }, [isMobileNavOpen])

  const focusToggleButton = useCallback(() => {
    const toggle = mobileToggleRef.current
    if (toggle && typeof toggle.focus === 'function') {
      toggle.focus({ preventScroll: true })
    }
  }, [])

  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen((prev) => {
      if (!prev) return prev
      defer(focusToggleButton)
      return false
    })
  }, [focusToggleButton])

  const handleMobileToggle = useCallback(() => {
    setIsMobileNavOpen((prev) => {
      const next = !prev
      if (!next) {
        defer(focusToggleButton)
      }
      return next
    })
  }, [focusToggleButton])

  const focusTrapHandler = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMobileNav()
        return
      }

      if (event.key !== 'Tab') return

      const container = mobileMenuRef.current
      if (!container) return

      const focusable = getFocusableElements(container)
      if (focusable.length === 0) {
        event.preventDefault()
        if (typeof container.focus === 'function') {
          container.focus({ preventScroll: true })
        }
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = typeof document !== 'undefined' ? document.activeElement : null

      if (event.shiftKey) {
        if (!container.contains(active) || active === first) {
          event.preventDefault()
          last.focus({ preventScroll: true })
        }
        return
      }

      if (!container.contains(active) || active === last) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    },
    [closeMobileNav],
  )

  useEffect(() => {
    if (!isMobileNavOpen) return undefined
    const container = mobileMenuRef.current
    if (!container) return undefined

    container.addEventListener('keydown', focusTrapHandler)

    let restoreOverflow
    if (typeof document !== 'undefined') {
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      restoreOverflow = () => {
        document.body.style.overflow = previousOverflow
      }
    }

    defer(() => {
      const focusable = getFocusableElements(container)
      const target = focusable[0] ?? container
      if (typeof target?.focus === 'function') {
        target.focus({ preventScroll: true })
      }
    })

    return () => {
      container.removeEventListener('keydown', focusTrapHandler)
      if (typeof restoreOverflow === 'function') {
        try {
          restoreOverflow()
        } catch (error) {
          /* noop */
        }
      }
    }
  }, [focusTrapHandler, isMobileNavOpen])

  const handleNavigate = useCallback(
    (payload) => {
      if (typeof onNavigate === 'function') {
        onNavigate(payload)
      }
      if (isMobileNavOpenRef.current) {
        closeMobileNav()
      }
    },
    [closeMobileNav, onNavigate],
  )

  const shouldHandleNavigation = isMobileNavOpen || typeof onNavigate === 'function'
  const navigationHandler = shouldHandleNavigation ? handleNavigate : undefined

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

  const renderActionsList = useCallback(
    (actionList, { className: actionsClassName, itemClassName, onAction } = {}) => {
      if (!Array.isArray(actionList) || actionList.length === 0) return null

      const listClassName = actionsClassName ?? `${BASE_CLASS}__actions`
      const listItemClassName = itemClassName ?? `${BASE_CLASS}__actions-item`

      return (
        <ul className={listClassName} role="list">
          {actionList.map((action, index) => {
            const key = getActionKey(action, index)
            const rendered = renderAction({ action, index })
            if (!rendered) return null

            if (onAction && isValidElement(rendered)) {
              const originalOnClick = rendered.props?.onClick
              return (
                <li key={key} className={listItemClassName}>
                  {cloneElement(rendered, {
                    onClick: (event) => {
                      if (typeof originalOnClick === 'function') {
                        originalOnClick(event)
                      }
                      if (!event?.defaultPrevented) {
                        onAction(action, event)
                      }
                    },
                  })}
                </li>
              )
            }

            return (
              <li key={key} className={listItemClassName}>
                {rendered}
              </li>
            )
          })}
        </ul>
      )
    },
    [renderAction],
  )

  const mobileToggleAriaLabel = isMobileNavOpen ? mobileMenuCloseLabel : mobileMenuAriaLabel
  const mobileMenuButtonText = isMobileNavOpen ? mobileMenuCloseLabel : mobileMenuButtonLabel

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

        {hasMobileNavigation ? (
          <div className={`${BASE_CLASS}__mobile-toggle-container`}>
            <button
              type="button"
              className={`${BASE_CLASS}__mobile-toggle`}
              aria-expanded={isMobileNavOpen}
              aria-controls={mobileMenuId}
              aria-label={mobileToggleAriaLabel}
              onClick={handleMobileToggle}
              ref={mobileToggleRef}
            >
              {mobileMenuButtonText}
            </button>
          </div>
        ) : null}

        {hasUtilityLinks ? (
          <NavigationMenu
            className={`${BASE_CLASS}__utility-nav`}
            items={utilityLinks}
            orientation="horizontal"
            label={utilityNavigationLabel}
            activePath={activePath}
            onNavigate={navigationHandler}
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
          {hasActions ? renderActionsList(actions) : null}
        </div>
      </div>

      {hasPrimaryLinks ? (
        <NavigationMenu
          className={`${BASE_CLASS}__primary-nav`}
          items={primaryLinks}
          orientation="horizontal"
          label={primaryNavigationLabel}
          activePath={activePath}
          onNavigate={navigationHandler}
        />
      ) : null}

      {hasSecondaryLinks ? (
        <NavigationMenu
          className={`${BASE_CLASS}__secondary-nav`}
          items={secondaryLinks}
          orientation="vertical"
          label={secondaryNavigationLabel}
          activePath={activePath}
          onNavigate={navigationHandler}
        />
      ) : null}

      {hasMobileNavigation ? (
        <>
          <div
            className={`${BASE_CLASS}__mobile-backdrop`}
            data-open={isMobileNavOpen ? 'true' : 'false'}
            hidden={!isMobileNavOpen}
            onClick={closeMobileNav}
          />
          <div
            id={mobileMenuId}
            ref={mobileMenuRef}
            className={`${BASE_CLASS}__mobile-panel`}
            role="dialog"
            aria-modal="true"
            aria-label={mobileNavigationLabel}
            hidden={!isMobileNavOpen}
            tabIndex={-1}
          >
            <div className={`${BASE_CLASS}__mobile-header`}>
              <span className={`${BASE_CLASS}__mobile-title`}>{mobileNavigationLabel}</span>
              <button
                type="button"
                className={`${BASE_CLASS}__mobile-close`}
                onClick={closeMobileNav}
                aria-label={mobileMenuCloseLabel}
              >
                {mobileMenuCloseLabel}
              </button>
            </div>
            <div className={`${BASE_CLASS}__mobile-content`}>
              {hasPrimaryLinks ? (
                <NavigationMenu
                  className={`${BASE_CLASS}__mobile-primary-nav`}
                  items={primaryLinks}
                  orientation="vertical"
                  label={primaryNavigationLabel}
                  activePath={activePath}
                  onNavigate={handleNavigate}
                />
              ) : null}

              {hasSecondaryLinks ? (
                <NavigationMenu
                  className={`${BASE_CLASS}__mobile-secondary-nav`}
                  items={secondaryLinks}
                  orientation="vertical"
                  label={secondaryNavigationLabel}
                  activePath={activePath}
                  onNavigate={handleNavigate}
                />
              ) : null}

              {hasUtilityLinks ? (
                <NavigationMenu
                  className={`${BASE_CLASS}__mobile-utility-nav`}
                  items={utilityLinks}
                  orientation="vertical"
                  label={utilityNavigationLabel}
                  activePath={activePath}
                  onNavigate={handleNavigate}
                />
              ) : null}

              {hasActions
                ? renderActionsList(actions, {
                    className: `${BASE_CLASS}__mobile-actions`,
                    itemClassName: `${BASE_CLASS}__mobile-actions-item`,
                    onAction: () => {
                      closeMobileNav()
                    },
                  })
                : null}
            </div>
          </div>
        </>
      ) : null}
    </header>
  )
}

export default Header
