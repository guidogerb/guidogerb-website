const createMemoryArea = () => {
  const store = new Map()

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null
    },
    setItem(key, value) {
      store.set(key, String(value))
    },
    removeItem(key) {
      store.delete(key)
    },
    clear() {
      store.clear()
    },
    key(index) {
      if (index < 0 || index >= store.size) return null
      return Array.from(store.keys())[index] ?? null
    },
    get length() {
      return store.size
    },
  }
}

const resolveArea = ({ area, storage, logger }) => {
  if (storage) {
    return { areaRef: storage, actualArea: area, fallbackReason: null }
  }

  if (area === 'memory') {
    return { areaRef: createMemoryArea(), actualArea: 'memory', fallbackReason: null }
  }

  const globalObject = typeof window !== 'undefined' ? window : undefined
  if (!globalObject) {
    return {
      areaRef: createMemoryArea(),
      actualArea: 'memory',
      fallbackReason: 'window-unavailable',
    }
  }

  const lookup = area === 'session' ? globalObject.sessionStorage : globalObject.localStorage
  try {
    const probeKey = `__gg_storage_probe__${Math.random().toString(16).slice(2)}`
    lookup.setItem(probeKey, '1')
    lookup.removeItem(probeKey)
    return { areaRef: lookup, actualArea: area, fallbackReason: null }
  } catch (error) {
    if (logger?.warn) {
      logger.warn('[storage] Falling back to in-memory storage', error)
    }
    return {
      areaRef: createMemoryArea(),
      actualArea: 'memory',
      fallbackReason: 'unavailable',
    }
  }
}

const safeDeserialize = (raw, deserializer, logger) => {
  if (raw === undefined || raw === null) return undefined
  try {
    return deserializer(raw)
  } catch (error) {
    if (logger?.warn) {
      logger.warn('[storage] Failed to parse stored value', { raw, error })
    }
    return undefined
  }
}

export const createStorageController = ({
  namespace = 'gg',
  area = 'local',
  storage,
  serializer = JSON.stringify,
  deserializer = JSON.parse,
  logger = console,
  diagnostics,
} = {}) => {
  const { areaRef, actualArea, fallbackReason } = resolveArea({ area, storage, logger })
  const listeners = new Set()
  const prefix = `${namespace}::`

  const emitDiagnostic = (() => {
    if (!diagnostics) return () => {}

    const context = Object.freeze({
      namespace,
      area,
      storageArea: actualArea,
    })

    const invoke = (handler, event) => {
      if (typeof handler !== 'function') return

      try {
        handler({ timestamp: Date.now(), ...context, ...event })
      } catch (error) {
        if (logger?.warn) {
          logger.warn('[storage] Diagnostics listener threw an error', error)
        }
      }
    }

    if (typeof diagnostics === 'function') {
      return (event) => invoke(diagnostics, event)
    }

    if (typeof diagnostics === 'object' && diagnostics !== null) {
      const { emit, onEvent, onSet, onRemove, onClear, onNotify, onFallback } = diagnostics

      if (typeof emit === 'function') {
        return (event) => invoke(emit, event)
      }

      return (event) => {
        const handler =
          (event.type === 'set' && typeof onSet === 'function' && onSet) ||
          (event.type === 'remove' && typeof onRemove === 'function' && onRemove) ||
          (event.type === 'clear' && typeof onClear === 'function' && onClear) ||
          (event.type === 'notify' && typeof onNotify === 'function' && onNotify) ||
          (event.type === 'fallback' && typeof onFallback === 'function' && onFallback) ||
          onEvent

        if (handler) {
          invoke(handler, event)
        }
      }
    }

    return () => {}
  })()

  if (fallbackReason) {
    emitDiagnostic({ type: 'fallback', reason: fallbackReason })
  }

  const buildKey = (key) => `${prefix}${key}`

  const notify = (type, key, value) => {
    emitDiagnostic({ type: 'notify', eventType: type, key, value, listenerCount: listeners.size })
    listeners.forEach((listener) => {
      try {
        listener({ type, key, value, namespace })
      } catch (error) {
        if (logger?.warn) {
          logger.warn('[storage] Listener threw an error', error)
        }
      }
    })
  }

  const read = (key) => {
    const raw = areaRef.getItem(buildKey(key))
    return safeDeserialize(raw, deserializer, logger)
  }

  const has = (key) => areaRef.getItem(buildKey(key)) !== null

  const set = (key, value) => {
    if (value === undefined) {
      remove(key)
      return undefined
    }

    const previousValue = read(key)

    try {
      const payload = serializer(value)
      areaRef.setItem(buildKey(key), payload)
      notify('set', key, value)
      emitDiagnostic({ type: 'set', key, value, previousValue })
      return value
    } catch (error) {
      if (logger?.error) {
        logger.error('[storage] Failed to persist value', { key, error })
      }
      throw error
    }
  }

  const remove = (key) => {
    const previousValue = read(key)
    areaRef.removeItem(buildKey(key))
    notify('remove', key)
    emitDiagnostic({ type: 'remove', key, previousValue })
  }

  const clear = () => {
    const keys = []
    const prefixLength = prefix.length
    for (let index = 0; index < areaRef.length; index += 1) {
      const rawKey = areaRef.key(index)
      if (rawKey && rawKey.startsWith(prefix)) {
        keys.push(rawKey.slice(prefixLength))
      }
    }
    keys.forEach((key) => areaRef.removeItem(buildKey(key)))
    notify('clear')
    emitDiagnostic({ type: 'clear', keys })
  }

  const list = () => {
    const entries = []
    const prefixLength = prefix.length
    for (let index = 0; index < areaRef.length; index += 1) {
      const rawKey = areaRef.key(index)
      if (!rawKey || !rawKey.startsWith(prefix)) continue
      const key = rawKey.slice(prefixLength)
      entries.push([key, read(key)])
    }
    return entries
  }

  const snapshot = () => Object.fromEntries(list())

  const subscribe = (listener) => {
    if (typeof listener !== 'function') return () => {}
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  return Object.freeze({
    namespace,
    area,
    has,
    get: (key, fallback) => {
      const value = read(key)
      return value === undefined ? fallback : value
    },
    set,
    remove,
    clear,
    list,
    snapshot,
    subscribe,
  })
}

export default createStorageController
