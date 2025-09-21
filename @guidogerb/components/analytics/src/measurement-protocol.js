const DEFAULT_ENDPOINT = 'https://www.google-analytics.com/mp/collect'
const DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect'

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const filterUndefinedEntries = (object) => {
  if (!isPlainObject(object)) {
    return undefined
  }

  const entries = Object.entries(object).filter(
    ([key, value]) => isNonEmptyString(key) && value !== undefined,
  )

  if (entries.length === 0) {
    return undefined
  }

  return Object.fromEntries(entries)
}

const normalizeUserProperties = (properties) => {
  if (!isPlainObject(properties)) {
    return undefined
  }

  const normalized = {}

  for (const [key, value] of Object.entries(properties)) {
    if (!isNonEmptyString(key)) {
      continue
    }

    if (value === undefined) {
      continue
    }

    if (isPlainObject(value) && value.value !== undefined) {
      const entry = { value: value.value }
      if (
        typeof value.setTimestampMicros === 'number' &&
        Number.isFinite(value.setTimestampMicros)
      ) {
        entry.set_timestamp_micros = Math.round(value.setTimestampMicros)
      }
      normalized[key] = entry
      continue
    }

    normalized[key] = { value }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

const mergeUserProperties = (base, override) => {
  if (!base && !override) {
    return undefined
  }

  return { ...(base ?? {}), ...(override ?? {}) }
}

const normalizeEvent = (event) => {
  if (!isPlainObject(event) || !isNonEmptyString(event.name)) {
    return null
  }

  const normalized = { name: event.name.trim() }

  const params = filterUndefinedEntries(event.params)
  if (params) {
    normalized.params = params
  }

  if (typeof event.timestampMicros === 'number' && Number.isFinite(event.timestampMicros)) {
    normalized.timestamp_micros = Math.round(event.timestampMicros)
  }

  return normalized
}

const buildEndpoint = (baseUrl, measurementId, apiSecret) => {
  const url = new URL(baseUrl ?? DEFAULT_ENDPOINT)
  url.searchParams.set('measurement_id', measurementId)
  url.searchParams.set('api_secret', apiSecret)
  return url.toString()
}

const resolveFetch = (customFetch) => {
  if (typeof customFetch === 'function') {
    return customFetch
  }

  if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis)
  }

  return undefined
}

export function createMeasurementProtocolClient(options = {}) {
  const {
    measurementId,
    apiSecret,
    fetch: fetchImplementation,
    endpoint = DEFAULT_ENDPOINT,
    debugEndpoint = DEBUG_ENDPOINT,
    clientId: defaultClientId,
    userId: defaultUserId,
    userProperties: defaultUserProperties,
    nonPersonalizedAds: defaultNonPersonalizedAds = false,
  } = options

  if (!isNonEmptyString(measurementId)) {
    throw new Error('measurementId is required to use the Measurement Protocol client')
  }

  if (!isNonEmptyString(apiSecret)) {
    throw new Error('apiSecret is required to use the Measurement Protocol client')
  }

  const fetchFn = resolveFetch(fetchImplementation)
  if (typeof fetchFn !== 'function') {
    throw new Error('A fetch implementation is required to send Measurement Protocol events')
  }

  const defaultUserProps = normalizeUserProperties(defaultUserProperties)

  const sendEvents = async (payload = {}) => {
    const {
      events = [],
      clientId = defaultClientId,
      userId = defaultUserId,
      userProperties,
      timestampMicros,
      nonPersonalizedAds,
      debug = false,
    } = payload

    const normalizedEvents = []
    for (const event of events) {
      const normalized = normalizeEvent(event)
      if (normalized) {
        normalizedEvents.push(normalized)
      }
    }

    if (normalizedEvents.length === 0) {
      throw new Error('At least one event with a valid name is required')
    }

    if (!isNonEmptyString(clientId) && !isNonEmptyString(userId)) {
      throw new Error('A clientId or userId must be provided to send Measurement Protocol events')
    }

    const body = { events: normalizedEvents }

    if (isNonEmptyString(clientId)) {
      body.client_id = clientId
    }

    if (isNonEmptyString(userId)) {
      body.user_id = userId
    }

    if (typeof timestampMicros === 'number' && Number.isFinite(timestampMicros)) {
      body.timestamp_micros = Math.round(timestampMicros)
    }

    const mergedUserProps = mergeUserProperties(defaultUserProps, normalizeUserProperties(userProperties))
    if (mergedUserProps) {
      body.user_properties = mergedUserProps
    }

    const resolvedNonPersonalized =
      nonPersonalizedAds !== undefined ? nonPersonalizedAds : defaultNonPersonalizedAds
    if (resolvedNonPersonalized === true) {
      body.non_personalized_ads = true
    }

    const url = buildEndpoint(debug ? debugEndpoint : endpoint, measurementId, apiSecret)

    return fetchFn(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  const sendEvent = async ({ name, params, timestampMicros, ...rest }) => {
    const event = { name, params, timestampMicros }
    return sendEvents({ ...rest, events: [event] })
  }

  return {
    sendEvent,
    sendEvents,
  }
}

export { DEFAULT_ENDPOINT as MEASUREMENT_PROTOCOL_ENDPOINT }
export { DEBUG_ENDPOINT as MEASUREMENT_PROTOCOL_DEBUG_ENDPOINT }
