import { describe, expect, it, vi } from 'vitest'

import { createStorageController } from '../createStorageController.js'

const createMemoryStorage = () => {
  const store = new Map()
  return {
    get length() {
      return store.size
    },
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
  }
}

describe('createStorageController', () => {
  it('reports key presence without invoking the deserializer', () => {
    const storage = createMemoryStorage()
    const deserializer = vi.fn(() => {
      throw new Error('should not deserialize during has check')
    })

    const controller = createStorageController({
      namespace: 'has-check',
      area: 'memory',
      storage,
      deserializer,
      logger: { warn: vi.fn(), error: vi.fn() },
    })

    storage.setItem('has-check::raw', '{invalid-json')

    expect(controller.has('raw')).toBe(true)
    expect(controller.has('missing')).toBe(false)
    expect(deserializer).not.toHaveBeenCalled()
  })

  it('tracks key presence when values are mutated', () => {
    const controller = createStorageController({
      namespace: 'presence',
      area: 'memory',
      storage: createMemoryStorage(),
    })

    expect(controller.has('feature')).toBe(false)

    controller.set('feature', { enabled: true })
    expect(controller.has('feature')).toBe(true)

    controller.set('feature', undefined)
    expect(controller.has('feature')).toBe(false)

    controller.set('alpha', 'a')
    controller.set('beta', 'b')
    expect(controller.has('alpha')).toBe(true)
    expect(controller.has('beta')).toBe(true)

    controller.clear()
    expect(controller.has('alpha')).toBe(false)
    expect(controller.has('beta')).toBe(false)
  })
})

describe('createStorageController diagnostics', () => {
  it('emits diagnostic events for mutations when provided a function', () => {
    const diagnostics = vi.fn()
    const controller = createStorageController({
      namespace: 'diagnostic',
      area: 'memory',
      storage: createMemoryStorage(),
      diagnostics,
    })

    controller.set('feature', 'enabled')
    controller.set('feature', 'disabled')
    controller.remove('feature')
    controller.set('temp', 'value')
    controller.clear()

    const eventTypes = diagnostics.mock.calls.map(([event]) => event.type)
    expect(eventTypes).toEqual(expect.arrayContaining(['set', 'remove', 'clear']))

    const setEvent = diagnostics.mock.calls.find(([event]) => event.type === 'set')?.[0]
    expect(setEvent).toMatchObject({
      namespace: 'diagnostic',
      area: 'memory',
      storageArea: 'memory',
      key: 'feature',
      value: 'enabled',
      previousValue: undefined,
    })
    expect(typeof setEvent.timestamp).toBe('number')
  })

  it('supports object-based diagnostics handlers', () => {
    const onSet = vi.fn()
    const onRemove = vi.fn()
    const onClear = vi.fn()
    const onNotify = vi.fn()

    const controller = createStorageController({
      namespace: 'handlers',
      diagnostics: { onSet, onRemove, onClear, onNotify },
      storage: createMemoryStorage(),
      area: 'memory',
    })

    const unsubscribe = controller.subscribe(() => {})

    controller.set('token', 'abc')
    controller.remove('token')
    controller.set('other', 'value')
    controller.clear()

    unsubscribe()

    expect(onSet).toHaveBeenCalledWith(expect.objectContaining({ type: 'set', key: 'token' }))
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ type: 'remove', key: 'token' }))
    expect(onClear).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'clear', keys: expect.arrayContaining(['other']) }),
    )
    expect(onNotify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'notify', eventType: 'set' }),
    )
  })

  it('emits a fallback diagnostic when the requested area is unavailable', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')

    const failingStorage = {
      get length() {
        return 0
      },
      setItem: () => {
        throw new Error('denied')
      },
      removeItem: () => {},
      getItem: () => null,
      key: () => null,
      clear: () => {},
    }

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: failingStorage,
    })

    const onFallback = vi.fn()
    const logger = { warn: vi.fn(), error: vi.fn() }

    try {
      const controller = createStorageController({
        namespace: 'fallback',
        area: 'local',
        diagnostics: { onFallback },
        logger,
      })

      expect(onFallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fallback',
          reason: 'unavailable',
          area: 'local',
          storageArea: 'memory',
        }),
      )

      controller.set('key', 'value')
      controller.clear()
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor)
      } else {
        delete window.localStorage
      }
    }
  })
})
