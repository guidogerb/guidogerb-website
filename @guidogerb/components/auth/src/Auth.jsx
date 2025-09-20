import { useEffect, useRef } from 'react'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import SignOutControl from './SignOutControl.jsx'

// Auth wrapper component: guards its children behind OIDC authentication
// Usage: <Auth autoSignIn><Protected /></Auth>
const renderFallback = (fallback, context) => {
  if (fallback === null || fallback === undefined) {
    return fallback
  }

  if (typeof fallback === 'function') {
    return fallback(context)
  }

  return fallback
}

function Auth({
  children,
  autoSignIn = false,
  logoutUri,
  showSignOut,
  signOutButtonProps = {},
  signOutControlProps = {},
  loadingFallback,
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
    const renderedFallback = renderFallback(loadingFallback, { auth })

    if (renderedFallback !== undefined) {
      return renderedFallback
    }

    return (
      <div role="status" aria-live="polite" className="gg-auth__loading">
        Loading...
      </div>
    )
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
        signOutButtonProps?.redirectUri === undefined ? logoutUri : signOutButtonProps.redirectUri,
      containerStyle: signOutButtonProps?.containerStyle
        ? { ...defaultContainerStyle, ...signOutButtonProps.containerStyle }
        : defaultContainerStyle,
    }

    const {
      buttonProps: controlButtonProps,
      user: providedUser,
      ...restControlProps
    } = signOutControlProps ?? {}

    const finalButtonProps = controlButtonProps
      ? {
          ...mergedSignOutProps,
          ...controlButtonProps,
          containerStyle: controlButtonProps.containerStyle
            ? { ...mergedSignOutProps.containerStyle, ...controlButtonProps.containerStyle }
            : mergedSignOutProps.containerStyle,
        }
      : mergedSignOutProps

    return (
      <div>
        {children ?? null}
        {shouldShowSignOut ? (
          <SignOutControl
            {...restControlProps}
            user={providedUser ?? auth?.user ?? null}
            buttonProps={finalButtonProps}
          />
        ) : null}
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
