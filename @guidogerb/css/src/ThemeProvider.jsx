import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ThemeContext } from './ThemeContext.js'
import {
  DEFAULT_THEME_ID,
  DEFAULT_THEMES,
  createThemeId,
  normalizeThemeDefinition,
} from './themes.js'
import {
  CUSTOM_THEMES_STORAGE_KEY,
  SELECTED_THEME_STORAGE_KEY,
  loadStoredThemeId,
  loadStoredThemes,
  saveCustomThemes,
  saveSelectedThemeId,
} from './themeStorage.js'

const applyThemeToDocument = (theme) => {
  if (typeof document === 'undefined' || !theme) return () => {}
  const root = document.documentElement
  const previousValues = new Map()

  Object.entries(theme.tokens ?? {}).forEach(([property, value]) => {
    previousValues.set(property, root.style.getPropertyValue(property))
    root.style.setProperty(property, value)
  })

  root.setAttribute('data-theme', theme.id)

  return () => {
    previousValues.forEach((value, property) => {
      if (value && value.trim().length > 0) {
        root.style.setProperty(property, value)
      } else {
        root.style.removeProperty(property)
      }
    })
    if (root.getAttribute('data-theme') === theme.id) {
      root.removeAttribute('data-theme')
    }
  }
}

const coerceThemesArray = (themes) => (Array.isArray(themes) && themes.length > 0 ? themes : DEFAULT_THEMES)

/**
 * Provides theme state, helpers, and persistence for Guido & Gerber web apps.
 */
