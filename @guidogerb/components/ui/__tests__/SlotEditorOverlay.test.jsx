import { fireEvent, render, screen } from '@testing-library/react'

import { SlotEditorOverlay } from '../src/ResponsiveSlot/editing/SlotEditorOverlay.jsx'

describe('SlotEditorOverlay', () => {
  it('renders without crashing and wires editor callbacks', () => {
    const handleVariantChange = vi.fn()
    const handleSizeChange = vi.fn()
    const handleClear = vi.fn()
    const handlePropsChange = vi.fn()
    const handlePublish = vi.fn()
    const handleDiscard = vi.fn()

    render(
      <SlotEditorOverlay
        slotKey="test.slot"
        slotLabel="Test Slot"
        editableId="slot-1"
        variant="default"
        variantOptions={{ default: { label: 'Default' }, alt: { label: 'Alt' } }}
        breakpoints={[{ key: 'xs' }, { key: 'md' }]}
        activeBreakpoint="md"
        sizes={{ md: { inline: '10rem', block: '12rem' } }}
        draftSizes={{}}
        onSizeChange={handleSizeChange}
        onClearBreakpoint={handleClear}
        onVariantChange={handleVariantChange}
        propsJSON={{ foo: 'bar' }}
        onPropsChange={handlePropsChange}
        publishDraft={handlePublish}
        discardDraft={handleDiscard}
        isDirty
        status="idle"
        error={null}
        lastUpdatedAt="2025-09-19T00:00:00.000Z"
        overflowEvents={[
          { id: 'md', breakpoint: 'md', inlineBudget: '10rem', blockBudget: '12rem' },
        ]}
        isActive
        onActivate={() => {}}
      />,
    )

    const variantSelect = screen.getByRole('combobox', { name: 'Variant' })
    expect(variantSelect).toBeInTheDocument()
    fireEvent.change(variantSelect, { target: { value: 'alt' } })
    expect(handleVariantChange).toHaveBeenCalledWith('alt')

    fireEvent.change(screen.getByLabelText('Inline'), { target: { value: '32rem' } })
    expect(handleSizeChange).toHaveBeenCalledWith('md', 'inline', '32rem')

    fireEvent.click(screen.getByRole('button', { name: 'Reset breakpoint' }))
    expect(handleClear).toHaveBeenCalledWith('md')

    fireEvent.change(screen.getByRole('textbox', { name: 'Props JSON' }), {
      target: { value: '{"foo":"baz"}' },
    })
    expect(handlePropsChange).toHaveBeenCalledWith({ foo: 'baz' })

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    expect(handlePublish).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
    expect(handleDiscard).toHaveBeenCalled()
  })

  it('renders a formatted last updated timestamp when available', () => {
    const toLocaleSpy = vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue(
      '09/19/2025, 12:00:00 AM',
    )

    try {
      render(
        <SlotEditorOverlay
          slotKey="test.slot"
          slotLabel="Test Slot"
          editableId="slot-1"
          variant="default"
          breakpoints={[{ key: 'md' }]}
          activeBreakpoint="md"
          sizes={{ md: {} }}
          draftSizes={{}}
          propsJSON={{}}
          publishDraft={() => {}}
          discardDraft={() => {}}
          isDirty={false}
          status="idle"
          error={null}
          lastUpdatedAt="2025-09-19T00:00:00.000Z"
          isActive
        />,
      )

      expect(screen.getByText('Updated 09/19/2025, 12:00:00 AM')).toBeInTheDocument()
    } finally {
      toLocaleSpy.mockRestore()
    }
  })

  it('falls back to the raw lastUpdatedAt value when formatting fails', () => {
    const toLocaleSpy = vi
      .spyOn(Date.prototype, 'toLocaleString')
      .mockImplementation(() => {
        throw new Error('locale failure')
      })

    try {
      render(
        <SlotEditorOverlay
          slotKey="test.slot"
          slotLabel="Test Slot"
          editableId="slot-1"
          variant="default"
          breakpoints={[{ key: 'md' }]}
          activeBreakpoint="md"
          sizes={{ md: {} }}
          draftSizes={{}}
          propsJSON={{}}
          publishDraft={() => {}}
          discardDraft={() => {}}
          isDirty={false}
          status="idle"
          error={null}
          lastUpdatedAt="2025-09-19T00:00:00.000Z"
          isActive
        />,
      )

      expect(
        screen.getByText('Updated 2025-09-19T00:00:00.000Z'),
      ).toBeInTheDocument()
    } finally {
      toLocaleSpy.mockRestore()
    }
  })
})
