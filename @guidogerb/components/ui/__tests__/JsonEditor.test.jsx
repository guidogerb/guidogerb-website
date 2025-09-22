import { fireEvent, render, screen } from '@testing-library/react'

import { JsonEditor } from '../src/ResponsiveSlot/editing/JsonEditor.jsx'

describe('JsonEditor', () => {
  it('formats the initial value and parses updates', () => {
    const handleChange = vi.fn()

    render(<JsonEditor label="Props" value={{ foo: 'bar' }} onChange={handleChange} />)

    const textarea = screen.getByLabelText('Props')
    expect(textarea.value).toContain('"foo": "bar"')

    fireEvent.change(textarea, { target: { value: '{"foo":"baz"}' } })

    expect(handleChange).toHaveBeenCalledWith({ foo: 'baz' })
    expect(textarea).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText(/JSON error:/)).not.toBeInTheDocument()
  })

  it('reports errors while keeping the raw input intact', () => {
    const handleChange = vi.fn()
    const handleErrorChange = vi.fn()

    render(
      <JsonEditor
        label="Props"
        value={{}}
        onChange={handleChange}
        onErrorChange={handleErrorChange}
      />,
    )

    const textarea = screen.getByLabelText('Props')

    fireEvent.change(textarea, { target: { value: '{invalid' } })

    expect(handleChange).not.toHaveBeenCalled()
    expect(handleErrorChange).toHaveBeenLastCalledWith(expect.any(String))
    expect(screen.getByText(/JSON error:/)).toBeInTheDocument()
    expect(textarea).toHaveAttribute('aria-invalid', 'true')

    fireEvent.change(textarea, { target: { value: '{"count": 1}' } })

    expect(handleChange).toHaveBeenLastCalledWith({ count: 1 })
    expect(handleErrorChange).toHaveBeenLastCalledWith(null)
    expect(screen.queryByText(/JSON error:/)).not.toBeInTheDocument()
  })

  it('treats blank input as clearing props', () => {
    const handleChange = vi.fn()

    render(<JsonEditor label="Props" value={{ foo: 'bar' }} onChange={handleChange} />)

    const textarea = screen.getByLabelText('Props')
    fireEvent.change(textarea, { target: { value: '   ' } })

    expect(handleChange).toHaveBeenCalledWith(undefined)
  })

  it('resets the editor when the value prop changes', () => {
    const handleErrorChange = vi.fn()

    const { rerender } = render(
      <JsonEditor label="Props" value={{ foo: 'bar' }} onErrorChange={handleErrorChange} />,
    )

    const textarea = screen.getByLabelText('Props')

    fireEvent.change(textarea, { target: { value: '{invalid' } })
    expect(screen.getByText(/JSON error:/)).toBeInTheDocument()

    rerender(<JsonEditor label="Props" value={{ baz: 2 }} onErrorChange={handleErrorChange} />)

    expect(textarea.value).toContain('"baz": 2')
    expect(handleErrorChange).toHaveBeenLastCalledWith(null)
    expect(screen.queryByText(/JSON error:/)).not.toBeInTheDocument()
  })

  it('invokes textarea onChange prop when provided', () => {
    const handleTextareaChange = vi.fn()

    render(
      <JsonEditor label="Props" value={null} textareaProps={{ onChange: handleTextareaChange }} />,
    )

    const textarea = screen.getByLabelText('Props')
    fireEvent.change(textarea, { target: { value: '{"foo":1}' } })

    expect(handleTextareaChange).toHaveBeenCalledTimes(1)
  })
})
