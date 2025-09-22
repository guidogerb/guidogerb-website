import { createStorageController } from './createStorageController.js'

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const cloneValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneValue(entry))
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]))
  }

  return value
}

const mergeInto = (target, source) => {
  if (!isPlainObject(source)) return target

  Object.entries(source).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      target[key] = value.map((entry) => cloneValue(entry))
      return
    }

    if (isPlainObject(value)) {
      const base = isPlainObject(target[key]) ? cloneValue(target[key]) : {}
      target[key] = mergeInto(base, value)
      return
    }

    if (value === undefined) {
      delete target[key]
      return
    }

    target[key] = value
  })

  return target
}

const deepFreeze = (value) => {
  if (Array.isArray(value)) {
    value.forEach((entry) => deepFreeze(entry))
    return Object.freeze(value)
  }

  if (isPlainObject(value)) {
    Object.values(value).forEach((entry) => deepFreeze(entry))
    return Object.freeze(value)
  }

  return value
}

const deepEqual = (a, b) => {
  if (Object.is(a, b)) return true

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let index = 0; index < a.length; index += 1) {
      if (!deepEqual(a[index], b[index])) return false
    }
    return true
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false
      if (!deepEqual(a[key], b[key])) return false
    }
    return true
  }

  return false
}

const normalizePreferences = (value, defaults) => {
  const base = isPlainObject(defaults) ? cloneValue(defaults) : {}
  if (isPlainObject(value)) {
    mergeInto(base, value)
  }
  return base
}

export const CACHE_PREFERENCE_CHANNEL_NAME = '@guidogerb/cache-preferences'
export const CACHE_PREFERENCE_MESSAGE_TYPE = '@guidogerb/cache-preferences/update'
export const CACHE_PREFERENCE_SYNC_REQUEST_TYPE = '@guidogerb/cache-preferences/request-sync'
export const CACHE_PREFERENCE_STORAGE_KEY = 'cache.preferences'
export const CACHE_PREFERENCE_VERSION = 1

export const DEFAULT_CACHE_PREFERENCES = deepFreeze({
  assets: {
    enabled: true,
    strategy: 'stale-while-revalidate',
    precache: [],
  },
  api: {
    enabled: true,
    strategy: 'network-first',
    maxAgeSeconds: 300,
    staleWhileRevalidateSeconds: 300,
  },
  prefetch: {
    enabled: false,
    urls: [],
  },
})

const resolveBroadcastChannel = ({ channelName, broadcastChannelFactory, logger }) => {
  if (typeof broadcastChannelFactory === 'function') {
    try {
      return broadcastChannelFactory(channelName)
    } catch (error) {
      if (logger?.warn) {
        logger.warn('[storage] Failed to create cache preference broadcast channel', error)
      }
    }
  }

  if (typeof globalThis !== 'undefined' && typeof globalThis.BroadcastChannel === 'function') {
    try {
      return new globalThis.BroadcastChannel(channelName)
    } catch (error) {
      if (logger?.warn) {
        logger.warn('[storage] BroadcastChannel creation failed', error)
      }
    }
  }

  return null
}

const safeNotify = (listeners, logger, event) => {
  listeners.forEach((listener) => {
    try {
      listener(event)
    } catch (error) {
      if (logger?.warn) {
        logger.warn('[storage] Cache preference listener threw an error', error)
      }
    }
  })
}

