import { createContext, useContext, useEffect, useMemo } from 'react'

const GA_ENDPOINT = 'https://www.googletagmanager.com/gtag/js'
const SCRIPT_ATTR = 'data-gg-analytics-loader'

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const noop = () => {}

export const AnalyticsContext = createContext({
  gtag: noop,
  trackEvent: noop,
  pageView: noop,
  setUserProperties: noop,
  setUserId: noop,
  consent: noop,
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
  children,
}) => {
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
        callGtag('consent', normalizedMode, settings)
      },
    }
  }, [measurementId])

  useEffect(() => {
    if (!isBrowser() || !isNonEmptyString(measurementId)) {
      return undefined
    }

    const gtag = ensureGtag(measurementId)
    ensureScript(measurementId)

    gtag('js', new Date())

    if (isPlainObject(defaultConsent)) {
      gtag('consent', 'default', defaultConsent)
    }

    const mergedConfig = buildConfig({ debugMode, sendPageView, config })
    if (Object.keys(mergedConfig).length > 0) {
      gtag('config', measurementId, mergedConfig)
    } else {
      gtag('config', measurementId)
    }

    pushInitialEvents(initialEvents)

    return undefined
  }, [measurementId, debugMode, sendPageView, defaultConsent, config, initialEvents])

  return <AnalyticsContext.Provider value={contextValue}>{children ?? null}</AnalyticsContext.Provider>
}

export default Analytics
