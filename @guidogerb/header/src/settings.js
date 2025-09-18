/**
 * @typedef {Object} HeaderBrand
 * @property {string} title
 * @property {string} href
 * @property {string} [tagline]
 * @property {string | null} [logoSrc]
 */

/**
 * @typedef {Object} HeaderNavItem
 * @property {string} label
 * @property {string} href
 * @property {boolean} [external]
 * @property {string} [description]
 * @property {HeaderNavItem[]} [children]
 */

/**
 * @typedef {Object} HeaderAction
 * @property {string} label
 * @property {string} href
 * @property {('primary' | 'secondary' | 'link')} [variant]
 * @property {boolean} [external]
 */

/**
 * @typedef {Object} HeaderAnnouncement
 * @property {string} id
 * @property {string} message
 * @property {string} [href]
 * @property {'info' | 'warning' | 'success' | 'neutral' | 'highlight'} [tone]
 */

/**
 * @typedef {Object} HeaderI18n
 * @property {string} locale
 * @property {string} currency
 * @property {string} timezone
 */

/**
 * @typedef {Object} HeaderSettings
 * @property {HeaderBrand} brand
 * @property {HeaderNavItem[]} primaryLinks
 * @property {HeaderNavItem[]} secondaryLinks
 * @property {HeaderNavItem[]} utilityLinks
 * @property {HeaderAction[]} actions
 * @property {HeaderAnnouncement[]} announcements
 * @property {HeaderI18n} i18n
 * @property {boolean} showAuthControls
 * @property {boolean} showTenantSwitcher
 * @property {boolean} showThemeToggle
 */

const NAV_VARIANT_DEFAULT = 'link'
const ANNOUNCEMENT_TONES = new Set(['info', 'warning', 'success', 'neutral', 'highlight'])

/** @type {HeaderSettings} */
const DEFAULT_HEADER_SETTINGS = Object.freeze({
  brand: Object.freeze({
    title: 'Guido & Gerber',
    tagline: 'Multi-tenant publishing',
    href: '/',
    logoSrc: null,
  }),
  primaryLinks: Object.freeze([]),
  secondaryLinks: Object.freeze([]),
  utilityLinks: Object.freeze([]),
  actions: Object.freeze([]),
  announcements: Object.freeze([]),
  i18n: Object.freeze({
    locale: 'en-US',
    currency: 'USD',
    timezone: 'America/Chicago',
  }),
  showAuthControls: true,
  showTenantSwitcher: false,
  showThemeToggle: true,
})

/** @type {HeaderSettings} */
let headerSettings = cloneSettings(DEFAULT_HEADER_SETTINGS)

/**
 * Returns a deeply cloned copy of the provided settings object.
 * @param {HeaderSettings} settings
 * @returns {HeaderSettings}
 */
function cloneSettings(settings) {
  return {
    brand: { ...settings.brand },
    primaryLinks: cloneNavItems(settings.primaryLinks),
    secondaryLinks: cloneNavItems(settings.secondaryLinks),
    utilityLinks: cloneNavItems(settings.utilityLinks),
    actions: cloneActions(settings.actions),
    announcements: cloneAnnouncements(settings.announcements),
    i18n: { ...settings.i18n },
    showAuthControls: settings.showAuthControls,
    showTenantSwitcher: settings.showTenantSwitcher,
    showThemeToggle: settings.showThemeToggle,
  }
}

/**
 * @param {HeaderNavItem[]} items
 * @returns {HeaderNavItem[]}
 */
function cloneNavItems(items) {
  return items.map((item) => ({
    ...item,
    children: cloneNavItems(item.children ?? []),
  }))
}

/**
 * @param {HeaderAction[]} actions
 * @returns {HeaderAction[]}
 */
function cloneActions(actions) {
  return actions.map((action) => ({ ...action }))
}

/**
 * @param {HeaderAnnouncement[]} announcements
 * @returns {HeaderAnnouncement[]}
 */
function cloneAnnouncements(announcements) {
  return announcements.map((announcement) => ({ ...announcement }))
}

/**
 * Normalizes a possibly partial settings object to the canonical structure.
 * @param {Partial<HeaderSettings> | undefined | null} partial
 * @param {HeaderSettings | undefined} [base]
 * @returns {HeaderSettings}
 */
function normalizeSettings(partial, base) {
  const fallback = isObject(base) ? base : DEFAULT_HEADER_SETTINGS
  const value = isObject(partial) ? partial : {}

  return {
    brand: normalizeBrand(value.brand, fallback.brand),
    primaryLinks: normalizeNavCollection(value.primaryLinks, fallback.primaryLinks),
    secondaryLinks: normalizeNavCollection(value.secondaryLinks, fallback.secondaryLinks),
    utilityLinks: normalizeNavCollection(value.utilityLinks, fallback.utilityLinks),
    actions: normalizeActionCollection(value.actions, fallback.actions),
    announcements: normalizeAnnouncementCollection(value.announcements, fallback.announcements),
    i18n: normalizeI18n(value.i18n, fallback.i18n),
    showAuthControls: normalizeBoolean(value.showAuthControls, fallback.showAuthControls),
    showTenantSwitcher: normalizeBoolean(value.showTenantSwitcher, fallback.showTenantSwitcher),
    showThemeToggle: normalizeBoolean(value.showThemeToggle, fallback.showThemeToggle),
  }
}