export function ThemeProvider({
  children,
  themes = DEFAULT_THEMES,
  defaultThemeId = DEFAULT_THEME_ID,
  initialThemeId,
  onThemeChange,
} = {}) {
  const normalizedBaseThemes = useMemo(() => {
    const inputThemes = coerceThemesArray(themes)
    const seen = new Set()
    let fallbackTokens = null
    return inputThemes.map((theme, index) => {
      const normalized = normalizeThemeDefinition(theme ?? {}, {
        existingIds: seen,
        fallbackName: `Theme ${index + 1}`,
        fallbackId: `theme-${index + 1}`,
        baseTokens: fallbackTokens ?? theme?.tokens ?? {},
        isCustom: false,
        source: 'base',
      })
      if (!fallbackTokens) {
        fallbackTokens = normalized.tokens
      }
      return normalized
    })
  }, [themes])

  const defaultBaseTokens = useMemo(() => {
    const explicitDefault = normalizedBaseThemes.find((theme) => theme.id === defaultThemeId)
    return explicitDefault?.tokens ?? normalizedBaseThemes[0]?.tokens ?? {}
  }, [normalizedBaseThemes, defaultThemeId])

  const [customThemes, setCustomThemes] = useState([])
  const [hasHydratedSelection, setHasHydratedSelection] = useState(false)
  const [activeThemeIdState, setActiveThemeIdState] = useState(() =>
    typeof initialThemeId === 'string' && initialThemeId.trim().length > 0
      ? initialThemeId
      : typeof defaultThemeId === 'string' && defaultThemeId.trim().length > 0
        ? defaultThemeId
        : DEFAULT_THEME_ID,
  )

  const sortedCustomThemes = useMemo(
    () =>
      [...customThemes].sort((a, b) =>
        (a?.name ?? '').localeCompare(b?.name ?? '', undefined, { sensitivity: 'base' }),
      ),
    [customThemes],
  )

  const allThemes = useMemo(
    () => [...normalizedBaseThemes, ...sortedCustomThemes],
    [normalizedBaseThemes, sortedCustomThemes],
  )

  const themesById = useMemo(() => {
    const map = new Map()
    allThemes.forEach((theme) => {
      if (theme?.id) {
        map.set(theme.id, theme)
      }
    })
    return map
  }, [allThemes])

  const resolvedActiveTheme =
    themesById.get(activeThemeIdState) ??
    themesById.get(defaultThemeId) ??
    allThemes[0] ??
    null

  const resolvedActiveThemeId = resolvedActiveTheme?.id ?? null

  useEffect(() => {
    if (!resolvedActiveThemeId || resolvedActiveThemeId === activeThemeIdState) return
    setActiveThemeIdState(resolvedActiveThemeId)
  }, [resolvedActiveThemeId, activeThemeIdState])

  const previousThemeIdRef = useRef(null)

  useEffect(() => {
    if (!resolvedActiveTheme) return undefined
    return applyThemeToDocument(resolvedActiveTheme)
  }, [resolvedActiveTheme])

  useEffect(() => {
    if (!resolvedActiveThemeId || !hasHydratedSelection) return
    saveSelectedThemeId(resolvedActiveThemeId)
    if (previousThemeIdRef.current !== resolvedActiveThemeId) {
      if (typeof onThemeChange === 'function' && resolvedActiveTheme) {
        onThemeChange({ id: resolvedActiveThemeId, theme: resolvedActiveTheme })
      }
      previousThemeIdRef.current = resolvedActiveThemeId
    }
  }, [resolvedActiveThemeId, resolvedActiveTheme, onThemeChange, hasHydratedSelection])

  useEffect(() => {
    if (!customThemes) return
    saveCustomThemes(customThemes)
  }, [customThemes])

  useEffect(() => {
    let cancelled = false

    loadStoredThemes().then((stored) => {
      if (cancelled) return
      const existingIds = new Set(normalizedBaseThemes.map((theme) => theme.id))
      const normalized = []
      stored.forEach((theme, index) => {
        const normalizedTheme = normalizeThemeDefinition(theme ?? {}, {
          existingIds,
          fallbackName: `Custom theme ${index + 1}`,
          fallbackId: `custom-theme-${index + 1}`,
          baseTokens: defaultBaseTokens,
          isCustom: true,
          source: 'custom',
        })
        normalized.push(normalizedTheme)
      })
      setCustomThemes(normalized)
    })

    return () => {
      cancelled = true
    }
  }, [normalizedBaseThemes, defaultBaseTokens])

  useEffect(() => {
    let cancelled = false
    loadStoredThemeId()
      .then((storedId) => {
        if (cancelled) return
        if (typeof storedId === 'string' && storedId.trim().length > 0) {
          setActiveThemeIdState(storedId)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHasHydratedSelection(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setActiveThemeId = useCallback(
    (nextId) => {
      if (typeof nextId !== 'string' || nextId.trim().length === 0) return
      if (!themesById.has(nextId)) return
      setActiveThemeIdState(nextId)
    },
    [themesById],
  )

  const createCustomTheme = useCallback(
    (themeDefinition, options = {}) => {
      let normalizedTheme = null
      setCustomThemes((previous) => {
        const existingIds = new Set(normalizedBaseThemes.map((theme) => theme.id))
        const candidateId =
          typeof themeDefinition?.id === 'string' && themeDefinition.id.trim().length > 0
            ? themeDefinition.id.trim()
            : null
        const candidateNameId =
          typeof themeDefinition?.name === 'string' && themeDefinition.name.trim().length > 0
            ? createThemeId(themeDefinition.name)
            : null
        const idsToReplace = new Set([candidateId, candidateNameId].filter(Boolean))

        previous.forEach((theme) => {
          if (typeof theme?.id === 'string' && theme.id.length > 0) {
            if (idsToReplace.has(theme.id)) return
            existingIds.add(theme.id)
          }
        })

        normalizedTheme = normalizeThemeDefinition(themeDefinition ?? {}, {
          existingIds,
          fallbackName: 'Custom theme',
          fallbackId: 'custom-theme',
          baseTokens: options?.baseTokens ?? defaultBaseTokens,
          isCustom: true,
          source: 'custom',
        })

        return [
          ...previous.filter((theme) => {
            if (!theme?.id) return false
            if (theme.id === normalizedTheme.id) return false
            if (idsToReplace.has(theme.id)) return false
            return true
          }),
          normalizedTheme,
        ]
      })

      if (normalizedTheme) {
        setActiveThemeIdState(normalizedTheme.id)
      }

      return normalizedTheme
    },
    [normalizedBaseThemes, defaultBaseTokens],
  )

  const contextValue = useMemo(
    () => ({
      baseThemes: normalizedBaseThemes,
      customThemes: sortedCustomThemes,
      themes: allThemes,
      activeThemeId: resolvedActiveThemeId,
      activeTheme: resolvedActiveTheme,
      setActiveThemeId,
      createCustomTheme,
      storageKeys: {
        customThemes: CUSTOM_THEMES_STORAGE_KEY,
        selectedTheme: SELECTED_THEME_STORAGE_KEY,
      },
    }),
    [
      normalizedBaseThemes,
      sortedCustomThemes,
      allThemes,
      resolvedActiveThemeId,
      resolvedActiveTheme,
      setActiveThemeId,
      createCustomTheme,
    ],
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
