let autoIdCounter = 0

const sanitizeName = (value, fallback) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  if (typeof fallback === 'string' && fallback.trim().length > 0) {
    return fallback.trim()
  }
  return 'Theme'
}

const slugify = (value) => {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function createThemeId(input, prefix = 'theme') {
  const slug = slugify(typeof input === 'string' ? input : '')
  if (slug.length > 0) return slug
  autoIdCounter += 1
  return `${prefix}-${autoIdCounter}`
}

const ensureUniqueId = (id, existingIds) => {
  if (!(existingIds instanceof Set)) return id
  if (!existingIds.has(id)) {
    existingIds.add(id)
    return id
  }
  let suffix = 2
  let candidate = `${id}-${suffix}`
  while (existingIds.has(candidate)) {
    suffix += 1
    candidate = `${id}-${suffix}`
  }
  existingIds.add(candidate)
  return candidate
}

const coerceTokens = (tokens, baseTokens = {}) => {
  const merged = { ...(baseTokens ?? {}), ...(tokens ?? {}) }
  const normalized = {}
  Object.entries(merged).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    const stringValue =
      typeof value === 'string' && value.trim().length > 0
        ? value
        : typeof value === 'number'
          ? String(value)
          : null
    if (!stringValue) return
    const property = key.startsWith('--') ? key : `--${key}`
    normalized[property] = stringValue
  })
  return normalized
}

export function normalizeThemeDefinition(definition, options = {}) {
  const {
    existingIds,
    fallbackName = 'Theme',
    fallbackId = 'theme',
    baseTokens = {},
    isCustom = false,
    source,
  } = options ?? {}

  const name = sanitizeName(definition?.name, fallbackName)
  const idSource = sanitizeName(definition?.id, name)
  const generatedId = createThemeId(idSource, fallbackId)
  const id = ensureUniqueId(generatedId, existingIds)

  const tokens = coerceTokens(definition?.tokens, baseTokens)

  return {
    id,
    name,
    tokens,
    isCustom: Boolean(isCustom ?? definition?.isCustom),
    source: source ?? definition?.source ?? (isCustom ? 'custom' : 'base'),
  }
}

export const DEFAULT_THEME_ID = 'midnight'

export const DEFAULT_THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    tokens: {
      '--color-bg': '#0b0c0f',
      '--color-surface': '#111318',
      '--color-text': '#e6e8ec',
      '--color-muted': '#a1a7b3',
      '--color-primary': '#3b82f6',
      '--color-primary-600': '#2563eb',
      '--color-success': '#22c55e',
      '--color-warning': '#f59e0b',
      '--color-danger': '#ef4444',
      '--space-0': '0',
      '--space-1': '4px',
      '--space-2': '8px',
      '--space-3': '12px',
      '--space-4': '16px',
      '--space-5': '20px',
      '--space-6': '24px',
      '--space-8': '32px',
      '--space-10': '40px',
      '--space-12': '48px',
      '--radius-1': '4px',
      '--radius-2': '8px',
      '--radius-round': '999px',
      '--shadow-1': '0 1px 2px rgba(0, 0, 0, 0.2)',
      '--shadow-2': '0 4px 12px rgba(0, 0, 0, 0.25)',
      '--font-sans':
        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
      '--font-mono':
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      '--text-sm': '0.875rem',
      '--text-base': '1rem',
      '--text-lg': '1.125rem',
      '--text-xl': '1.25rem',
    },
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    tokens: {
      '--color-bg': '#fdfcf7',
      '--color-surface': '#ffffff',
      '--color-text': '#1f2933',
      '--color-muted': '#52606d',
      '--color-primary': '#2563eb',
      '--color-primary-600': '#1d4ed8',
      '--color-success': '#16a34a',
      '--color-warning': '#ca8a04',
      '--color-danger': '#dc2626',
      '--space-0': '0',
      '--space-1': '4px',
      '--space-2': '8px',
      '--space-3': '12px',
      '--space-4': '16px',
      '--space-5': '20px',
      '--space-6': '24px',
      '--space-8': '32px',
      '--space-10': '40px',
      '--space-12': '48px',
      '--radius-1': '4px',
      '--radius-2': '8px',
      '--radius-round': '999px',
      '--shadow-1': '0 1px 2px rgba(15, 23, 42, 0.12)',
      '--shadow-2': '0 8px 24px rgba(15, 23, 42, 0.16)',
      '--font-sans':
        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
      '--font-mono':
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      '--text-sm': '0.875rem',
      '--text-base': '1rem',
      '--text-lg': '1.125rem',
      '--text-xl': '1.25rem',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    tokens: {
      '--color-bg': '#0f172a',
      '--color-surface': '#11213c',
      '--color-text': '#e0f2f1',
      '--color-muted': '#81aab5',
      '--color-primary': '#10b981',
      '--color-primary-600': '#059669',
      '--color-success': '#22c55e',
      '--color-warning': '#fbbf24',
      '--color-danger': '#f87171',
      '--space-0': '0',
      '--space-1': '4px',
      '--space-2': '8px',
      '--space-3': '12px',
      '--space-4': '16px',
      '--space-5': '20px',
      '--space-6': '24px',
      '--space-8': '32px',
      '--space-10': '40px',
      '--space-12': '48px',
      '--radius-1': '4px',
      '--radius-2': '8px',
      '--radius-round': '999px',
      '--shadow-1': '0 1px 2px rgba(10, 29, 49, 0.3)',
      '--shadow-2': '0 8px 24px rgba(8, 47, 73, 0.35)',
      '--font-sans':
        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
      '--font-mono':
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      '--text-sm': '0.875rem',
      '--text-base': '1rem',
      '--text-lg': '1.125rem',
      '--text-xl': '1.25rem',
    },
  },
]

export default DEFAULT_THEMES
