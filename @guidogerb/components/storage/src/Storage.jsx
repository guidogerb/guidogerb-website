import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { createStorageController } from './createStorageController.js'

const DEFAULT_AREAS = Object.freeze(['local', 'session'])
const EMPTY_OBJECT = Object.freeze({})

const buildNormalizedAreas = (areas) => {
  if (!areas) return []

  const entries = []

  const addEntry = (name, options = {}) => {
    if (!name || typeof name !== 'string') return
    entries.push([name, options && typeof options === 'object' ? options : {}])
  }

  if (Array.isArray(areas)) {
    for (const item of areas) {
      if (typeof item === 'string') {
        addEntry(item)
        continue
      }

      if (item && typeof item === 'object') {
        const { name, area, key, ...rest } = item
        addEntry(name ?? area ?? key, rest)
      }
    }
  } else if (areas && typeof areas === 'object') {
    for (const [name, config] of Object.entries(areas)) {
      if (config && typeof config === 'object') {
        const { name: nestedName, area, key, ...rest } = config
        addEntry(nestedName ?? area ?? key ?? name, rest)
      } else {
        addEntry(name)
      }
    }
  }

  const deduped = new Map()
  for (const [name, options] of entries) {
    if (!name) continue
    deduped.set(name, options ?? {})
  }

  return Array.from(deduped.entries())
}

const resolveOverride = (overrides, key) => {
  if (!overrides) return undefined
  if (typeof overrides.get === 'function') {
    return overrides.get(key)
  }
  if (typeof overrides === 'object' && overrides !== null) {
    return overrides[key]
  }
  return undefined
}

const buildContextValue = ({ namespace, defaultArea, fallbackArea, controllers }) => {
  const entries = Array.from(controllers.entries())
  const controllersObject = Object.fromEntries(entries)

  const fallbackController =
    controllers.get(fallbackArea) ??
    controllers.get(defaultArea) ??
    entries[0]?.[1] ??
    createStorageController({ namespace, area: fallbackArea ?? 'memory' })

  const getController = (area = defaultArea) => controllers.get(area) ?? fallbackController

  const hasController = (area) => controllers.has(area)

  const getValue = (key, fallbackValue, area = defaultArea) => {
    const controller = getController(area)
    return typeof controller?.get === 'function' ? controller.get(key, fallbackValue) : fallbackValue
  }

  const setValue = (key, value, area = defaultArea) => {
    const controller = getController(area)
    if (typeof controller?.set === 'function') {
      return controller.set(key, value)
    }
    return undefined
  }

  const removeValue = (key, area = defaultArea) => {
    const controller = getController(area)
    if (typeof controller?.remove === 'function') {
      controller.remove(key)
    }
  }

  const clearArea = (area = defaultArea) => {
    const controller = getController(area)
    if (typeof controller?.clear === 'function') {
      controller.clear()
    }
  }

  const listValues = (area = defaultArea) => {
    const controller = getController(area)
    if (typeof controller?.list === 'function') {
      return controller.list()
    }
    return []
  }

  const snapshot = (area = defaultArea) => {
    const controller = getController(area)
    if (typeof controller?.snapshot === 'function') {
      return controller.snapshot()
    }
    return {}
  }

  const subscribe = (listener, area = defaultArea) => {
    if (typeof listener !== 'function') return () => {}
    const controller = getController(area)
    if (typeof controller?.subscribe === 'function') {
      return controller.subscribe(listener)
    }
    return () => {}
  }

  return {
    namespace,
    defaultArea,
    fallbackArea,
    areas: entries.map(([name]) => name),
    controllers: controllersObject,
    hasController,
    getController,
    getValue,
    setValue,
    removeValue,
    clearArea,
    listValues,
    snapshot,
    subscribe,
  }
}

const DEFAULT_CONTEXT = buildContextValue({
  namespace: 'gg',
  defaultArea: 'memory',
  fallbackArea: 'memory',
  controllers: new Map([['memory', createStorageController({ namespace: 'gg', area: 'memory' })]]),
})

export const StorageContext = createContext(DEFAULT_CONTEXT)

