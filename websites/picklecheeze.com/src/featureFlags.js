const TRUE_VALUES = new Set(['true', '1', 'yes', 'on'])
const FALSE_VALUES = new Set(['false', '0', 'no', 'off'])

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (TRUE_VALUES.has(normalized)) return true
    if (FALSE_VALUES.has(normalized)) return false
  }

  return undefined
}

export function getPartnerFeatureFlags(env = import.meta.env) {
  const source = env ?? {}

  const inventory = parseBoolean(source?.VITE_FLAG_PARTNER_INVENTORY)
  const careGuide = parseBoolean(source?.VITE_FLAG_PARTNER_CARE_GUIDE)
  const contactEmail = parseBoolean(source?.VITE_FLAG_PARTNER_CONTACT_EMAIL)

  return {
    showInventoryDownload: inventory ?? true,
    showCareGuide: careGuide ?? true,
    showContactEmail: contactEmail ?? true,
  }
}
