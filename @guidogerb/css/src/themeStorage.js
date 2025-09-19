export const CUSTOM_THEMES_STORAGE_KEY = 'gg:css:custom-themes'
export const SELECTED_THEME_STORAGE_KEY = 'gg:css:selected-theme'

const isBrowser = () => typeof window !== 'undefined'

const getLocalStorage = () => {
  if (!isBrowser()) return null
  try {
    return window.localStorage
  } catch (error) {
    return null
  }
}

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value)
  } catch (error) {
    return null
  }
}

const sanitizeStoredThemes = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const id = typeof entry.id === 'string' && entry.id.trim().length > 0 ? entry.id : null
      const name =
        typeof entry.name === 'string' && entry.name.trim().length > 0 ? entry.name : null
      if (!id && !name) return null
      const tokens = {}
      if (entry.tokens && typeof entry.tokens === 'object') {
        Object.entries(entry.tokens).forEach(([key, tokenValue]) => {
          if (tokenValue === null || tokenValue === undefined) return
          const valueAsString =
            typeof tokenValue === 'string'
              ? tokenValue
              : typeof tokenValue === 'number'
                ? String(tokenValue)
                : null
          if (!valueAsString) return
          const property = key.startsWith('--') ? key : `--${key}`
          tokens[property] = valueAsString
        })
      }
      return {
        id: id ?? name ?? null,
        name: name ?? id ?? 'Custom theme',
        tokens,
        isCustom: true,
        source: 'custom',
      }
    })
    .filter(Boolean)
}

const notifyServiceWorker = (payload) => {
  if (typeof navigator === 'undefined' || !navigator?.serviceWorker) return
  try {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'guidogerb:css-theme-update',
        payload,
      })
      return
    }
    const ready = navigator.serviceWorker.ready
    if (ready && typeof ready.then === 'function') {
      ready
        .then((registration) => {
          registration?.active?.postMessage({
            type: 'guidogerb:css-theme-update',
            payload,
          })
        })
        .catch(() => void 0)
    }
  } catch (error) {
    /* noop */
  }
}

export async function loadStoredThemes() {
  const storage = getLocalStorage()
  if (!storage) return []
  const raw = storage.getItem(CUSTOM_THEMES_STORAGE_KEY)
  if (!raw) return []
  const parsed = safeJsonParse(raw)
  return sanitizeStoredThemes(parsed)
}

export async function saveCustomThemes(themes) {
  const storage = getLocalStorage()
  if (!storage) return
  const payload = Array.isArray(themes)
    ? themes.map((theme) => ({
        id: theme?.id ?? null,
        name: theme?.name ?? null,
        tokens: theme?.tokens ?? {},
      }))
    : []
  try {
    storage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    return
  }
  notifyServiceWorker({ type: 'custom-themes', themes: payload })
}

export async function loadStoredThemeId() {
  const storage = getLocalStorage()
  if (!storage) return null
  const value = storage.getItem(SELECTED_THEME_STORAGE_KEY)
  if (typeof value !== 'string' || value.trim().length === 0) return null
  return value
}

export async function saveSelectedThemeId(themeId) {
  const storage = getLocalStorage()
  if (!storage) return
  if (typeof themeId !== 'string' || themeId.trim().length === 0) {
    storage.removeItem(SELECTED_THEME_STORAGE_KEY)
    notifyServiceWorker({ type: 'active-theme', themeId: null })
    return
  }
  try {
    storage.setItem(SELECTED_THEME_STORAGE_KEY, themeId)
  } catch (error) {
    return
  }
  notifyServiceWorker({ type: 'active-theme', themeId })
}
