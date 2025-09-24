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
    expect(eventTypes).toEqual(
      expect.arrayContaining(['set', 'remove', 'clear']),
    )

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
    expect(onClear).toHaveBeenCalledWith(expect.objectContaining({ type: 'clear', keys: expect.arrayContaining(['other']) }))
    expect(onNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'notify', eventType: 'set' }))
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
