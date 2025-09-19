import { useEffect, useRef } from 'react'
import { useAuth } from 'react-oidc-context'

const normalizeReturnTo = (value) => {
  if (!value) return undefined

  const fromObject = (input) => {
    if (!input || typeof input !== 'object') return undefined

    // URL instance
    if (typeof URL !== 'undefined' && input instanceof URL) {
      return input.toString()
    }

    const {
      returnTo,
      url,
      path,
      pathname,
      search,
      hash,
    } = input

    if (returnTo) {
      const normalized = normalizeReturnTo(returnTo)
      if (normalized) return normalized
    }

    if (url) {
      const normalized = normalizeReturnTo(url)
      if (normalized) return normalized
    }

    if (path) {
      const normalized = normalizeReturnTo(path)
      if (normalized) return normalized
    }

    if (pathname) {
      const searchPart = typeof search === 'string' ? search : ''
      const hashPart = typeof hash === 'string' ? hash : ''
      const combined = `${pathname}${searchPart}${hashPart}`
      if (combined.trim()) {
        return combined
      }
    }

    return undefined
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined

    try {
      const parsed = JSON.parse(trimmed)
      const normalized = normalizeReturnTo(parsed)
      if (normalized) return normalized
    } catch (e) {
      // Ignore JSON parse failures; treat as literal string fallback
    }

    return trimmed
  }

  return fromObject(value)
}

const computeTarget = ({
  redirectTo,
  user,
  storageValue,
}) => {
  const hints = [
    redirectTo,
    user?.state,
    user?.url_state,
    storageValue,
  ]

  for (const hint of hints) {
    const normalized = normalizeReturnTo(hint)
    if (normalized) return normalized
  }

  return undefined
}

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
          const storageValue =
            sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey)

          const target =
            computeTarget({ redirectTo, user: auth?.user, storageValue }) || '/'

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
