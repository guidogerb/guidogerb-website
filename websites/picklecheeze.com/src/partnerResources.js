const DEFAULT_INVENTORY_HREF = '/files/picklecheeze-cellar-inventory.pdf'
const DEFAULT_CARE_GUIDE_HREF = '/files/cheese-care-guide.pdf'
const DEFAULT_CONTACT_EMAIL = 'partners@picklecheeze.com'
const DEFAULT_CONTACT_EMAIL_SUBJECT = 'Partner portal question'

const RESOURCE_DEFINITIONS = [
  {
    id: 'inventory',
    label: 'Download current cellar inventory',
    featureFlag: 'showInventoryDownload',
    resolveHref(source) {
      return source?.VITE_PARTNER_RESOURCES_INVENTORY_URL ?? DEFAULT_INVENTORY_HREF
    },
  },
  {
    id: 'care-guide',
    label: 'Cheeze care & plating guide',
    featureFlag: 'showCareGuide',
    resolveHref(source) {
      return source?.VITE_PARTNER_RESOURCES_CARE_GUIDE_URL ?? DEFAULT_CARE_GUIDE_HREF
    },
  },
  {
    id: 'contact-email',
    label: 'Email the fermentation team',
    featureFlag: 'showContactEmail',
    resolveHref(source) {
      const email = source?.VITE_PARTNER_RESOURCES_CONTACT_EMAIL ?? DEFAULT_CONTACT_EMAIL
      const subject =
        source?.VITE_PARTNER_RESOURCES_CONTACT_EMAIL_SUBJECT ?? DEFAULT_CONTACT_EMAIL_SUBJECT

      return createMailtoHref(email, subject)
    },
  },
]

function createMailtoHref(address, subject) {
  if (!address) return ''

  if (address.startsWith('mailto:')) {
    return subject ? appendSubject(address, subject) : address
  }

  const baseHref = `mailto:${address}`
  return subject ? appendSubject(baseHref, subject) : baseHref
}

function appendSubject(href, subject) {
  if (!subject) {
    return href
  }

  const separator = href.includes('?') ? '&' : '?'
  return `${href}${separator}subject=${encodeURIComponent(subject)}`
}

export function getPartnerResourceLinks(features = {}, env = import.meta.env) {
  const source = env ?? {}

  return RESOURCE_DEFINITIONS.reduce((links, definition) => {
    const isEnabled = definition.featureFlag ? (features?.[definition.featureFlag] ?? true) : true

    if (!isEnabled) {
      return links
    }

    const href = definition.resolveHref(source)
    if (!href) {
      return links
    }

    links.push({
      href,
      label: definition.label,
      id: definition.id,
    })

    return links
  }, [])
}

export default getPartnerResourceLinks
