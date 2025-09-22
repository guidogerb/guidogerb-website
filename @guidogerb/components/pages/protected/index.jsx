import { Auth, useAuth } from '@guidogerb/components-auth'

const DEFAULT_PENDING_FALLBACK = (
  <div role="status" aria-live="polite">
    Protected Loading...
  </div>
)

const resolvePendingFallback = (fallback, context) => {
  if (typeof fallback === 'function') {
    const result = fallback(context)
    return result === undefined ? DEFAULT_PENDING_FALLBACK : result
  }

  if (fallback === undefined) {
    return DEFAULT_PENDING_FALLBACK
  }

  return fallback
}

function Guard({ children, fallback }) {
  const auth = useAuth()
  const isAuthenticated = Boolean(auth?.isAuthenticated)
  const status = auth?.error ? 'error' : isAuthenticated ? 'authenticated' : 'unauthenticated'

  if (auth?.error) return <div>Sign-in failed: {auth.error.message}</div>
  if (!isAuthenticated) {
    const fallbackElement = resolvePendingFallback(fallback, {
      auth,
      status,
      isLoading: Boolean(auth?.isLoading) || !isAuthenticated,
    })

    return fallbackElement === undefined ? DEFAULT_PENDING_FALLBACK : fallbackElement
  }
  return <>{children}</>
}

export default function Protected({ children, logoutUri, fallback }) {
  return (
    <Auth autoSignIn logoutUri={logoutUri}>
      <Guard fallback={fallback}>{children}</Guard>
    </Auth>
  )
}
