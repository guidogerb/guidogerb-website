import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'

const GA_ENDPOINT = 'https://www.googletagmanager.com/gtag/js'
const SCRIPT_ATTR = 'data-gg-analytics-loader'

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0
const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const noop = () => {}

export const AnalyticsContext = createContext({
  gtag: noop,
  trackEvent: noop,
  pageView: noop,
  setUserProperties: noop,
  setUserId: noop,
  consent: noop,
  getConsentHistory: () => [],
  getLastConsentEvent: () => null,
  subscribeToConsent: () => noop,
})

export const useAnalytics = () => useContext(AnalyticsContext)

const ensureScript = (measurementId) => {
  const selector = `script[${SCRIPT_ATTR}="${measurementId}"]`
  const existingScript = document.querySelector(selector)
  if (existingScript) {
    return existingScript
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `${GA_ENDPOINT}?id=${encodeURIComponent(measurementId)}`
  script.setAttribute(SCRIPT_ATTR, measurementId)
  document.head.appendChild(script)
  return script
}

const ensureGtag = (measurementId) => {
  if (!isBrowser() || !isNonEmptyString(measurementId)) {
    return undefined
  }

  window.dataLayer = window.dataLayer || []

  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args) {
      window.dataLayer.push(args)
    }
  }

  return window.gtag
}

const buildConfig = ({ debugMode, sendPageView, config }) => {
  if (!isPlainObject(config)) {
    config = {}
  }

  const merged = { ...config }

  if (debugMode) {
    merged.debug_mode = true
  }

  if (sendPageView === false && merged.send_page_view === undefined) {
    merged.send_page_view = false
  }

  return merged
}

const pushInitialEvents = (events) => {
  if (!Array.isArray(events)) return

  for (const event of events) {
    if (!isPlainObject(event) || !isNonEmptyString(event.name)) continue

    const params = isPlainObject(event.params) ? event.params : {}
    window.gtag('event', event.name, params)
  }
}

const Analytics = ({
  measurementId,
  debugMode = false,
  sendPageView = true,
  defaultConsent,
  config,
  initialEvents = [],
  onConsentEvent,
  children,
}) => {
  const consentHistoryRef = useRef([])
  const consentListenersRef = useRef(new Set())
  const onConsentEventRef = useRef(onConsentEvent)
  const lastDefaultConsentRef = useRef(null)

  onConsentEventRef.current = onConsentEvent

  useEffect(() => {
    consentHistoryRef.current = []
    lastDefaultConsentRef.current = null
  }, [measurementId])

  const getLastConsentEvent = useCallback(() => {
    const history = consentHistoryRef.current
    return history.length > 0 ? history[history.length - 1] : null
  }, [])

  const getConsentHistory = useCallback(
    () => consentHistoryRef.current.slice(),
    [],
  )

  const subscribeToConsent = useCallback((listener) => {
    if (typeof listener !== 'function') {
      return () => {}
    }
    consentListenersRef.current.add(listener)
    if (consentHistoryRef.current.length > 0) {
      const snapshot = consentHistoryRef.current.slice()
      const lastEvent = snapshot[snapshot.length - 1]
      try {
        listener(lastEvent, snapshot)
      } catch (error) {
        // Ignore listener errors so subscriptions remain safe.
      }
    }
    return () => {
      consentListenersRef.current.delete(listener)
    }
  }, [])

  const notifyConsentEvent = useCallback(({ type, mode, settings }) => {
    const eventType = type === 'update' ? 'update' : 'default'
    const resolvedMode =
      isNonEmptyString(mode) && mode !== 'default'
        ? mode
        : eventType === 'update'
        ? 'update'
        : 'default'
    const normalizedSettings = isPlainObject(settings) ? { ...settings } : {}

    const event = {
      type: eventType,
      mode: resolvedMode,
      settings: normalizedSettings,
      timestamp: Date.now(),
    }

    consentHistoryRef.current.push(event)
    const snapshot = consentHistoryRef.current.slice()

    consentListenersRef.current.forEach((listener) => {
      try {
        listener(event, snapshot)
      } catch (error) {
        // Swallow listener errors so they do not break analytics handling.
      }
    })

    const handler = onConsentEventRef.current
    if (typeof handler === 'function') {
      handler(event, snapshot)
    }

    return event
  }, [])

  const contextValue = useMemo(() => {
    const callGtag = (...args) => {
      if (!isBrowser() || !isNonEmptyString(measurementId)) return

      if (typeof window.gtag === 'function') {
        window.gtag(...args)
      } else {
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push(args)
      }
    }

    return {
      gtag: callGtag,
      trackEvent: (name, params = {}) => {
        if (!isNonEmptyString(name)) return
        const eventParams = isPlainObject(params) ? params : {}
        callGtag('event', name, eventParams)
      },
      pageView: (pathOrOptions, params = {}) => {
        if (isNonEmptyString(pathOrOptions)) {
          const eventParams = isPlainObject(params) ? params : {}
          callGtag('event', 'page_view', {
            page_path: pathOrOptions,
            ...eventParams,
          })
        } else {
          const options = isPlainObject(pathOrOptions) ? pathOrOptions : {}
          callGtag('event', 'page_view', { ...options, ...(isPlainObject(params) ? params : {}) })
        }
      },
      setUserProperties: (properties) => {
        if (!isPlainObject(properties)) return
        callGtag('set', 'user_properties', properties)
      },
      setUserId: (userId) => {
        if (userId === null) {
          callGtag('set', { user_id: null })
          return
        }

        if (!isNonEmptyString(userId)) return
        callGtag('set', { user_id: userId })
      },
      consent: (mode, settings) => {
        if (!isPlainObject(settings)) return
        const normalizedMode = isNonEmptyString(mode) ? mode : 'default'
        const normalizedSettings = { ...settings }
        callGtag('consent', normalizedMode, normalizedSettings)
        notifyConsentEvent({
          type: normalizedMode === 'default' ? 'default' : 'update',
          mode: normalizedMode,
          settings: normalizedSettings,
        })
      },
      getConsentHistory,
      getLastConsentEvent,
      subscribeToConsent,
    }
  }, [
    getConsentHistory,
    getLastConsentEvent,
    measurementId,
    notifyConsentEvent,
    subscribeToConsent,
  ])

  useEffect(() => {
    if (!isBrowser() || !isNonEmptyString(measurementId)) {
      return undefined
    }

    const gtag = ensureGtag(measurementId)
    ensureScript(measurementId)

    gtag('js', new Date())

    if (isPlainObject(defaultConsent)) {
      const serializedDefault = JSON.stringify(defaultConsent)
      if (lastDefaultConsentRef.current !== serializedDefault) {
        gtag('consent', 'default', defaultConsent)
        notifyConsentEvent({
          type: 'default',
          mode: 'default',
          settings: defaultConsent,
        })
        lastDefaultConsentRef.current = serializedDefault
      }
    } else {
      lastDefaultConsentRef.current = null
    }

    const mergedConfig = buildConfig({ debugMode, sendPageView, config })
    if (Object.keys(mergedConfig).length > 0) {
      gtag('config', measurementId, mergedConfig)
    } else {
      gtag('config', measurementId)
    }

    pushInitialEvents(initialEvents)

    return undefined
  }, [
    measurementId,
    debugMode,
    sendPageView,
    defaultConsent,
    config,
    initialEvents,
    notifyConsentEvent,
  ])

  return (
    <AnalyticsContext.Provider value={contextValue}>{children ?? null}</AnalyticsContext.Provider>
  )
}

export default Analytics
