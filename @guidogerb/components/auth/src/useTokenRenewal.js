import { useAuth } from 'react-oidc-context'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function toError(value) {
  if (value instanceof Error) return value
  if (value && typeof value === 'object' && 'message' in value) {
    return new Error(String(value.message))
  }
  return new Error(typeof value === 'string' ? value : 'Silent token renewal failed')
}

export function useTokenRenewal({ earlyRefreshMs = 60_000 } = {}) {
  const auth = useAuth()
  const [isRenewing, setIsRenewing] = useState(false)
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [error, setError] = useState(null)
  const [lastRenewal, setLastRenewal] = useState(null)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const timersRef = useRef({ early: null, expire: null })

  const expiresAtMs = auth?.user?.expires_at ? auth.user.expires_at * 1000 : null

  useEffect(() => {
    return () => {
      if (timersRef.current.early) {
        clearTimeout(timersRef.current.early)
        timersRef.current.early = null
      }
      if (timersRef.current.expire) {
        clearTimeout(timersRef.current.expire)
        timersRef.current.expire = null
      }
    }
  }, [])

  useEffect(() => {
    if (timersRef.current.early) {
      clearTimeout(timersRef.current.early)
      timersRef.current.early = null
    }
    if (timersRef.current.expire) {
      clearTimeout(timersRef.current.expire)
      timersRef.current.expire = null
    }

    if (!expiresAtMs) {
      setIsExpiringSoon(false)
      setIsExpired(false)
      return undefined
    }

    setIsExpiringSoon(false)
    setIsExpired(false)

    const now = Date.now()
    const earlyDelay = expiresAtMs - earlyRefreshMs - now
    const expireDelay = expiresAtMs - now

    if (earlyDelay <= 0) {
      setIsExpiringSoon(true)
    } else {
      timersRef.current.early = setTimeout(() => {
        setIsExpiringSoon(true)
      }, earlyDelay)
    }

    if (expireDelay <= 0) {
      setIsExpired(true)
      setIsRenewing(false)
    } else {
      timersRef.current.expire = setTimeout(() => {
        setIsExpired(true)
        setIsRenewing(false)
      }, expireDelay)
    }

    return () => {
      if (timersRef.current.early) {
        clearTimeout(timersRef.current.early)
        timersRef.current.early = null
      }
      if (timersRef.current.expire) {
        clearTimeout(timersRef.current.expire)
        timersRef.current.expire = null
      }
    }
  }, [expiresAtMs, earlyRefreshMs])

  useEffect(() => {
    if (!expiresAtMs) {
      setNowTick(Date.now())
      return undefined
    }

    const interval = setInterval(() => {
      setNowTick(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAtMs])

  useEffect(() => {
    const events = auth?.events
    if (!events) return undefined

    const handleExpiring = () => {
      setIsExpiringSoon(true)
      setIsExpired(false)
    }

    const handleExpired = () => {
      setIsExpired(true)
      setIsRenewing(false)
    }

    const handleUserLoaded = () => {
      setIsExpiringSoon(false)
      setIsExpired(false)
      setIsRenewing(false)
      setError(null)
      setLastRenewal(new Date())
    }

    const handleSilentError = (err) => {
      const normalized = toError(err)
      setError(normalized)
      setIsRenewing(false)
    }

    events.addAccessTokenExpiring?.(handleExpiring)
    events.addAccessTokenExpired?.(handleExpired)
    events.addUserLoaded?.(handleUserLoaded)
    events.addSilentRenewError?.(handleSilentError)

    return () => {
      events.removeAccessTokenExpiring?.(handleExpiring)
      events.removeAccessTokenExpired?.(handleExpired)
      events.removeUserLoaded?.(handleUserLoaded)
      events.removeSilentRenewError?.(handleSilentError)
    }
  }, [auth?.events])

  useEffect(() => {
    if (!auth?.user) {
      setIsRenewing(false)
      setIsExpiringSoon(false)
      setIsExpired(false)
      setError(null)
      setLastRenewal(null)
    }
  }, [auth?.user])

  const renew = useCallback(async () => {
    if (!auth || typeof auth.signinSilent !== 'function') {
      const err = new Error('Silent token renewal is not available in this environment')
      setError(err)
      throw err
    }

    try {
      setIsRenewing(true)
      setError(null)
      const result = await auth.signinSilent()
      setIsRenewing(false)
      setIsExpired(false)
      setIsExpiringSoon(false)
      setLastRenewal(new Date())
      return result
    } catch (err) {
      const normalized = toError(err)
      setIsRenewing(false)
      setError(normalized)
      throw normalized
    }
  }, [auth])

  const expiresAt = useMemo(() => (expiresAtMs ? new Date(expiresAtMs) : null), [expiresAtMs])
  const expiresIn = useMemo(() => {
    if (!expiresAtMs) return null
    return Math.max(0, expiresAtMs - nowTick)
  }, [expiresAtMs, nowTick])

  return useMemo(
    () => ({
      renew,
      isRenewing,
      isExpiringSoon,
      isExpired,
      shouldRenew: Boolean(isExpired || isExpiringSoon),
      error,
      expiresAt,
      expiresIn,
      lastRenewal,
      user: auth?.user ?? null,
    }),
    [
      renew,
      isRenewing,
      isExpiringSoon,
      isExpired,
      error,
      expiresAt,
      expiresIn,
      lastRenewal,
      auth?.user,
    ],
  )
}

export default useTokenRenewal
