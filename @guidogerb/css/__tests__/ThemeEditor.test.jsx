import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  CUSTOM_THEMES_STORAGE_KEY,
  SELECTED_THEME_STORAGE_KEY,
  ThemeEditor,
  ThemeProvider,
} from '../index.js'

describe('ThemeEditor', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.cssText = ''
  })

  it('creates a custom theme and persists it via the provider', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeEditor triggerLabel="Customize" />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: /customize/i }))

    const dialog = await screen.findByRole('dialog', { name: /theme editor/i })
    const nameInput = within(dialog).getByLabelText('Theme name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Ocean Surge')

    const primaryColor = within(dialog).getByLabelText('Primary color')
    fireEvent.input(primaryColor, { target: { value: '#0af0ff' } })
    const bgColor = within(dialog).getByLabelText('Background color')
    fireEvent.input(bgColor, { target: { value: '#020617' } })

    await user.click(within(dialog).getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await waitFor(() =>
      expect(localStorage.getItem(SELECTED_THEME_STORAGE_KEY)).toMatch(/^ocean-surge/),
    )

    const storedThemes = JSON.parse(localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY) ?? '[]')
    expect(storedThemes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Ocean Surge',
          tokens: expect.objectContaining({
            '--color-primary': '#0af0ff',
            '--color-bg': '#020617',
          }),
        }),
      ]),
    )

    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#0af0ff'),
    )
  })

  it('prefills existing custom themes when reopened and updates them in place', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeEditor triggerLabel="Customize" />
      </ThemeProvider>,
    )

    const openEditor = async () => {
      await user.click(screen.getByRole('button', { name: /customize/i }))
      return screen.findByRole('dialog', { name: /theme editor/i })
    }

    let dialog = await openEditor()
    await user.clear(within(dialog).getByLabelText('Theme name'))
    await user.type(within(dialog).getByLabelText('Theme name'), 'Ocean Base')
    fireEvent.input(within(dialog).getByLabelText('Primary color'), {
      target: { value: '#0ea5e9' },
    })
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    dialog = await openEditor()
    await waitFor(() =>
      expect(within(dialog).getByLabelText('Theme name')).toHaveValue('Ocean Base'),
    )

    await user.clear(within(dialog).getByLabelText('Theme name'))
    await user.type(within(dialog).getByLabelText('Theme name'), 'Ocean Deep')
    fireEvent.input(within(dialog).getByLabelText('Primary color'), {
      target: { value: '#0369a1' },
    })
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    const storedThemes = JSON.parse(localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY) ?? '[]')
    expect(storedThemes).toHaveLength(1)
    expect(storedThemes[0]).toMatchObject({ name: 'Ocean Deep' })
  })
})
