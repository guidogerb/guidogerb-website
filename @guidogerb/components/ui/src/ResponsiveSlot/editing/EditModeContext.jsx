import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const defaultFetch =
  typeof fetch === 'function'
    ? fetch.bind(typeof window !== 'undefined' ? window : globalThis)
    : null

const DEFAULT_KEYBOARD_SHORTCUT = {
  key: 'e',
  altKey: true,
  shiftKey: true,
}

const TOOLBAR_POSITION_STYLES = {
  'bottom-right': { bottom: '1.5rem', right: '1.5rem' },
  'bottom-left': { bottom: '1.5rem', left: '1.5rem' },
  'top-right': { top: '1.5rem', right: '1.5rem' },
  'top-left': { top: '1.5rem', left: '1.5rem' },
}

const TEXT_INPUT_TAGS = new Set(['input', 'textarea', 'select'])

const DEFAULT_STATE_STORAGE_KEY = 'gg:edit-mode:v1'

function getLocalStorage() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage || null
  } catch (error) {
    return null
  }
}

function readStoredEditModeState(key) {
  const storage = getLocalStorage()
  if (!storage || !key) return null

  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const storedIsEditing =
      typeof parsed.isEditing === 'boolean' ? parsed.isEditing : undefined
    const storedActiveEditableId =
      typeof parsed.activeEditableId === 'string' && parsed.activeEditableId
        ? parsed.activeEditableId
        : null

    return {
      isEditing: storedIsEditing,
      activeEditableId: storedActiveEditableId,
    }
  } catch (error) {
    return null
  }
}

function writeStoredEditModeState(key, state) {
  const storage = getLocalStorage()
  if (!storage || !key) return

  try {
    const activeEditableId =
      typeof state.activeEditableId === 'string' && state.activeEditableId.trim()
        ? state.activeEditableId
        : null

    storage.setItem(
      key,
      JSON.stringify({
        version: 1,
        isEditing: Boolean(state.isEditing),
        activeEditableId,
      }),
    )
  } catch (error) {
    // Ignore storage quota/security errors so edit mode continues functioning.
  }
}

const EditModeContext = createContext({
  isEditing: false,
  activeEditableId: null,
  setActiveEditableId: () => {},
  toggleEditMode: () => {},
  enterEditMode: () => {},
  exitEditMode: () => {},
  graphqlEndpoint: null,
  graphqlHeaders: null,
  fetcher: defaultFetch,
})

