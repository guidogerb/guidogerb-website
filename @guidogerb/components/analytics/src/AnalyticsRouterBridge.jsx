import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { useAnalytics } from './Analytics.jsx'

const defaultShouldTrack = () => true

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

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
    getPath,
    getParams: paramsBuilder,
    shouldTrack = defaultShouldTrack,
    onTrack,
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

    lastTrackedKeyRef.current = historyKey
    lastTrackedPathRef.current = path

    const context = { location, navigationType, path, isInitial }

    if (typeof shouldTrack === 'function' && !shouldTrack(context)) {
      return
    }

    const defaults = buildDefaultParams()
    let extraParams = {}
    if (typeof paramsBuilder === 'function') {
      extraParams = paramsBuilder(context)
    } else if (isPlainObject(paramsBuilder)) {
      extraParams = paramsBuilder
    }

    const params = normalizeParams({
      ...defaults,
      ...(isPlainObject(extraParams) ? extraParams : {}),
    })

    analytics.pageView(path, params)

    if (typeof onTrack === 'function') {
      onTrack({ ...context, params })
    }
  }, [
    analytics,
    getPath,
    hash,
    includeHash,
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
