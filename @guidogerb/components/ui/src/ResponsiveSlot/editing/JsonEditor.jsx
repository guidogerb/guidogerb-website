import { useEffect, useId, useMemo, useState } from 'react'

function formatJson(value) {
  if (value == null) {
    return '{\n}'
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch (error) {
    return '{\n}'
  }
}

function parseJson(text) {
  if (!text.trim()) {
    return { value: undefined, error: null }
  }

  try {
    return { value: JSON.parse(text), error: null }
  } catch (error) {
    return { value: undefined, error: error.message || 'Invalid JSON' }
  }
}

const defaultContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
}

const defaultLabelStyle = {
  fontSize: '0.75rem',
  fontWeight: 600,
}

const defaultTextareaStyle = {
  width: '100%',
  borderRadius: '0.5rem',
  border: '1px solid rgba(148, 163, 184, 0.4)',
  background: 'rgba(30, 41, 59, 0.9)',
  color: 'inherit',
  padding: '0.5rem',
  fontFamily: 'monospace',
  fontSize: '0.75rem',
}

const defaultErrorStyle = {
  color: '#f87171',
  fontSize: '0.75rem',
}

/**
 * Textarea-based JSON editor with validation feedback.
 */
export function JsonEditor({
  label = 'JSON',
  value,
  onChange,
  onErrorChange,
  rows = 6,
  id,
  description,
  containerStyle,
  labelProps = {},
  textareaProps = {},
  errorMessagePrefix = 'JSON error:',
}) {
  const generatedId = useId()
  const {
    onChange: textareaOnChange,
    style: textareaStyle,
    id: textareaId,
    'aria-describedby': ariaDescribedBy,
    ...restTextareaProps
  } = textareaProps

  const textareaIdValue = id ?? textareaId ?? generatedId
  const [textValue, setTextValue] = useState(() => formatJson(value))
  const [error, setError] = useState(null)

  useEffect(() => {
    const formatted = formatJson(value)
    setTextValue(formatted)
    setError(null)
    if (typeof onErrorChange === 'function') {
      onErrorChange(null)
    }
  }, [value, onErrorChange])

  const describedBy = useMemo(() => {
    if (!error) return ariaDescribedBy
    const errorId = `${textareaIdValue}-error`
    if (ariaDescribedBy) {
      return `${ariaDescribedBy} ${errorId}`
    }
    return errorId
  }, [error, ariaDescribedBy, textareaIdValue])

  const handleChange = (event) => {
    const nextText = event.target.value
    setTextValue(nextText)

    const { value: parsed, error: parseError } = parseJson(nextText)

    if (parseError) {
      setError(parseError)
      if (typeof onErrorChange === 'function') {
        onErrorChange(parseError)
      }
    } else {
      setError(null)
      if (typeof onErrorChange === 'function') {
        onErrorChange(null)
      }
      if (typeof onChange === 'function') {
        onChange(parsed)
      }
    }

    if (typeof textareaOnChange === 'function') {
      textareaOnChange(event)
    }
  }

  return (
    <div style={{ ...defaultContainerStyle, ...(containerStyle || {}) }}>
      <label htmlFor={textareaIdValue} style={{ ...defaultLabelStyle, ...(labelProps.style || {}) }}>
        {label}
      </label>
      <textarea
        id={textareaIdValue}
        rows={rows}
        value={textValue}
        onChange={handleChange}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        style={{ ...defaultTextareaStyle, ...(textareaStyle || {}) }}
        {...restTextareaProps}
      />
      {description ? (
        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{description}</div>
      ) : null}
      {error ? (
        <div id={`${textareaIdValue}-error`} style={{ ...defaultErrorStyle }}>
          {errorMessagePrefix} {error}
        </div>
      ) : null}
    </div>
  )
}

export default JsonEditor
