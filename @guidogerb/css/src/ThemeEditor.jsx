import { useEffect, useId, useMemo, useState } from 'react'
import { DEFAULT_THEMES } from './themes.js'
import { useTheme } from './useTheme.js'
import {
  THEME_COLOR_FIELDS,
  buildColorFormState,
  extractTokensFromState,
  sanitizeColorValue,
} from './themeForm.js'

const BASE_CLASS = 'gg-theme-editor'

const buildClassName = (...values) => values.filter(Boolean).join(' ')

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : '')

const getThemeTokens = (theme) =>
  theme?.tokens && typeof theme.tokens === 'object' ? theme.tokens : {}

const getDefaultThemeName = (theme) => {
  const name = sanitizeString(theme?.name)
  if (!name) return 'Custom theme'
  if (theme?.isCustom) return name
  return `${name} custom`
}

const buildPreviewTokens = (formState) => extractTokensFromState(formState)

const buildPreviewStyles = (tokens) => ({
  backgroundColor: tokens['--color-bg'] ?? '#0b0c0f',
  color: tokens['--color-text'] ?? '#e6e8ec',
})

const buildSurfaceStyles = (tokens) => ({
  backgroundColor: tokens['--color-surface'] ?? '#111318',
  color: tokens['--color-text'] ?? '#e6e8ec',
  border: `1px solid ${tokens['--color-muted'] ?? '#a1a7b3'}`,
})

const buildAccentStyles = (tokens) => ({
  backgroundColor: tokens['--color-primary'] ?? '#3b82f6',
  color: tokens['--color-bg'] ?? '#0b0c0f',
})

