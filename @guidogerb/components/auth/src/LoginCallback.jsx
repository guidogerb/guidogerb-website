import { useEffect, useRef } from 'react'
import { useAuth } from 'react-oidc-context'

export default function LoginCallback({ redirectTo, storageKey = 'auth:returnTo' }) {
  const auth = useAuth()
  const callbackDoneRef = useRef(false)

  useEffect(() => {
    let canceled = false

    const finalize = async () => {
      if (canceled) return

      const hasAuthResponse = /[?&#](code|id_token|access_token|state)=/.test(window.location.href)

      try {
        // Finalize the redirect response once
        if (
          hasAuthResponse &&
          typeof auth?.signinRedirectCallback === 'function' &&
          !callbackDoneRef.current
        ) {
          callbackDoneRef.current = true
          await auth.signinRedirectCallback()
        }

        // When authenticated, compute destination and redirect
        if (auth?.isAuthenticated) {
          const fromState =
            auth?.user?.state?.returnTo || auth?.user?.state?.url || auth?.user?.state?.path

          const fromStorage = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey)

          const target = redirectTo || fromState || fromStorage || '/'

          // Cleanup any stored hint
          sessionStorage.removeItem(storageKey)
          localStorage.removeItem(storageKey)

          if (!canceled) {
            // Replace to avoid keeping the callback URL in history
            window.location.replace(target)
          }
        }
      } catch (e) {
        console.error('Error during login callback handling:', e)
      }
    }

    finalize()
    return () => {
      canceled = true
    }
  }, [auth, redirectTo, storageKey])

  if (auth?.error) {
    return <div>Sign-in failed: {auth.error.message}</div>
  }

  return <div>Completing sign-in...</div>
}