export function EditModeProvider({
  children,
  initialMode = false,
  graphqlEndpoint = null,
  graphqlHeaders = null,
  fetcher,
  enableKeyboardShortcut = true,
  keyboardShortcut = DEFAULT_KEYBOARD_SHORTCUT,
  enableToolbar = true,
  toolbarLabel = 'Edit layout',
  toolbarShortcutHint,
  toolbarPosition = 'bottom-right',
  persistState = false,
  stateStorageKey = DEFAULT_STATE_STORAGE_KEY,
}) {
  const storageKey =
    typeof stateStorageKey === 'string' && stateStorageKey.trim()
      ? stateStorageKey.trim()
      : DEFAULT_STATE_STORAGE_KEY

  const storedStateRef = useRef()
  if (storedStateRef.current === undefined) {
    storedStateRef.current = persistState ? readStoredEditModeState(storageKey) : null
  }
  const storedState = storedStateRef.current

  const [isEditing, setIsEditing] = useState(() => {
    if (storedState && storedState.isEditing !== undefined) {
      return storedState.isEditing
    }
    return Boolean(initialMode)
  })
  const [activeEditableIdState, setActiveEditableIdState] = useState(() => {
    if (storedState && storedState.activeEditableId) {
      return storedState.activeEditableId
    }
    return null
  })

  useEffect(() => {
    if (!persistState) {
      storedStateRef.current = null
      setIsEditing(Boolean(initialMode))
      setActiveEditableIdState(null)
      return
    }

    const stored = readStoredEditModeState(storageKey)
    storedStateRef.current = stored

    if (stored && stored.isEditing !== undefined) {
      setIsEditing(stored.isEditing)
    } else {
      setIsEditing(Boolean(initialMode))
    }

    setActiveEditableIdState(stored?.activeEditableId ?? null)
  }, [persistState, storageKey, initialMode])

  useEffect(() => {
    if (!persistState) return
    writeStoredEditModeState(storageKey, {
      isEditing,
      activeEditableId: activeEditableIdState,
    })
  }, [persistState, storageKey, isEditing, activeEditableIdState])

  const setActiveEditableId = useCallback((nextId) => {
    setActiveEditableIdState(nextId)
  }, [])

  const toggleEditMode = useCallback(() => {
    setIsEditing((current) => !current)
  }, [])

  const enterEditMode = useCallback(() => setIsEditing(true), [])
  const exitEditMode = useCallback(() => setIsEditing(false), [])

  const fetchImpl = fetcher ?? defaultFetch

  const normalizedShortcut = useMemo(
    () => normalizeShortcut(keyboardShortcut),
    [keyboardShortcut],
  )

  useEffect(() => {
    if (!enableKeyboardShortcut) return undefined
    if (typeof window === 'undefined') return undefined

    const handler = (event) => {
      if (event.defaultPrevented) return
      if (!matchesShortcut(event, normalizedShortcut)) return
      if (isInteractiveTarget(event.target)) return

      event.preventDefault()
      toggleEditMode()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enableKeyboardShortcut, normalizedShortcut, toggleEditMode])

  const formattedShortcut = useMemo(() => {
    if (!enableKeyboardShortcut) return null
    if (typeof toolbarShortcutHint === 'string' && toolbarShortcutHint.trim()) {
      return toolbarShortcutHint
    }
    return formatShortcut(normalizedShortcut)
  }, [enableKeyboardShortcut, normalizedShortcut, toolbarShortcutHint])

  const toolbarPositionStyle =
    TOOLBAR_POSITION_STYLES[toolbarPosition] || TOOLBAR_POSITION_STYLES['bottom-right']

  const value = useMemo(
    () => ({
      isEditing,
      activeEditableId: activeEditableIdState,
      setActiveEditableId,
      toggleEditMode,
      enterEditMode,
      exitEditMode,
      graphqlEndpoint,
      graphqlHeaders,
      fetcher: fetchImpl,
    }),
    [
      isEditing,
      activeEditableIdState,
      setActiveEditableId,
      toggleEditMode,
      enterEditMode,
      exitEditMode,
      graphqlEndpoint,
      graphqlHeaders,
      fetchImpl,
    ],
  )

  return (
    <EditModeContext.Provider value={value}>
      {children}
      {enableToolbar ? (
        <EditModeToolbar
          isEditing={isEditing}
          onToggle={toggleEditMode}
          label={toolbarLabel}
          shortcut={formattedShortcut}
          positionStyle={toolbarPositionStyle}
        />
      ) : null}
    </EditModeContext.Provider>
  )
}

export function useEditMode() {
  return useContext(EditModeContext)
}

export { EditModeContext }

function normalizeShortcut(shortcut) {
  if (!shortcut || typeof shortcut !== 'object') {
    return { ...DEFAULT_KEYBOARD_SHORTCUT }
  }

  const key = typeof shortcut.key === 'string' && shortcut.key ? shortcut.key : DEFAULT_KEYBOARD_SHORTCUT.key

  return {
    key,
    altKey: Boolean(shortcut.altKey),
    ctrlKey: Boolean(shortcut.ctrlKey),
    metaKey: Boolean(shortcut.metaKey),
    shiftKey: Boolean(shortcut.shiftKey),
  }
}

function matchesShortcut(event, shortcut) {
  if (!shortcut || !shortcut.key) return false

  const eventKey = String(event.key || '').toLowerCase()
  const expectedKey = String(shortcut.key || '').toLowerCase()

  if (eventKey !== expectedKey) {
    return false
  }

  if (shortcut.altKey !== Boolean(event.altKey)) return false
  if (shortcut.ctrlKey !== Boolean(event.ctrlKey)) return false
  if (shortcut.metaKey !== Boolean(event.metaKey)) return false
  if (shortcut.shiftKey !== Boolean(event.shiftKey)) return false

  return true
}

function formatShortcut(shortcut) {
  if (!shortcut || !shortcut.key) return null
  const parts = []
  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.metaKey) parts.push('Meta')
  if (shortcut.altKey) parts.push('Alt')
  if (shortcut.shiftKey) parts.push('Shift')
  parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key)
  return parts.join(' + ')
}

function isInteractiveTarget(target) {
  if (!target) return false
  if (typeof HTMLElement !== 'undefined' && target instanceof HTMLElement) {
    if (target.isContentEditable) return true
    const tagName = target.tagName ? target.tagName.toLowerCase() : ''
    if (TEXT_INPUT_TAGS.has(tagName)) return true
  }
  return false
}

function EditModeToolbar({ isEditing, onToggle, label, shortcut, positionStyle }) {
  const baseStyle = {
    position: 'fixed',
    zIndex: 2147483646,
    borderRadius: '999px',
    padding: '0.5rem 0.85rem',
    display: 'inline-flex',
    gap: '0.5rem',
    alignItems: 'center',
    background: isEditing ? 'rgba(59, 130, 246, 0.95)' : 'rgba(30, 41, 59, 0.92)',
    color: '#f8fafc',
    border: '1px solid rgba(148, 163, 184, 0.55)',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.35)',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background 120ms ease, transform 120ms ease',
  }

  const shortcutStyle = {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    opacity: 0.85,
    background: 'rgba(15, 23, 42, 0.4)',
    padding: '0.15rem 0.35rem',
    borderRadius: '0.35rem',
  }

  return (
    <button
      type="button"
      aria-pressed={isEditing ? 'true' : 'false'}
      onClick={onToggle}
      style={{ ...baseStyle, ...(positionStyle || {}) }}
    >
      <span>{isEditing ? 'Exit edit mode' : label}</span>
      {shortcut ? <span style={shortcutStyle} aria-hidden="true">{shortcut}</span> : null}
    </button>
  )
}
