const DEFAULT_RELEASE_CALENDAR_HREF = '/files/release-calendar.xlsx'
const DEFAULT_ROYALTY_TEMPLATE_HREF = '/files/royalty-report-sample.pdf'
const DEFAULT_OPERATIONS_EMAIL = 'partners@guidogerbpublishing.com'
const DEFAULT_OPERATIONS_EMAIL_SUBJECT = 'Catalog update request'

const env = import.meta.env ?? {}

const releaseCalendarHref =
  env.VITE_PARTNER_RESOURCES_RELEASE_CALENDAR_URL ?? DEFAULT_RELEASE_CALENDAR_HREF

const royaltyTemplateHref =
  env.VITE_PARTNER_RESOURCES_ROYALTY_TEMPLATE_URL ?? DEFAULT_ROYALTY_TEMPLATE_HREF

const operationsEmail =
  env.VITE_PARTNER_RESOURCES_OPERATIONS_EMAIL ?? DEFAULT_OPERATIONS_EMAIL

const operationsEmailSubject =
  env.VITE_PARTNER_RESOURCES_OPERATIONS_EMAIL_SUBJECT ?? DEFAULT_OPERATIONS_EMAIL_SUBJECT

function createMailtoHref(address, subject) {
  if (!address) return ''

  if (address.startsWith('mailto:')) {
    return address
  }

  const baseHref = `mailto:${address}`

  if (!subject) {
    return baseHref
  }

  const separator = baseHref.includes('?') ? '&' : '?'
  return `${baseHref}${separator}subject=${encodeURIComponent(subject)}`
}

const operationsEmailHref = createMailtoHref(operationsEmail, operationsEmailSubject)

export const partnerResources = {
  releaseCalendarHref,
  royaltyTemplateHref,
  operationsEmailHref,
}

export default partnerResources
