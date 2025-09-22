import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const defaultFetch =
  typeof fetch === 'function'
    ? fetch.bind(typeof window !== 'undefined' ? window : globalThis)
    : null

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
}) {
  const [isEditing, setIsEditing] = useState(Boolean(initialMode))
  const [activeEditableId, setActiveEditableId] = useState(null)

  const toggleEditMode = useCallback(() => {
    setIsEditing((current) => !current)
  }, [])

  const enterEditMode = useCallback(() => setIsEditing(true), [])
  const exitEditMode = useCallback(() => setIsEditing(false), [])

  const fetchImpl = fetcher ?? defaultFetch

  const value = useMemo(
    () => ({
      isEditing,
      activeEditableId,
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
      activeEditableId,
      toggleEditMode,
      enterEditMode,
      exitEditMode,
      graphqlEndpoint,
      graphqlHeaders,
      fetchImpl,
    ],
  )

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>
}

export function useEditMode() {
  return useContext(EditModeContext)
}

export { EditModeContext }
