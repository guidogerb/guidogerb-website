import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  CUSTOM_THEMES_STORAGE_KEY,
  DEFAULT_THEME_ID,
  SELECTED_THEME_STORAGE_KEY,
  ThemeProvider,
  ThemeSelect,
  useTheme,
} from '../index.js'

const TestConsumer = () => {
  const theme = useTheme()
  return (
    <div data-testid="theme" data-active={theme?.activeThemeId ?? ''}>
      {theme?.activeTheme?.name ?? 'None'}
    </div>
  )
}

const ThemeCapture = ({ onTheme }) => {
  const theme = useTheme()
  onTheme?.(theme)
  return null
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.cssText = ''
  })

  it('applies the default theme on mount', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    )

    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe(DEFAULT_THEME_ID),
    )

    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#0b0c0f')
    expect(screen.getByTestId('theme')).toHaveAttribute('data-active', DEFAULT_THEME_ID)
    expect(screen.getByTestId('theme')).toHaveTextContent(/midnight/i)
  })

  it('honors the defaultThemeId prop when provided', async () => {
    render(
      <ThemeProvider defaultThemeId="sunrise">
        <TestConsumer />
      </ThemeProvider>,
    )

    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBe('sunrise'))
    expect(screen.getByTestId('theme')).toHaveTextContent(/sunrise/i)
  })

  it('restores a persisted selection from storage', async () => {
    localStorage.setItem(SELECTED_THEME_STORAGE_KEY, 'forest')

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    )

    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBe('forest'))
    expect(screen.getByTestId('theme')).toHaveAttribute('data-active', 'forest')
  })

  it('replaces custom themes with duplicate identifiers and activates the newest version', async () => {
    const themeRef = { current: null }

    render(
      <ThemeProvider>
        <ThemeCapture onTheme={(theme) => {
          themeRef.current = theme
        }} />
        <TestConsumer />
      </ThemeProvider>,
    )

    await waitFor(() => expect(themeRef.current).not.toBeNull())

    act(() => {
      themeRef.current.createCustomTheme({
        id: 'ocean',
        name: 'Ocean',
        tokens: { '--color-primary': '#1fb6ff' },
      })
    })

    await waitFor(() => {
      expect(themeRef.current.customThemes).toHaveLength(1)
      expect(themeRef.current.customThemes[0]).toMatchObject({ name: 'Ocean' })
    })

    const created = themeRef.current.customThemes[0]

    act(() => {
      themeRef.current.createCustomTheme({
        id: created.id,
        name: 'Ocean Deep',
        tokens: { '--color-primary': '#0f172a' },
      })
    })

    await waitFor(() => {
      expect(themeRef.current.customThemes).toHaveLength(1)
      expect(themeRef.current.customThemes[0]).toMatchObject({
        id: created.id,
        name: 'Ocean Deep',
      })
    })

    const stored = JSON.parse(localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY) ?? '[]')
    expect(stored.some((theme) => theme?.name === 'Ocean Deep')).toBe(true)
  })

  it('ignores requests to activate unknown theme identifiers', async () => {
    const themeRef = { current: null }

    render(
      <ThemeProvider>
        <ThemeCapture onTheme={(theme) => {
          themeRef.current = theme
        }} />
        <TestConsumer />
      </ThemeProvider>,
    )

    await waitFor(() => expect(themeRef.current?.activeThemeId).toBe(DEFAULT_THEME_ID))

    act(() => {
      themeRef.current.setActiveThemeId('unknown-theme')
      themeRef.current.setActiveThemeId('')
    })

    expect(themeRef.current.activeThemeId).toBe(DEFAULT_THEME_ID)
  })

  it('invokes onThemeChange once persisted selection hydration completes', async () => {
    localStorage.setItem(SELECTED_THEME_STORAGE_KEY, 'forest')
    const handleChange = vi.fn()

    render(
      <ThemeProvider onThemeChange={handleChange}>
        <TestConsumer />
      </ThemeProvider>,
    )

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith({
        id: 'forest',
        theme: expect.objectContaining({ id: 'forest' }),
      }),
    )
  })
})

describe('ThemeSelect', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.cssText = ''
  })

  it('switches themes and persists the selection', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeSelect label="Theme" />
      </ThemeProvider>,
    )

    const select = screen.getByLabelText('Theme')
    await waitFor(() => expect(select).toHaveValue(DEFAULT_THEME_ID))

    await user.selectOptions(select, 'sunrise')

    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBe('sunrise'))

    expect(localStorage.getItem(SELECTED_THEME_STORAGE_KEY)).toBe('sunrise')
  })

  it('creates custom themes and stores them locally', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeSelect label="Theme" />
      </ThemeProvider>,
    )

    const createButton = screen.getByRole('button', { name: /create custom theme/i })
    await user.click(createButton)

    const nameInput = screen.getByLabelText('Theme name')
    await user.type(nameInput, 'Ocean')

    const primaryColorInput = screen.getByLabelText('Primary color')
    fireEvent.input(primaryColorInput, { target: { value: '#1fb6ff' } })

    const bgColorInput = screen.getByLabelText('Background color')
    fireEvent.input(bgColorInput, { target: { value: '#001122' } })

    await user.click(screen.getByRole('button', { name: /save theme/i }))

    const select = screen.getByLabelText('Theme')
    await waitFor(() => expect(select.value).toMatch(/^ocean/))

    const storedThemes = JSON.parse(localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY) ?? '[]')
    const createdTheme = storedThemes.find((theme) => theme?.name === 'Ocean')

    expect(createdTheme).toBeTruthy()
    expect(localStorage.getItem(SELECTED_THEME_STORAGE_KEY)).toEqual(createdTheme.id)
    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#1fb6ff'),
    )
  })
})
