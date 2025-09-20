const DEFAULT_STAGE_PLOT_HREF = '/files/stage-plot.pdf'
const DEFAULT_REHEARSAL_CHECKLIST_HREF = '/files/rehearsal-checklist.pdf'
const DEFAULT_PRODUCTION_EMAIL = 'hello@garygerber.com'
const DEFAULT_PRODUCTION_EMAIL_SUBJECT = 'Collaboration Notes'

const env = import.meta.env ?? {}

const stagePlotHref = env.VITE_REHEARSAL_RESOURCES_STAGE_PLOT_URL ?? DEFAULT_STAGE_PLOT_HREF

const rehearsalChecklistHref =
  env.VITE_REHEARSAL_RESOURCES_CHECKLIST_URL ?? DEFAULT_REHEARSAL_CHECKLIST_HREF

const productionEmail = env.VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL ?? DEFAULT_PRODUCTION_EMAIL

const productionEmailSubject =
  env.VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL_SUBJECT ?? DEFAULT_PRODUCTION_EMAIL_SUBJECT

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

const productionEmailHref = createMailtoHref(productionEmail, productionEmailSubject)

export const rehearsalResources = {
  stagePlotHref,
  rehearsalChecklistHref,
  productionEmailHref,
}

export default rehearsalResources
