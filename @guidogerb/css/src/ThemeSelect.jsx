import { useEffect, useId, useMemo, useState } from 'react'
import { DEFAULT_THEMES } from './themes.js'
import { useTheme } from './useTheme.js'
import {
  THEME_COLOR_FIELDS,
  buildColorFormState,
  extractTokensFromState,
  sanitizeColorValue,
} from './themeForm.js'

const BASE_CLASS = 'gg-theme-select'

const buildClassName = (...values) => values.filter(Boolean).join(' ')

const sanitizeString = (value) => (typeof value === 'string' ? value : '')

const getThemeTokens = (theme) =>
  theme?.tokens && typeof theme.tokens === 'object' ? theme.tokens : {}

/**
 * Theme selector and custom theme creation form suitable for embedding inside the header.
 */
export function ThemeSelect({
  className,
  label = 'Theme',
  createLabel = 'Create custom theme',
  cancelLabel = 'Cancel',
  saveLabel = 'Save theme',
  onThemeChange,
  onThemeCreated,
} = {}) {
  const themeContext = useTheme()
  const availableThemes = themeContext?.themes ?? []
  const activeThemeId = themeContext?.activeThemeId ?? availableThemes[0]?.id ?? ''
  const activeTheme =
    themeContext?.activeTheme ?? availableThemes.find((theme) => theme.id === activeThemeId)
  const setActiveThemeId = themeContext?.setActiveThemeId
  const createCustomTheme = themeContext?.createCustomTheme
  const canCreateCustom = typeof createCustomTheme === 'function'

  const baseTokens =
    getThemeTokens(activeTheme) ??
    getThemeTokens(availableThemes[0]) ??
    getThemeTokens(DEFAULT_THEMES[0])

  const colorDefaults = useMemo(() => buildColorFormState(baseTokens), [baseTokens])

  const [isCreating, setIsCreating] = useState(false)
  const [formState, setFormState] = useState(() => ({ name: '', ...colorDefaults }))

  useEffect(() => {
    setFormState((prev) => ({ ...prev, ...colorDefaults }))
  }, [colorDefaults])

  const controlId = useId()

  if (!availableThemes || availableThemes.length === 0) {
    return null
  }

  const handleThemeChange = (event) => {
    const nextId = event.target.value
    if (typeof setActiveThemeId === 'function') {
      setActiveThemeId(nextId)
    }
    if (typeof onThemeChange === 'function') {
      const nextTheme = availableThemes.find((theme) => theme.id === nextId)
      onThemeChange({ id: nextId, theme: nextTheme ?? null })
    }
  }

  const handleToggleCreate = () => {
    if (!canCreateCustom) return

    if (isCreating) {
      setIsCreating(false)
      setFormState({ name: '', ...colorDefaults })
    } else {
      setFormState({ name: '', ...colorDefaults })
      setIsCreating(true)
    }
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedName = sanitizeString(formState.name).trim()
    if (!trimmedName) return
    if (!canCreateCustom) return

    const tokens = extractTokensFromState(formState)

    const createdTheme = createCustomTheme(
      {
        name: trimmedName,
        tokens,
      },
      { baseTokens },
    )

    if (createdTheme) {
      setIsCreating(false)
      setFormState({ name: '', ...colorDefaults })
      if (typeof onThemeCreated === 'function') {
        onThemeCreated(createdTheme)
      }
      if (typeof onThemeChange === 'function') {
        onThemeChange({ id: createdTheme.id, theme: createdTheme })
      }
    }
  }

  const wrapperClassName = buildClassName(
    BASE_CLASS,
    isCreating ? `${BASE_CLASS}--is-creating` : null,
    className,
  )

  return (
    <div className={wrapperClassName} data-active-theme={activeThemeId}>
      <label className={`${BASE_CLASS}__label`} htmlFor={controlId}>
        <span className={`${BASE_CLASS}__label-text`}>{label}</span>
        <select
          id={controlId}
          className={`${BASE_CLASS}__select`}
          value={activeThemeId}
          onChange={handleThemeChange}
        >
          {availableThemes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </label>

      <div className={`${BASE_CLASS}__actions`}>
        <button
          type="button"
          className={`${BASE_CLASS}__toggle`}
          onClick={handleToggleCreate}
          aria-expanded={isCreating}
          disabled={!canCreateCustom}
        >
          {isCreating ? cancelLabel : createLabel}
        </button>
      </div>

      {isCreating ? (
        <form className={`${BASE_CLASS}__form`} onSubmit={handleSubmit}>
          <div className={`${BASE_CLASS}__field`}>
            <label className={`${BASE_CLASS}__field-label`} htmlFor={`${controlId}-name`}>
              Theme name
            </label>
            <input
              id={`${controlId}-name`}
              className={`${BASE_CLASS}__input`}
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              placeholder="New theme name"
              required
              type="text"
            />
          </div>

          <div className={`${BASE_CLASS}__grid`} role="group" aria-label="Theme colors">
            {THEME_COLOR_FIELDS.map((field) => (
              <label
                key={field.key}
                className={`${BASE_CLASS}__field`}
                htmlFor={`${controlId}-${field.name}`}
              >
                <span className={`${BASE_CLASS}__field-label`}>{field.label}</span>
                <input
                  id={`${controlId}-${field.name}`}
                  className={`${BASE_CLASS}__input ${BASE_CLASS}__input--color`}
                  type="color"
                  name={field.name}
                  value={sanitizeColorValue(formState[field.name]) ?? field.default}
                  onChange={handleInputChange}
                />
              </label>
            ))}
          </div>

          <div className={`${BASE_CLASS}__form-actions`}>
            <button type="submit" className={`${BASE_CLASS}__save`}>
              {saveLabel}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

export default ThemeSelect
