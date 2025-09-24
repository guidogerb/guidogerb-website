const sanitizeColorValue = (value) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const THEME_COLOR_FIELDS = [
  { key: '--color-bg', name: 'colorBg', label: 'Background color', default: '#0b0c0f' },
  { key: '--color-surface', name: 'colorSurface', label: 'Surface color', default: '#111318' },
  { key: '--color-text', name: 'colorText', label: 'Text color', default: '#e6e8ec' },
  { key: '--color-muted', name: 'colorMuted', label: 'Muted text color', default: '#a1a7b3' },
  { key: '--color-primary', name: 'colorPrimary', label: 'Primary color', default: '#3b82f6' },
  {
    key: '--color-primary-600',
    name: 'colorPrimaryStrong',
    label: 'Primary (emphasis) color',
    default: '#2563eb',
  },
  { key: '--color-success', name: 'colorSuccess', label: 'Success color', default: '#22c55e' },
  { key: '--color-warning', name: 'colorWarning', label: 'Warning color', default: '#f59e0b' },
  { key: '--color-danger', name: 'colorDanger', label: 'Danger color', default: '#ef4444' },
]

export const buildColorFormState = (tokens = {}) => {
  const state = {}
  THEME_COLOR_FIELDS.forEach((field) => {
    const tokenValue = sanitizeColorValue(tokens[field.key])
    state[field.name] = tokenValue ?? field.default
  })
  return state
}

export const extractTokensFromState = (state = {}) => {
  const tokens = {}
  THEME_COLOR_FIELDS.forEach((field) => {
    const value = sanitizeColorValue(state[field.name])
    if (value) {
      tokens[field.key] = value
    }
  })
  return tokens
}

export { sanitizeColorValue }