export function ThemeEditor({
  className,
  triggerLabel = 'Customize theme',
  title = 'Theme editor',
  description = 'Adjust brand colors and save them as a reusable theme.',
  cancelLabel = 'Cancel',
  closeLabel = 'Close',
  saveLabel = 'Save changes',
  themeId,
  onOpen,
  onClose,
  onSave,
} = {}) {
  const themeContext = useTheme()
  const availableThemes = themeContext?.themes ?? []
  const activeThemeId = themeId ?? themeContext?.activeThemeId ?? availableThemes[0]?.id ?? null

  const resolvedTheme = useMemo(() => {
    if (!availableThemes.length) return null
    const explicit = availableThemes.find((candidate) => candidate?.id === activeThemeId)
    if (explicit) return explicit
    if (themeContext?.activeTheme) return themeContext.activeTheme
    return availableThemes[0]
  }, [availableThemes, activeThemeId, themeContext])

  const baseTokens = useMemo(() => {
    if (resolvedTheme) return getThemeTokens(resolvedTheme)
    return getThemeTokens(DEFAULT_THEMES[0])
  }, [resolvedTheme])

  const colorDefaults = useMemo(() => buildColorFormState(baseTokens), [baseTokens])

  const [isOpen, setIsOpen] = useState(false)
  const [formState, setFormState] = useState(() => ({
    name: getDefaultThemeName(resolvedTheme),
    ...colorDefaults,
  }))
  const [targetThemeId, setTargetThemeId] = useState(() =>
    resolvedTheme?.isCustom ? resolvedTheme.id : null,
  )

  useEffect(() => {
    if (!isOpen) return
    setFormState({ name: getDefaultThemeName(resolvedTheme), ...colorDefaults })
    setTargetThemeId(resolvedTheme?.isCustom ? resolvedTheme.id : null)
  }, [colorDefaults, isOpen, resolvedTheme])

  const tokens = useMemo(() => buildPreviewTokens(formState), [formState])
  const previewStyles = useMemo(() => buildPreviewStyles(tokens), [tokens])
  const surfaceStyles = useMemo(() => buildSurfaceStyles(tokens), [tokens])
  const accentStyles = useMemo(() => buildAccentStyles(tokens), [tokens])

  const titleId = useId()
  const descriptionId = useId()

  if (!themeContext || availableThemes.length === 0) {
    return null
  }

  const handleOpen = () => {
    setIsOpen(true)
    if (typeof onOpen === 'function') {
      onOpen()
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    if (typeof onClose === 'function') {
      onClose()
    }
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedName = sanitizeString(formState.name)
    if (!trimmedName) return
    if (typeof themeContext.createCustomTheme !== 'function') return

    const tokensFromState = extractTokensFromState(formState)

    const createdTheme = themeContext.createCustomTheme(
      {
        id: targetThemeId ?? undefined,
        name: trimmedName,
        tokens: tokensFromState,
      },
      { baseTokens },
    )

    if (createdTheme) {
      if (typeof onSave === 'function') {
        onSave(createdTheme)
      }
      handleClose()
    }
  }

  return (
    <div className={buildClassName(BASE_CLASS, className)}>
      <button
        type="button"
        className={`${BASE_CLASS}__trigger`}
        onClick={handleOpen}
        disabled={!availableThemes.length}
      >
        {triggerLabel}
      </button>

      {isOpen ? (
        <div className={`${BASE_CLASS}__overlay`}>
          <div
            className={`${BASE_CLASS}__dialog`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
          >
            <header className={`${BASE_CLASS}__header`}>
              <h2 id={titleId} className={`${BASE_CLASS}__title`}>
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className={`${BASE_CLASS}__description`}>
                  {description}
                </p>
              ) : null}
              <button type="button" className={`${BASE_CLASS}__close`} onClick={handleClose}>
                {closeLabel}
              </button>
            </header>

            <div className={`${BASE_CLASS}__content`}>
              <form className={`${BASE_CLASS}__form`} onSubmit={handleSubmit}>
                <div className={`${BASE_CLASS}__field`}>
                  <label className={`${BASE_CLASS}__label`} htmlFor={`${titleId}-name`}>
                    Theme name
                  </label>
                  <input
                    id={`${titleId}-name`}
                    className={`${BASE_CLASS}__input`}
                    name="name"
                    type="text"
                    value={formState.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <fieldset className={`${BASE_CLASS}__fieldset`}>
                  <legend className={`${BASE_CLASS}__legend`}>Colors</legend>
                  <div className={`${BASE_CLASS}__grid`}>
                    {THEME_COLOR_FIELDS.map((field) => (
                      <label
                        key={field.key}
                        className={`${BASE_CLASS}__field`}
                        htmlFor={`${titleId}-${field.name}`}
                      >
                        <span className={`${BASE_CLASS}__label`}>{field.label}</span>
                        <input
                          id={`${titleId}-${field.name}`}
                          className={`${BASE_CLASS}__input ${BASE_CLASS}__input--color`}
                          type="color"
                          name={field.name}
                          value={sanitizeColorValue(formState[field.name]) ?? field.default}
                          onChange={handleInputChange}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>

                <section className={`${BASE_CLASS}__preview`} aria-label="Theme preview">
                  <div className={`${BASE_CLASS}__preview-wrapper`} style={previewStyles}>
                    <div className={`${BASE_CLASS}__preview-card`} style={surfaceStyles}>
                      <h3 className={`${BASE_CLASS}__preview-heading`}>Preview headline</h3>
                      <p className={`${BASE_CLASS}__preview-copy`}>
                        Adjust the palette to see real-time changes reflected in this preview card.
                      </p>
                      <button
                        type="button"
                        className={`${BASE_CLASS}__preview-action`}
                        style={accentStyles}
                      >
                        Primary action
                      </button>
                    </div>
                  </div>
                </section>

                <footer className={`${BASE_CLASS}__actions`}>
                  <button type="button" className={`${BASE_CLASS}__button`} onClick={handleClose}>
                    {cancelLabel}
                  </button>
                  <button
                    type="submit"
                    className={`${BASE_CLASS}__button ${BASE_CLASS}__button--primary`}
                  >
                    {saveLabel}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ThemeEditor
