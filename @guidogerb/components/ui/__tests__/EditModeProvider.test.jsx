import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  EditModeProvider,
  useEditMode,
} from '../src/ResponsiveSlot/editing/EditModeContext.jsx'

function ModeIndicator() {
  const { isEditing } = useEditMode()
  return <span data-testid="mode-indicator">{isEditing ? 'editing' : 'view'}</span>
}

function ActiveEditableControls() {
  const { activeEditableId, setActiveEditableId } = useEditMode()

  return (
    <div>
      <span data-testid="active-editable-id">{activeEditableId ?? 'none'}</span>
      <button type="button" onClick={() => setActiveEditableId('slot-123')}>
        Activate slot
      </button>
      <button type="button" onClick={() => setActiveEditableId(null)}>
        Clear slot
      </button>
    </div>
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('EditModeProvider', () => {
  it('renders a toolbar button that toggles edit mode', () => {
    render(
      <EditModeProvider>
        <ModeIndicator />
      </EditModeProvider>,
    )

    const button = screen.getByRole('button', { name: /edit layout/i })
    expect(screen.getByTestId('mode-indicator').textContent).toBe('view')

    fireEvent.click(button)
    expect(screen.getByTestId('mode-indicator').textContent).toBe('editing')
    expect(button).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(button)
    expect(screen.getByTestId('mode-indicator').textContent).toBe('view')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('supports toggling edit mode with the keyboard shortcut', () => {
    render(
      <EditModeProvider>
        <ModeIndicator />
      </EditModeProvider>,
    )

    expect(screen.getByTestId('mode-indicator').textContent).toBe('view')

    fireEvent.keyDown(window, { key: 'e', altKey: true, shiftKey: true })
    expect(screen.getByTestId('mode-indicator').textContent).toBe('editing')

    fireEvent.keyDown(window, { key: 'e', altKey: true, shiftKey: true })
    expect(screen.getByTestId('mode-indicator').textContent).toBe('view')
  })

  it('ignores the shortcut when focus is inside an interactive field', () => {
    render(
      <EditModeProvider>
        <div>
          <label>
            Name
            <input aria-label="name" />
          </label>
          <ModeIndicator />
        </div>
      </EditModeProvider>,
    )

    const input = screen.getByLabelText('name')
    input.focus()
    fireEvent.keyDown(input, { key: 'e', altKey: true, shiftKey: true })
    expect(screen.getByTestId('mode-indicator').textContent).toBe('view')

    input.blur()
    fireEvent.keyDown(window, { key: 'e', altKey: true, shiftKey: true })
    expect(screen.getByTestId('mode-indicator').textContent).toBe('editing')
  })

  it('persists edit mode state when persistence is enabled', async () => {
    const storageKey = 'test-edit-mode-state'

    render(
      <EditModeProvider persistState stateStorageKey={storageKey}>
        <ModeIndicator />
      </EditModeProvider>,
    )

    const toggleButton = screen.getByRole('button', { name: /edit layout/i })
    fireEvent.click(toggleButton)

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(storageKey))
      expect(stored).toMatchObject({ isEditing: true, activeEditableId: null })
    })

    cleanup()

    render(
      <EditModeProvider persistState stateStorageKey={storageKey}>
        <ModeIndicator />
      </EditModeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('mode-indicator').textContent).toBe('editing')
    })
  })

  it('restores the last active editable id when persistence is enabled', async () => {
    const storageKey = 'test-edit-mode-active'

    render(
      <EditModeProvider persistState initialMode stateStorageKey={storageKey}>
        <ActiveEditableControls />
      </EditModeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /activate slot/i }))

    await waitFor(() => {
      expect(screen.getByTestId('active-editable-id').textContent).toBe('slot-123')
    })

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(storageKey))
      expect(stored).toMatchObject({ isEditing: true, activeEditableId: 'slot-123' })
    })

    cleanup()

    render(
      <EditModeProvider persistState stateStorageKey={storageKey}>
        <ActiveEditableControls />
      </EditModeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('active-editable-id').textContent).toBe('slot-123')
    })

    fireEvent.click(screen.getByRole('button', { name: /clear slot/i }))

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(storageKey))
      expect(stored).toMatchObject({ activeEditableId: null })
    })
  })
})
