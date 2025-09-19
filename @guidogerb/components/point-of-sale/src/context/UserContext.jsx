import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'

const defaultState = {
  user: null,
  status: 'anonymous',
  loading: false,
}

const UserContext = createContext(null)

const userReducer = (state, action) => {
  switch (action.type) {
    case 'HYDRATE': {
      if (!action.payload) return state
      return {
        ...state,
        user: action.payload,
        status: action.payload ? 'authenticated' : 'anonymous',
        loading: false,
      }
    }
    case 'LOGIN': {
      const user = action.payload ?? null
      return {
        ...state,
        user,
        status: user ? 'authenticated' : 'anonymous',
        loading: false,
      }
    }
    case 'LOGOUT': {
      return {
        ...state,
        user: null,
        status: 'anonymous',
        loading: false,
      }
    }
    case 'UPDATE_PROFILE': {
      if (!state.user) return state
      return {
        ...state,
        user: { ...state.user, ...action.payload, updatedAt: Date.now() },
      }
    }
    case 'SET_STRIPE_CUSTOMER': {
      if (!state.user) return state
      return {
        ...state,
        user: { ...state.user, stripeCustomerId: action.payload },
      }
    }
    case 'SET_LOADING': {
      return { ...state, loading: Boolean(action.payload) }
    }
    default:
      return state
  }
}

const initState = (initialUser) => ({
  ...defaultState,
  user: initialUser ?? null,
  status: initialUser ? 'authenticated' : 'anonymous',
})

export function UserProvider({
  children,
  initialUser,
  storage,
  storageKey = 'guidogerb.pos.user',
} = {}) {
  const [state, dispatch] = useReducer(userReducer, initialUser, initState)

  useEffect(() => {
    if (!storage || !storageKey) return undefined
    const stored = storage.get?.(storageKey)
    if (stored) {
      dispatch({ type: 'HYDRATE', payload: stored })
    }
    if (!storage.subscribe) return undefined
    const unsubscribe = storage.subscribe((event) => {
      if (!event || event.key !== storageKey || event.type !== 'set') return
      dispatch({ type: 'HYDRATE', payload: event.value })
    })
    return unsubscribe
  }, [storage, storageKey])

  useEffect(() => {
    if (!storage || !storageKey) return
    storage.set?.(storageKey, state.user)
  }, [state.user, storage, storageKey])

  useEffect(() => {
    if (!initialUser) return
    dispatch({ type: 'HYDRATE', payload: initialUser })
  }, [initialUser])

  const login = useCallback((user) => {
    dispatch({ type: 'LOGIN', payload: user })
  }, [])

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' })
  }, [])

  const updateProfile = useCallback((updates) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: updates })
  }, [])

  const setStripeCustomerId = useCallback((customerId) => {
    dispatch({ type: 'SET_STRIPE_CUSTOMER', payload: customerId })
  }, [])

  const setLoading = useCallback((value) => {
    dispatch({ type: 'SET_LOADING', payload: value })
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      updateProfile,
      setStripeCustomerId,
      setLoading,
    }),
    [login, logout, setLoading, setStripeCustomerId, state, updateProfile],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export { UserContext }
