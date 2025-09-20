import { useEffect, useRef } from 'react'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import SignOutButton from './SignOutButton.jsx'

// Auth wrapper component: guards its children behind OIDC authentication
// Usage: <Auth autoSignIn><Protected /></Auth>
function Auth({
  children,
  autoSignIn = false,
  logoutUri,
  showSignOut,
  signOutButtonProps = {},
}) {
  const auth = useOidcAuth()
  const redirectStartedRef = useRef(false)

  // Avoid calling signinRedirect in render and guard for StrictMode double-invocation
  useEffect(() => {
    if (autoSignIn && !auth?.isAuthenticated && !auth?.isLoading && !redirectStartedRef.current) {
      redirectStartedRef.current = true
      auth?.signinRedirect()
    }
  }, [autoSignIn, auth?.isAuthenticated, auth?.isLoading]) // removed "auth" object from deps

  if (auth?.isLoading) {
    return <div>Loading...</div>
  }

  if (auth?.error) {
    return (
      <div>
        Encountering error... {auth?.error?.message}
        <div style={{ marginTop: 8, color: '#a00' }}>Hint: ensure OIDC is configured.</div>
      </div>
    )
  }

  if (auth?.isAuthenticated) {
    const shouldShowSignOut = showSignOut ?? Boolean(logoutUri)
    const defaultContainerStyle = { marginTop: '1.5rem' }
    const mergedSignOutProps = {
      ...signOutButtonProps,
      redirectUri:
        signOutButtonProps?.redirectUri === undefined
          ? logoutUri
          : signOutButtonProps.redirectUri,
      containerStyle: signOutButtonProps?.containerStyle
        ? { ...defaultContainerStyle, ...signOutButtonProps.containerStyle }
        : defaultContainerStyle,
    }

    return (
      <div>
        {children ?? null}
        {shouldShowSignOut ? <SignOutButton {...mergedSignOutProps} /> : null}
      </div>
    )
  }

  if (autoSignIn) {
    // Redirect will be triggered by effect
    return null
  }

  // Fallback UI when not authenticated
  return (
    <div>
      <button onClick={() => auth?.signinRedirect()}>Sign in</button>
    </div>
  )
}

export { useAuth } from 'react-oidc-context'
export default Auth
