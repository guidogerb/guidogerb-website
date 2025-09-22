import {
  DEFAULT_CACHE_PREFERENCES,
  createCachePreferenceSubscriber,
  registerSW,
  unregisterSW,
} from '../index.js'
import { createCachePreferenceChannel } from '@guidogerb/components-storage/cache-preferences'
import { createStorageController } from '@guidogerb/components-storage'

const originalDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'serviceWorker')
const originalReadyStateDescriptor = Object.getOwnPropertyDescriptor(document, 'readyState')

function restoreServiceWorker() {
  if (originalDescriptor) {
    Object.defineProperty(window.navigator, 'serviceWorker', originalDescriptor)
  } else {
    delete window.navigator.serviceWorker
  }
}

function restoreDocumentReadyState() {
  if (originalReadyStateDescriptor) {
    Object.defineProperty(document, 'readyState', originalReadyStateDescriptor)
  }
}

const setDocumentReadyState = (state) => {
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    get: () => state,
  })
}

const createMockWorker = (initialState = 'installing') => {
  const listeners = new Map()
  return {
    state: initialState,
    addEventListener: vi.fn((event, handler) => {
      listeners.set(event, handler)
    }),
    dispatchStateChange(nextState) {
      this.state = nextState
      const handler = listeners.get('statechange')
      if (handler) handler()
    },
  }
}

const createMockRegistration = ({ waiting = null, installing = null } = {}) => {
  const listeners = new Map()
  return {
    installing,
    waiting,
    scope: '/',
    update: vi.fn(() => Promise.resolve()),
    addEventListener: vi.fn((event, handler) => {
      listeners.set(event, handler)
    }),
    dispatchUpdateFound() {
      const handler = listeners.get('updatefound')
      if (handler) handler()
    },
  }
}

const createMockServiceWorker = ({ registerResult, controller = {} } = {}) => {
  const listeners = new Map()
  let controllerRef = controller
  return {
    register: vi.fn(() => Promise.resolve(registerResult)),
    getRegistrations: vi.fn(() => Promise.resolve([])),
    addEventListener: vi.fn((event, handler) => {
      listeners.set(handler, event)
    }),
    removeEventListener: vi.fn((event, handler) => {
      listeners.delete(handler)
    }),
    dispatchControllerChange() {
      for (const [handler, event] of listeners.entries()) {
        if (event === 'controllerchange') {
          handler()
        }
      }
    },
    get controller() {
      return controllerRef
    },
    set controller(value) {
      controllerRef = value
    },
  }
}

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

describe('service worker helpers', () => {
  afterEach(() => {
    restoreServiceWorker()
    restoreDocumentReadyState()
    vi.restoreAllMocks()
  })

  it('skips registration when the browser does not support service workers', async () => {
    delete window.navigator.serviceWorker
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    const result = registerSW()

    expect(addEventListenerSpy).not.toHaveBeenCalled()
    await expect(result.ready).resolves.toBeNull()
    await expect(result.checkForUpdates()).resolves.toBe(false)
  })

  it('registers the service worker once the window load event fires', async () => {
    const registration = createMockRegistration()
    const serviceWorker = createMockServiceWorker({ registerResult: registration })

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    })

    const addListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeListenerSpy = vi.spyOn(window, 'removeEventListener')

    setDocumentReadyState('loading')

    const sw = registerSW({ url: '/custom-sw.js' })

    const loadHandler = addListenerSpy.mock.calls.find(([event]) => event === 'load')?.[1]
    expect(loadHandler).toBeInstanceOf(Function)

    loadHandler()

    await expect(sw.ready).resolves.toBe(registration)
    expect(serviceWorker.register).toHaveBeenCalledWith('/custom-sw.js')
    expect(removeListenerSpy).toHaveBeenCalledWith('load', loadHandler)
  })

  it('resolves updateReady when an updated worker is waiting', async () => {
    const waitingWorker = createMockWorker('installed')
    const registration = createMockRegistration({ waiting: waitingWorker })
    const serviceWorker = createMockServiceWorker({ registerResult: registration, controller: {} })

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    })

    const onUpdateReady = vi.fn()

    const sw = registerSW({ immediate: true, onUpdateReady })

    await expect(sw.ready).resolves.toBe(registration)

    const updateDetail = await sw.updateReady
    expect(updateDetail.registration).toBe(registration)
    expect(updateDetail.waiting).toBe(waitingWorker)
    expect(onUpdateReady).toHaveBeenCalledWith({ registration, waiting: waitingWorker })
  })

  it('invokes the offline callback when the first worker installs', async () => {
    const installingWorker = createMockWorker('installing')
    const registration = createMockRegistration({ installing: installingWorker })
    const serviceWorker = createMockServiceWorker({
      registerResult: registration,
      controller: null,
    })

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    })

    const onOfflineReady = vi.fn()
    const onUpdateReady = vi.fn()

    const sw = registerSW({ immediate: true, onOfflineReady, onUpdateReady })

    installingWorker.dispatchStateChange('installed')

    await Promise.resolve()
    expect(onOfflineReady).toHaveBeenCalledWith({ registration })
    expect(onUpdateReady).not.toHaveBeenCalled()

    const sentinel = Symbol('pending')
    await expect(Promise.race([sw.updateReady, Promise.resolve(sentinel)])).resolves.toBe(sentinel)
  })

  it('triggers updatefound callbacks and exposes checkForUpdates', async () => {
    const registration = createMockRegistration()
    const serviceWorker = createMockServiceWorker({ registerResult: registration, controller: {} })

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    })

    const onUpdateFound = vi.fn()

    const sw = registerSW({ immediate: true, onUpdateFound })

    await sw.ready
    registration.dispatchUpdateFound()

    expect(onUpdateFound).toHaveBeenCalledWith(registration)
    await expect(sw.checkForUpdates()).resolves.toBe(true)
    expect(registration.update).toHaveBeenCalledTimes(1)
  })

  it('forwards controllerchange events when a handler is supplied', async () => {
    const registration = createMockRegistration()
    const serviceWorker = createMockServiceWorker({ registerResult: registration, controller: {} })

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    })

    const onControllerChange = vi.fn()

    registerSW({ immediate: true, onControllerChange })

    serviceWorker.dispatchControllerChange()

    expect(onControllerChange).toHaveBeenCalledWith(serviceWorker.controller)
  })

  it('unregisters all existing registrations when available', async () => {
    const unregisterA = vi.fn(() => Promise.resolve())
    const unregisterB = vi.fn(() => Promise.resolve())
    const getRegistrations = vi.fn(() =>
      Promise.resolve([{ unregister: unregisterA }, { unregister: unregisterB }]),
    )

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistrations },
    })

    await unregisterSW()
    await Promise.resolve()

    expect(getRegistrations).toHaveBeenCalledTimes(1)
    expect(unregisterA).toHaveBeenCalledTimes(1)
    expect(unregisterB).toHaveBeenCalledTimes(1)
  })

  it('ignores unregister requests when service workers are unsupported', async () => {
    delete window.navigator.serviceWorker

    expect(unregisterSW()).toBeUndefined()
  })
})

