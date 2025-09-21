import { useEffect, useMemo, useState } from 'react'

const DIMENSIONS = [
  { key: 'inline', label: 'Inline' },
  { key: 'block', label: 'Block' },
  { key: 'maxInline', label: 'Max inline' },
  { key: 'maxBlock', label: 'Max block' },
  { key: 'minInline', label: 'Min inline' },
  { key: 'minBlock', label: 'Min block' },
]

function formatPropsJSON(value) {
  if (value == null) return '{\n}'
  try {
    if (typeof value === 'string') {
      return value
    }
    return JSON.stringify(value, null, 2)
  } catch (error) {
    return '{\n}'
  }
}

export function SlotEditorOverlay({
  slotKey,
  slotLabel,
  editableId,
  variant,
  variantOptions = {},
  onVariantChange,
  breakpoints = [],
  activeBreakpoint,
  sizes = {},
  draftSizes = {},
  onSizeChange,
  onClearBreakpoint,
  propsJSON,
  onPropsChange,
  publishDraft,
  discardDraft,
  isDirty,
  status,
  error,
  lastUpdatedAt,
  overflowEvents = [],
  isActive,
  onActivate,
}) {
  const [selectedBreakpoint, setSelectedBreakpoint] = useState(() => {
    if (activeBreakpoint) return activeBreakpoint
    return breakpoints[0]?.key ?? 'md'
  })
  const [jsonInput, setJsonInput] = useState(() => formatPropsJSON(propsJSON))
  const [jsonError, setJsonError] = useState(null)

  useEffect(() => {
    if (activeBreakpoint) {
      setSelectedBreakpoint((current) =>
        current === activeBreakpoint ? current : activeBreakpoint,
      )
    }
  }, [activeBreakpoint])

  useEffect(() => {
    setJsonInput(formatPropsJSON(propsJSON))
    setJsonError(null)
  }, [propsJSON])

  const breakpointOptions = useMemo(() => breakpoints.map(({ key }) => key), [breakpoints])

  const resolvedVariantOptions = useMemo(() => {
    const entries = Object.entries(variantOptions)
    if (entries.length === 0) {
      return [['default', { label: 'Default' }]]
    }
    return entries
  }, [variantOptions])

  const handlePropsChange = (event) => {
    const value = event.target.value
    setJsonInput(value)
    if (!onPropsChange) return
    if (!value.trim()) {
      setJsonError(null)
      onPropsChange(undefined)
      return
    }

    try {
      const parsed = JSON.parse(value)
      onPropsChange(parsed)
      setJsonError(null)
    } catch (parseError) {
      setJsonError(parseError.message)
    }
  }

  const handleSizeInputChange = (breakpoint, dimension) => (event) => {
    const value = event.target.value
    if (onSizeChange) {
      onSizeChange(breakpoint, dimension, value)
    }
  }

  const handleClearBreakpoint = (breakpoint) => {
    if (onClearBreakpoint) {
      onClearBreakpoint(breakpoint)
    }
  }

  const currentSizes = sizes[selectedBreakpoint] || {}
  const overridesForBreakpoint = draftSizes[selectedBreakpoint] || {}

  const publishDisabled = status === 'saving' || !isDirty || Boolean(jsonError) || !isActive
  const discardDisabled = status === 'saving'

  const overlayStyle = {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    zIndex: 40,
    maxWidth: 'min(22rem, 90vw)',
    background: 'rgba(15, 23, 42, 0.95)',
    color: '#f8fafc',
    borderRadius: '0.75rem',
    padding: '0.75rem',
    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.35)',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    border: isActive
      ? '1px solid rgba(148, 163, 184, 0.65)'
      : '1px solid rgba(148, 163, 184, 0.35)',
    opacity: isActive ? 1 : 0.75,
    pointerEvents: 'auto',
  }

  const statusLabel = status === 'saving' ? 'Saving…' : isDirty ? 'Unsaved draft' : 'Saved'

  return (
    <div
      data-testid="slot-editor-overlay"
      style={overlayStyle}
      onMouseDown={(event) => {
        event.stopPropagation()
        event.preventDefault()
        if (isActive) return
        if (typeof onActivate === 'function') {
          onActivate()
        }
      }}
      role="dialog"
      aria-label={`Edit ${slotLabel || slotKey}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7 }}>
              {slotKey}
            </div>
            <div style={{ fontWeight: 600 }}>{slotLabel || slotKey}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.65 }}>ID: {editableId}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', lineHeight: 1.3 }}>
            <div>{statusLabel}</div>
            {lastUpdatedAt ? (
              <div style={{ opacity: 0.7 }}>Updated {new Date(lastUpdatedAt).toLocaleString()}</div>
            ) : null}
            {error ? (
              <div style={{ color: '#f87171' }}>{error.message || String(error)}</div>
            ) : null}
          </div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Variant</span>
          <select
            value={variant ?? ''}
            onChange={(event) => onVariantChange?.(event.target.value)}
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              color: 'inherit',
              borderRadius: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.5)',
              padding: '0.35rem 0.5rem',
            }}
          >
            {resolvedVariantOptions.map(([key, meta]) => (
              <option key={key} value={key}>
                {meta?.label || key}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Breakpoint</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {breakpointOptions.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedBreakpoint(key)}
                style={{
                  borderRadius: '999px',
                  border: '1px solid rgba(148, 163, 184, 0.5)',
                  padding: '0.25rem 0.75rem',
                  background:
                    key === selectedBreakpoint ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {DIMENSIONS.map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem' }}>{label}</span>
              <input
                type="text"
                value={overridesForBreakpoint[key] ?? ''}
                placeholder={currentSizes[key] ?? ''}
                onChange={handleSizeInputChange(selectedBreakpoint, key)}
                style={{
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  background: 'rgba(30, 41, 59, 0.9)',
                  color: 'inherit',
                  padding: '0.35rem 0.5rem',
                }}
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => handleClearBreakpoint(selectedBreakpoint)}
            style={{
              justifySelf: 'flex-start',
              borderRadius: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.4)',
              background: 'transparent',
              color: 'inherit',
              padding: '0.35rem 0.75rem',
              cursor: 'pointer',
            }}
          >
            Reset breakpoint
          </button>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Props JSON</span>
          <textarea
            value={jsonInput}
            onChange={handlePropsChange}
            rows={6}
            style={{
              width: '100%',
              borderRadius: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.4)',
              background: 'rgba(30, 41, 59, 0.9)',
              color: 'inherit',
              padding: '0.5rem',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
            }}
          />
          {jsonError ? (
            <div style={{ color: '#f87171', fontSize: '0.75rem' }}>JSON error: {jsonError}</div>
          ) : null}
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={publishDraft}
            disabled={publishDisabled}
            style={{
              flex: '1 1 auto',
              borderRadius: '0.5rem',
              border: 'none',
              padding: '0.5rem 0.75rem',
              background: publishDisabled ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.6)',
              color: '#0f172a',
              fontWeight: 600,
              cursor: publishDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            Publish
          </button>
          <button
            type="button"
            onClick={discardDraft}
            disabled={discardDisabled}
            style={{
              flex: '1 1 auto',
              borderRadius: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.5)',
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              color: 'inherit',
              cursor: discardDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            Discard
          </button>
        </div>

        {overflowEvents.length > 0 ? (
          <div
            style={{
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div style={{ fontWeight: 600 }}>Overflow events</div>
            <ul style={{ margin: 0, paddingLeft: '1rem', display: 'grid', gap: '0.25rem' }}>
              {overflowEvents.map((event) => (
                <li key={event.id || `${event.breakpoint}:${event.timestamp}`}>
                  <span style={{ opacity: 0.7 }}>{event.breakpoint?.toUpperCase() || '??'}:</span>{' '}
                  inline {event.inlineBudget}, block {event.blockBudget}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
