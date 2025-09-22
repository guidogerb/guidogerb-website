import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { useAnalytics } from './Analytics.jsx'

const defaultShouldTrack = () => true

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const buildDefaultParams = () => {
  const params = {}

  if (
    typeof document !== 'undefined' &&
    typeof document.title === 'string' &&
    document.title.length > 0
  ) {
    params.page_title = document.title
  }

  if (typeof window !== 'undefined' && window.location) {
    params.page_location = window.location.href
  }

  return params
}

const normalizeParams = (value) => {
  if (!isPlainObject(value)) return {}
  const entries = Object.entries(value).filter(([, paramValue]) => paramValue !== undefined)
  return Object.fromEntries(entries)
}

export function useAnalyticsPageViews(options = {}) {
  const {
    trackInitialPageView = false,
    includeSearch = true,
    includeHash = false,
    includeReferrer = true,
    getPath,
    getReferrer,
    getParams: paramsBuilder,
    shouldTrack = defaultShouldTrack,
    onTrack,
    eventName = 'page_view',
  } = options

  const analytics = useAnalytics()
  const location = useLocation()
  const navigationType = useNavigationType()
  const lastTrackedKeyRef = useRef()
  const lastTrackedPathRef = useRef()
  const hasInitializedRef = useRef(false)

  const { key, pathname, search, hash } = location

  useEffect(() => {
    const historyKey = key ?? 'default'

    let resolvedPath
    if (typeof getPath === 'function') {
      resolvedPath = getPath({ location, navigationType })
    } else {
      const segments = [typeof pathname === 'string' && pathname.length > 0 ? pathname : '/']
      if (includeSearch && typeof search === 'string' && search.length > 0) {
        segments.push(search)
      }
      if (includeHash && typeof hash === 'string' && hash.length > 0) {
        segments.push(hash)
      }
      resolvedPath = segments.join('')
    }

    if (typeof resolvedPath !== 'string') {
      return
    }

    const path = resolvedPath.length > 0 ? resolvedPath : '/'

    const isInitial = !hasInitializedRef.current
    if (isInitial) {
      hasInitializedRef.current = true
    }

    if (isInitial && trackInitialPageView !== true) {
      lastTrackedKeyRef.current = historyKey
      lastTrackedPathRef.current = path
      return
    }

    if (lastTrackedKeyRef.current === historyKey && lastTrackedPathRef.current === path) {
      return
    }

    const previousPath = lastTrackedPathRef.current
    lastTrackedKeyRef.current = historyKey
    lastTrackedPathRef.current = path

    const context = { location, navigationType, path, isInitial, previousPath }

    if (typeof shouldTrack === 'function' && !shouldTrack(context)) {
      return
    }

    const defaults = buildDefaultParams()
    let referrer
    if (typeof getReferrer === 'function') {
      referrer = getReferrer(context)
    } else if (includeReferrer && isNonEmptyString(previousPath) && previousPath !== path) {
      referrer = previousPath
    }
    if (isNonEmptyString(referrer)) {
      defaults.page_referrer = referrer
    }
    let extraParams = {}
    if (typeof paramsBuilder === 'function') {
      extraParams = paramsBuilder(context)
    } else if (isPlainObject(paramsBuilder)) {
      extraParams = paramsBuilder
    }

    const baseParams = normalizeParams({
      ...defaults,
      ...(isPlainObject(extraParams) ? extraParams : {}),
    })

    const params =
      typeof baseParams.page_path === 'string' && baseParams.page_path.length > 0
        ? baseParams
        : { ...baseParams, page_path: path }

    const isCustomEvent = typeof eventName === 'string' && eventName !== 'page_view'

    if (isCustomEvent && typeof analytics.trackEvent === 'function') {
      analytics.trackEvent(eventName, params)
    } else if (typeof analytics.pageView === 'function') {
      analytics.pageView(path, params)
    }

    if (typeof onTrack === 'function') {
      onTrack({ ...context, params })
    }
  }, [
    analytics,
    eventName,
    getPath,
    getReferrer,
    hash,
    includeHash,
    includeReferrer,
    includeSearch,
    key,
    navigationType,
    onTrack,
    paramsBuilder,
    pathname,
    search,
    shouldTrack,
    trackInitialPageView,
  ])
}

export function AnalyticsRouterBridge(options = {}) {
  useAnalyticsPageViews(options)
  return null
}

export default AnalyticsRouterBridge