export const createCachePreferenceChannel = (options = {}) => {
  const {
    storageController,
    createController = () =>
      createStorageController({ namespace: 'gg.preferences', area: 'local', logger }),
    persist = true,
    storageKey = CACHE_PREFERENCE_STORAGE_KEY,
    channelName = CACHE_PREFERENCE_CHANNEL_NAME,
    broadcastChannelFactory,
    logger = console,
    defaultPreferences = DEFAULT_CACHE_PREFERENCES,
    initialPreferences,
    provideSync = persist || initialPreferences !== undefined,
    sourceId = `cache-pref-${Math.random().toString(16).slice(2)}`,
  } = options ?? {}

  const controller = persist ? (storageController ?? createController()) : null

  const readInitial = () => {
    if (initialPreferences) {
      return initialPreferences
    }

    if (controller && typeof controller.get === 'function') {
      const stored = controller.get(storageKey)
      if (stored !== undefined) {
        return stored
      }
      return controller.get(storageKey, defaultPreferences)
    }

    return defaultPreferences
  }

  let current = deepFreeze(normalizePreferences(readInitial(), defaultPreferences))
  let isDestroyed = false
  let suppressStorageEvents = 0

  const listeners = new Set()
  const broadcast = resolveBroadcastChannel({ channelName, broadcastChannelFactory, logger })
  const canProvideSnapshots = Boolean(provideSync)

  const notify = (event) => {
    if (isDestroyed) return
    safeNotify(listeners, logger, event)
  }

  const commit = (
    value,
    {
      origin = 'local',
      persist: shouldPersist = persist,
      broadcast: shouldBroadcast = true,
      timestamp,
      emitter,
    } = {},
  ) => {
    const normalized = normalizePreferences(value, defaultPreferences)
    if (deepEqual(normalized, current)) {
      return current
    }

    const previous = current
    const frozen = deepFreeze(normalized)
    current = frozen

    if (shouldPersist && controller && typeof controller.set === 'function') {
      suppressStorageEvents += 1
      try {
        controller.set(storageKey, frozen)
      } catch (error) {
        current = previous
        suppressStorageEvents -= 1
        throw error
      }
      suppressStorageEvents -= 1
    }

    const eventTimestamp = typeof timestamp === 'number' ? timestamp : Date.now()
    const eventEmitter = emitter ?? sourceId
    const event = Object.freeze({
      type: CACHE_PREFERENCE_MESSAGE_TYPE,
      preferences: frozen,
      origin,
      timestamp: eventTimestamp,
      version: CACHE_PREFERENCE_VERSION,
      source: sourceId,
      emitter: eventEmitter,
    })

    notify(event)

    if (shouldBroadcast) {
      broadcastPreferences({
        origin,
        emitter: eventEmitter,
        timestamp: eventTimestamp,
        preferences: frozen,
      })
    }

    return frozen
  }

  const setPreferences = (value, options) => commit(value, options)

  const updatePreferences = (patch, options = {}) => {
    if (patch == null) {
      return current
    }

    const withOrigin = { ...options, origin: options.origin ?? 'local' }

    if (typeof patch === 'function') {
      const draft = cloneValue(current)
      const result = patch(draft)
      if (result === undefined) {
        return commit(draft, withOrigin)
      }
      return commit(result, withOrigin)
    }

    if (!isPlainObject(patch)) {
      return commit(patch, withOrigin)
    }

    const base = cloneValue(current)
    mergeInto(base, patch)
    return commit(base, withOrigin)
  }

  const resetPreferences = (options) => commit(defaultPreferences, options)

  const getPreferences = () => current

  const postBroadcast = (payload, warnMessage) => {
    if (!broadcast || typeof broadcast.postMessage !== 'function') return false

    try {
      broadcast.postMessage(payload)
      return true
    } catch (error) {
      if (logger?.warn) {
        logger.warn(warnMessage ?? '[storage] Failed to broadcast cache preferences', error)
      }
      return false
    }
  }

  const broadcastPreferences = ({
    origin = 'local',
    emitter,
    timestamp,
    preferences = current,
  } = {}) => {
    return postBroadcast(
      {
        type: CACHE_PREFERENCE_MESSAGE_TYPE,
        preferences: cloneValue(preferences),
        origin,
        timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
        version: CACHE_PREFERENCE_VERSION,
        source: sourceId,
        emitter: emitter ?? sourceId,
      },
      '[storage] Failed to broadcast cache preferences',
    )
  }

  const requestSync = ({ emitter } = {}) => {
    return postBroadcast(
      {
        type: CACHE_PREFERENCE_SYNC_REQUEST_TYPE,
        timestamp: Date.now(),
        version: CACHE_PREFERENCE_VERSION,
        source: sourceId,
        emitter: emitter ?? sourceId,
      },
      '[storage] Failed to request cache preference sync',
    )
  }

  const handleMessage = (event) => {
    const message = event?.data
    if (!message || typeof message !== 'object') return

    if (message.type === CACHE_PREFERENCE_MESSAGE_TYPE) {
      if (message.source === sourceId) return

      commit(message.preferences, {
        origin: 'broadcast',
        persist,
        broadcast: false,
        timestamp: message.timestamp,
        emitter: message.emitter ?? message.source,
      })
      return
    }

    if (message.type === CACHE_PREFERENCE_SYNC_REQUEST_TYPE) {
      if (!canProvideSnapshots) return
      if (message.source === sourceId) return

      broadcastPreferences({
        origin: 'sync',
        emitter: message.emitter ?? message.source,
      })
    }
  }

  if (broadcast && typeof broadcast.addEventListener === 'function') {
    broadcast.addEventListener('message', handleMessage)
  }

  let unsubscribeStorage = null
  if (persist && controller && typeof controller.subscribe === 'function') {
    unsubscribeStorage = controller.subscribe((event) => {
      if (!event || suppressStorageEvents > 0) return
      if (event.type === 'clear') {
        commit(defaultPreferences, {
          origin: 'storage',
          persist: false,
          broadcast: true,
        })
        return
      }

      if (event.key !== storageKey) return

      if (event.type === 'remove') {
        commit(defaultPreferences, {
          origin: 'storage',
          persist: false,
          broadcast: true,
        })
        return
      }

      if (event.type === 'set') {
        commit(event.value ?? controller.get(storageKey, defaultPreferences), {
          origin: 'storage',
          persist: false,
          broadcast: true,
        })
      }
    })
  }

  const subscribe = (listener, { emitInitial = false } = {}) => {
    if (typeof listener !== 'function') return () => {}
    listeners.add(listener)

    if (emitInitial) {
      const initialEvent = Object.freeze({
        type: CACHE_PREFERENCE_MESSAGE_TYPE,
        preferences: current,
        origin: 'initial',
        timestamp: Date.now(),
        version: CACHE_PREFERENCE_VERSION,
        source: sourceId,
        emitter: sourceId,
      })
      try {
        listener(initialEvent)
      } catch (error) {
        if (logger?.warn) {
          logger.warn('[storage] Cache preference listener threw an error', error)
        }
      }
    }

    return () => {
      listeners.delete(listener)
    }
  }

  const destroy = () => {
    if (isDestroyed) return
    isDestroyed = true
    listeners.clear()

    if (broadcast) {
      if (typeof broadcast.removeEventListener === 'function') {
        broadcast.removeEventListener('message', handleMessage)
      }
      if (typeof broadcast.close === 'function') {
        try {
          broadcast.close()
        } catch (error) {
          if (logger?.warn) {
            logger.warn('[storage] Failed to close cache preference broadcast channel', error)
          }
        }
      }
    }

    if (unsubscribeStorage) {
      try {
        unsubscribeStorage()
      } catch (error) {
        if (logger?.warn) {
          logger.warn('[storage] Failed to unsubscribe cache preference listener', error)
        }
      }
      unsubscribeStorage = null
    }
  }

  return Object.freeze({
    channelName,
    version: CACHE_PREFERENCE_VERSION,
    getPreferences,
    setPreferences,
    updatePreferences,
    resetPreferences,
    subscribe,
    requestSync,
    broadcastPreferences,
    destroy,
  })
}

export default createCachePreferenceChannel