/**
 * @param {unknown} maybeObject
 * @returns {maybeObject is Record<string, unknown>}
 */
function isObject(maybeObject) {
  return typeof maybeObject === 'object' && maybeObject !== null
}

/**
 * @param {HeaderBrand | undefined | null} brand
 * @param {HeaderBrand | undefined | null} fallback
 * @returns {HeaderBrand}
 */
function normalizeBrand(brand, fallback) {
  const fallbackBrand = isObject(fallback) ? fallback : DEFAULT_HEADER_SETTINGS.brand
  const value = isObject(brand) ? brand : {}
  const merged = { ...fallbackBrand, ...value }

  return {
    title:
      typeof merged.title === 'string' && merged.title.trim().length > 0
        ? merged.title
        : fallbackBrand.title,
    href:
      typeof merged.href === 'string' && merged.href.trim().length > 0
        ? merged.href
        : fallbackBrand.href,
    tagline:
      typeof merged.tagline === 'string'
        ? merged.tagline
        : typeof fallbackBrand.tagline === 'string'
          ? fallbackBrand.tagline
          : DEFAULT_HEADER_SETTINGS.brand.tagline,
    logoSrc: merged.logoSrc ?? null,
  }
}

/**
 * @param {HeaderNavItem[] | undefined | null} collection
 * @param {HeaderNavItem[] | undefined | null} fallback
 * @returns {HeaderNavItem[]}
 */
function normalizeNavCollection(collection, fallback) {
  const fallbackItems = Array.isArray(fallback) ? fallback : []
  const source = Array.isArray(collection) ? collection : fallbackItems
  return source.map((item, index) => normalizeNavItem(item, fallbackItems[index]))
}

/**
 * @param {HeaderNavItem | undefined | null} item
 * @param {HeaderNavItem | undefined | null} fallback
 * @returns {HeaderNavItem}
 */
function normalizeNavItem(item, fallback) {
  const fallbackItem = isObject(fallback) ? fallback : {}
  const value = isObject(item) ? item : {}
  const merged = { ...fallbackItem, ...value }
  const { children, label, href, external, description, ...rest } = merged
  const childSource = Array.isArray(value.children)
    ? value.children
    : Array.isArray(fallbackItem.children)
      ? fallbackItem.children
      : []

  return {
    ...rest,
    label: typeof label === 'string' ? label : '',
    href: typeof href === 'string' && href.length > 0 ? href : '#',
    external: Boolean(external),
    description:
      typeof description === 'string'
        ? description
        : typeof fallbackItem.description === 'string'
          ? fallbackItem.description
          : undefined,
    children: normalizeNavCollection(childSource, fallbackItem.children),
  }
}

/**
 * @param {HeaderAction[] | undefined | null} collection
 * @param {HeaderAction[] | undefined | null} fallback
 * @returns {HeaderAction[]}
 */
function normalizeActionCollection(collection, fallback) {
  const fallbackActions = Array.isArray(fallback) ? fallback : []
  const source = Array.isArray(collection) ? collection : fallbackActions
  return source.map((action, index) => normalizeAction(action, fallbackActions[index]))
}

/**
 * @param {HeaderAction | undefined | null} action
 * @param {HeaderAction | undefined | null} fallback
 * @returns {HeaderAction}
 */
function normalizeAction(action, fallback) {
  const fallbackAction = isObject(fallback) ? fallback : {}
  const value = isObject(action) ? action : {}
  const merged = { ...fallbackAction, ...value }
  const { label, href, variant, external, ...rest } = merged
  const resolvedVariant =
    variant === 'primary' || variant === 'secondary' || variant === 'link'
      ? variant
      : fallbackAction.variant === 'primary' ||
          fallbackAction.variant === 'secondary' ||
          fallbackAction.variant === 'link'
        ? fallbackAction.variant
        : NAV_VARIANT_DEFAULT

  return {
    ...rest,
    label: typeof label === 'string' ? label : '',
    href: typeof href === 'string' && href.length > 0 ? href : '#',
    external: Boolean(external),
    variant: resolvedVariant,
  }
}

/**
 * @param {HeaderAnnouncement[] | undefined | null} collection
 * @param {HeaderAnnouncement[] | undefined | null} fallback
 * @returns {HeaderAnnouncement[]}
 */