describe('cache preference subscriber', () => {
  it('receives broadcast updates and mirrors the latest preferences', () => {
    const broadcastFactory = createBroadcastFactory()

    const publisher = createCachePreferenceChannel({
      broadcastChannelFactory: broadcastFactory,
      persist: false,
    })

    const subscriber = createCachePreferenceSubscriber({
      broadcastChannelFactory: broadcastFactory,
      logger: { warn: vi.fn(), error: vi.fn() },
    })

    const handler = vi.fn()
    subscriber.subscribe(handler)

    publisher.updatePreferences({
      assets: { enabled: false },
      api: { maxAgeSeconds: 90 },
    })

    expect(subscriber.getPreferences().assets.enabled).toBe(false)
    expect(subscriber.getPreferences().api.maxAgeSeconds).toBe(90)

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'broadcast',
        preferences: expect.objectContaining({
          assets: expect.objectContaining({ enabled: false }),
        }),
      }),
    )

    publisher.destroy()
    subscriber.destroy()
  })

  it('can emit an initial snapshot when requested', () => {
    const subscriber = createCachePreferenceSubscriber({
      broadcastChannelFactory: createBroadcastFactory(),
      logger: { warn: vi.fn(), error: vi.fn() },
    })

    const handler = vi.fn()
    subscriber.subscribe(handler, { emitInitial: true })

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'initial',
        preferences: DEFAULT_CACHE_PREFERENCES,
      }),
    )

    subscriber.destroy()
  })

  it('requests stored cache preferences when initialized', async () => {
    const controller = createStorageController({ namespace: 'sync', area: 'memory' })
    controller.set('cache.preferences', {
      assets: { enabled: false },
      api: { maxAgeSeconds: 180 },
    })

    const broadcastFactory = createBroadcastFactory()
    const provider = createCachePreferenceChannel({
      storageController: controller,
      broadcastChannelFactory: broadcastFactory,
      logger: { warn: vi.fn(), error: vi.fn() },
    })

    const subscriber = createCachePreferenceSubscriber({
      broadcastChannelFactory: broadcastFactory,
      logger: { warn: vi.fn(), error: vi.fn() },
    })

    await Promise.resolve()

    expect(subscriber.getPreferences().assets.enabled).toBe(false)
    expect(subscriber.getPreferences().api.maxAgeSeconds).toBe(180)

    const handler = vi.fn()
    subscriber.subscribe(handler, { emitInitial: true })

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'initial',
        preferences: expect.objectContaining({
          assets: expect.objectContaining({ enabled: false }),
          api: expect.objectContaining({ maxAgeSeconds: 180 }),
        }),
      }),
    )

    subscriber.destroy()
    provider.destroy()
  })
})