export const Storage = ({
  namespace = 'gg',
  areas = DEFAULT_AREAS,
  defaultArea = 'local',
  fallbackArea = 'memory',
  controllers: overrides = EMPTY_OBJECT,
  controllerFactory = createStorageController,
  logger = console,
  onChange,
  children,
}) => {
  const normalizedAreas = useMemo(() => buildNormalizedAreas(areas), [areas])

  const controllers = useMemo(() => {
    const map = new Map()

    const register = (name, options = {}) => {
      if (!name || map.has(name)) return

      const override = resolveOverride(overrides, name)
      if (override) {
        map.set(name, override)
        return
      }

      const {
        namespace: areaNamespace,
        area: areaOverride,
        logger: areaLogger,
        ...rest
      } = options ?? {}

      const controller = controllerFactory({
        namespace: areaNamespace ?? namespace,
        area: areaOverride ?? name,
        logger: areaLogger ?? logger,
        ...rest,
      })

      map.set(name, controller)
    }

    for (const [name, options] of normalizedAreas) {
      register(name, options)
    }

    register('local', { area: 'local' })

    if (defaultArea) {
      register(defaultArea, { area: defaultArea })
    }

    if (fallbackArea && fallbackArea !== defaultArea) {
      register(fallbackArea, { area: fallbackArea })
    }

    if (!map.size) {
      register('memory', { area: 'memory' })
    }

    return map
  }, [normalizedAreas, overrides, controllerFactory, namespace, logger, defaultArea, fallbackArea])

  const contextValue = useMemo(
    () => buildContextValue({ namespace, defaultArea, fallbackArea, controllers }),
    [namespace, defaultArea, fallbackArea, controllers],
  )

  useEffect(() => {
    if (typeof onChange !== 'function') return undefined

    const unsubscribers = []
    controllers.forEach((controller, areaName) => {
      if (typeof controller?.subscribe !== 'function') return
      const unsubscribe = controller.subscribe((event) => {
        if (!event) return
        onChange({ area: areaName, ...event })
      })
      unsubscribers.push(unsubscribe)
    })

    return () => {
      unsubscribers.forEach((unsubscribe) => {
        try {
          unsubscribe()
        } catch (error) {
          if (logger?.warn) {
            logger.warn('[storage] Listener cleanup failed', error)
          }
        }
      })
    }
  }, [controllers, onChange, logger])

  return <StorageContext.Provider value={contextValue}>{children ?? null}</StorageContext.Provider>
}

Storage.displayName = 'StorageProvider'

export const StorageProvider = Storage

export const useStorage = () => useContext(StorageContext)

export const useStorageController = (area) => {
  const storage = useStorage()
  return storage.getController(area)
}

export const useStoredValue = (key, { area, defaultValue } = {}) => {
  const controller = useStorageController(area)
  const readValue = useCallback(() => {
    if (!controller || typeof controller.get !== 'function') {
      return defaultValue
    }
    return controller.get(key, defaultValue)
  }, [controller, key, defaultValue])

  const [value, setValue] = useState(() => readValue())

  useEffect(() => {
    setValue(readValue())
    if (!controller || typeof controller.subscribe !== 'function') {
      return undefined
    }

    const unsubscribe = controller.subscribe((event) => {
      if (!event) return
      if (event.key && event.key !== key && event.type !== 'clear') return

      if (event.type === 'set') {
        setValue(readValue())
        return
      }

      if (event.type === 'remove' || event.type === 'clear') {
        setValue(defaultValue)
      }
    })

    return unsubscribe
  }, [controller, key, defaultValue, readValue])

  const updateValue = useCallback(
    (nextValue) => {
      if (!controller || typeof controller.set !== 'function') return undefined
      const resolved =
        typeof nextValue === 'function'
          ? nextValue(readValue())
          : nextValue
      return controller.set(key, resolved)
    },
    [controller, key, readValue],
  )

  const removeValue = useCallback(() => {
    if (!controller || typeof controller.remove !== 'function') return
    controller.remove(key)
  }, [controller, key])

  return [value, updateValue, removeValue]
}

export default Storage
