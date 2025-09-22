import { describe, expect, it, vi } from 'vitest'

import {
  CACHE_PREFERENCE_CHANNEL_NAME,
  DEFAULT_CACHE_PREFERENCES,
  createCachePreferenceChannel,
} from '../cachePreferencesChannel.js'
import { createStorageController } from '../createStorageController.js'

const createBroadcastFactory = () => {
  const peers = new Set()

  return () => {
    const listeners = new Set()
    const channel = {
      listeners,
      closed: false,
      addEventListener(event, handler) {
        if (event !== 'message' || typeof handler !== 'function') return
        listeners.add(handler)
      },
      removeEventListener(event, handler) {
        if (event !== 'message' || typeof handler !== 'function') return
        listeners.delete(handler)
      },
      postMessage(message) {
        for (const peer of peers) {
          if (peer.closed) continue
          peer.listeners.forEach((listener) => listener({ data: message }))
        }
      },
      close() {
        channel.closed = true
        peers.delete(channel)
        listeners.clear()
      },
    }

    peers.add(channel)
    return channel
  }
}

const createLogger = () => ({ warn: vi.fn(), error: vi.fn() })

describe('createCachePreferenceChannel', () => {
  it('persists updates and notifies subscribers', () => {
    const controller = createStorageController({ namespace: 'test', area: 'memory' })
    const broadcastFactory = createBroadcastFactory()
    const logger = createLogger()
    const channel = createCachePreferenceChannel({
      storageController: controller,
      broadcastChannelFactory: broadcastFactory,
      logger,
    })

    const handler = vi.fn()
    channel.subscribe(handler)

    channel.updatePreferences({ assets: { enabled: false } })

    const stored = controller.get('cache.preferences')
    expect(stored.assets.enabled).toBe(false)
    expect(channel.getPreferences().assets.enabled).toBe(false)

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'local',
        preferences: expect.objectContaining({
          assets: expect.objectContaining({ enabled: false }),
        }),
      }),
    )

    channel.destroy()
  })

  it('synchronizes updates across broadcast peers', () => {
    const broadcastFactory = createBroadcastFactory()
    const logger = createLogger()

    const channelA = createCachePreferenceChannel({
      storageController: createStorageController({ namespace: 'a', area: 'memory' }),
      broadcastChannelFactory: broadcastFactory,
      logger,
    })

    const channelB = createCachePreferenceChannel({
      storageController: createStorageController({ namespace: 'b', area: 'memory' }),
      broadcastChannelFactory: broadcastFactory,
      logger,
    })

    const handler = vi.fn()
    channelB.subscribe(handler)

    channelA.setPreferences({
      assets: { enabled: false, strategy: 'network-only' },
      api: { enabled: false, strategy: 'network-only', maxAgeSeconds: 0 },
    })

    expect(channelB.getPreferences().assets.enabled).toBe(false)
    expect(channelB.getPreferences().api.enabled).toBe(false)

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'broadcast',
        emitter: expect.any(String),
        preferences: expect.objectContaining({
          api: expect.objectContaining({ enabled: false, maxAgeSeconds: 0 }),
        }),
      }),
    )

    channelA.destroy()
    channelB.destroy()
  })

  it('resets to defaults when storage removes the preference key', () => {
    const controller = createStorageController({ namespace: 'demo', area: 'memory' })
    const channel = createCachePreferenceChannel({
      storageController: controller,
      broadcastChannelFactory: createBroadcastFactory(),
      logger: createLogger(),
    })

    channel.updatePreferences({ assets: { enabled: false } })
    expect(channel.getPreferences().assets.enabled).toBe(false)

    controller.remove('cache.preferences')

    expect(channel.getPreferences()).toEqual(DEFAULT_CACHE_PREFERENCES)

    channel.destroy()
  })

  it('warns when broadcast channel creation fails but still operates locally', () => {
    const controller = createStorageController({ namespace: 'warn', area: 'memory' })
    const warn = vi.fn()
    const channel = createCachePreferenceChannel({
      storageController: controller,
      broadcastChannelFactory: () => {
        throw new Error('no channel')
      },
      logger: { warn, error: vi.fn() },
    })

    expect(() => channel.updatePreferences({ assets: { enabled: false } })).not.toThrow()
    expect(warn).toHaveBeenCalled()

    channel.destroy()
  })

  it('skips notifying listeners when updates do not change the preferences', () => {
    const channel = createCachePreferenceChannel({
      persist: false,
      broadcastChannelFactory: createBroadcastFactory(),
      logger: createLogger(),
    })

    const handler = vi.fn()
    channel.subscribe(handler)

    channel.updatePreferences({})
    channel.setPreferences(DEFAULT_CACHE_PREFERENCES)

    expect(handler).not.toHaveBeenCalled()

    channel.destroy()
  })

  it('emits an initial snapshot when requested', () => {
    const channel = createCachePreferenceChannel({
      channelName: `${CACHE_PREFERENCE_CHANNEL_NAME}-initial`,
      persist: false,
      broadcastChannelFactory: createBroadcastFactory(),
      logger: createLogger(),
    })

    const handler = vi.fn()
    channel.subscribe(handler, { emitInitial: true })

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'initial',
        preferences: DEFAULT_CACHE_PREFERENCES,
      }),
    )

    channel.destroy()
  })

  it('responds to sync requests by broadcasting the latest preferences', () => {
    const controller = createStorageController({ namespace: 'sync', area: 'memory' })
    controller.set('cache.preferences', {
      assets: { enabled: false, strategy: 'cache-first' },
      api: { maxAgeSeconds: 42 },
    })

    const broadcastFactory = createBroadcastFactory()
    const provider = createCachePreferenceChannel({
      storageController: controller,
      broadcastChannelFactory: broadcastFactory,
      logger: createLogger(),
    })

    const peer = createCachePreferenceChannel({
      persist: false,
      broadcastChannelFactory: broadcastFactory,
      logger: createLogger(),
    })

    const handler = vi.fn()
    peer.subscribe(handler)

    expect(peer.requestSync()).toBe(true)

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'broadcast',
        preferences: expect.objectContaining({
          assets: expect.objectContaining({ enabled: false, strategy: 'cache-first' }),
          api: expect.objectContaining({ maxAgeSeconds: 42 }),
        }),
      }),
    )

    expect(peer.getPreferences().assets.enabled).toBe(false)

    provider.destroy()
    peer.destroy()
  })
})