function normalizeAnnouncementCollection(collection, fallback) {
  const fallbackAnnouncements = Array.isArray(fallback) ? fallback : []
  const source = Array.isArray(collection) ? collection : fallbackAnnouncements
  return source.map((announcement, index) =>
    normalizeAnnouncement(announcement, index, fallbackAnnouncements[index]),
  )
}

/**
 * @param {HeaderAnnouncement | undefined | null} announcement
 * @param {number} index
 * @param {HeaderAnnouncement | undefined | null} fallback
 * @returns {HeaderAnnouncement}
 */
function normalizeAnnouncement(announcement, index, fallback) {
  const fallbackAnnouncement = isObject(fallback) ? fallback : {}
  const value = isObject(announcement) ? announcement : {}
  const merged = { ...fallbackAnnouncement, ...value }
  const { id, message, href, tone, ...rest } = merged

  return {
    ...rest,
    id:
      typeof id === 'string' && id.trim().length > 0
        ? id
        : typeof fallbackAnnouncement.id === 'string' && fallbackAnnouncement.id.trim().length > 0
          ? fallbackAnnouncement.id
          : `announcement-${index}`,
    message:
      typeof message === 'string' && message.length > 0
        ? message
        : typeof fallbackAnnouncement.message === 'string'
          ? fallbackAnnouncement.message
          : '',
    href:
      typeof href === 'string' && href.length > 0
        ? href
        : typeof fallbackAnnouncement.href === 'string'
          ? fallbackAnnouncement.href
          : undefined,
    tone: ANNOUNCEMENT_TONES.has(tone)
      ? /** @type {'info' | 'warning' | 'success' | 'neutral' | 'highlight'} */ (tone)
      : ANNOUNCEMENT_TONES.has(fallbackAnnouncement.tone)
        ? /** @type {'info' | 'warning' | 'success' | 'neutral' | 'highlight'} */ (
            fallbackAnnouncement.tone
          )
        : 'info',
  }
}

/**
 * @param {HeaderI18n | undefined | null} i18n
 * @param {HeaderI18n | undefined | null} fallback
 * @returns {HeaderI18n}
 */
function normalizeI18n(i18n, fallback) {
  const fallbackI18n = isObject(fallback) ? fallback : DEFAULT_HEADER_SETTINGS.i18n
  const value = isObject(i18n) ? i18n : {}
  const merged = { ...fallbackI18n, ...value }

  return {
    locale:
      typeof merged.locale === 'string' && merged.locale.length > 0
        ? merged.locale
        : fallbackI18n.locale,
    currency:
      typeof merged.currency === 'string' && merged.currency.length > 0
        ? merged.currency
        : fallbackI18n.currency,
    timezone:
      typeof merged.timezone === 'string' && merged.timezone.length > 0
        ? merged.timezone
        : fallbackI18n.timezone,
  }
}

/**
 * @param {unknown} value
 * @param {boolean} fallback
 * @returns {boolean}
 */
function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback
}

/**
 * Returns the default header configuration.
 * @returns {HeaderSettings}
 */
export function getDefaultHeaderSettings() {
  return cloneSettings(DEFAULT_HEADER_SETTINGS)
}

/**
 * Returns the current header configuration.
 * @returns {HeaderSettings}
 */
export function getHeaderSettings() {
  return cloneSettings(headerSettings)
}

/**
 * Resets the global settings to their defaults.
 * @returns {HeaderSettings}
 */
export function resetHeaderSettings() {
  headerSettings = cloneSettings(DEFAULT_HEADER_SETTINGS)
  return getHeaderSettings()
}

/**
 * Applies a partial update to the global settings store.
 * @param {Partial<HeaderSettings> | HeaderSettings} nextSettings
 * @returns {HeaderSettings}
 */
export function setHeaderSettings(nextSettings) {
  headerSettings = normalizeSettings(nextSettings, headerSettings)
  return getHeaderSettings()
}

/**
 * Updates the global settings using an updater function.
 * @param {(current: HeaderSettings) => Partial<HeaderSettings> | HeaderSettings} updater
 * @returns {HeaderSettings}
 */
export function updateHeaderSettings(updater) {
  if (typeof updater !== 'function') {
    return setHeaderSettings(/** @type {Partial<HeaderSettings>} */ (updater))
  }

  const draft = updater(getHeaderSettings())
  return setHeaderSettings(draft)
}

/**
 * Creates a normalized settings object by merging overrides with the provided base configuration.
 * @param {Partial<HeaderSettings>} [overrides]
 * @param {HeaderSettings} [base]
 * @returns {HeaderSettings}
 */
export function createHeaderSettings(overrides = {}, base = getHeaderSettings()) {
  const fallback = normalizeSettings(base, getHeaderSettings())
  return normalizeSettings(overrides, fallback)
}

export { DEFAULT_HEADER_SETTINGS }
