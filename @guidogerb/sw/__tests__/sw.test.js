import {
  registerSW,
  unregisterSW,
  sendMessageToSW,
  requestSkipWaiting,
} from '../index.js'

const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'serviceWorker')
const originalReadyState = Object.getOwnPropertyDescriptor(document, 'readyState')

function restoreServiceWorker() {
  if (originalNavigatorDescriptor) {
    Object.defineProperty(window.navigator, 'serviceWorker', originalNavigatorDescriptor)
  } else {
    delete window.navigator.serviceWorker
  }
}

function setDocumentReadyState(value) {
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    get: () => value,
  })
}

describe('service worker helpers', () => {
  afterEach(() => {
    restoreServiceWorker()
    if (originalReadyState) {
      Object.defineProperty(document, 'readyState', originalReadyState)
    } else {
      delete document.readyState
    }
    vi.restoreAllMocks()
  })

  it('skips registration when the browser does not support service workers', () => {
    delete window.navigator.serviceWorker
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    expect(() => registerSW()).not.toThrow()
    expect(addEventListenerSpy).not.toHaveBeenCalled()
  })

  it('registers the service worker once the window load event fires', async () => {
    const register = vi.fn(() => Promise.resolve())
    const handlers = {}

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    })

    setDocumentReadyState('loading')

    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      handlers[event] = handler
    })

    const onRegistered = vi.fn()

    registerSW({ url: '/custom-sw.js', onRegistered })

    expect(handlers.load).toBeInstanceOf(Function)

    await handlers.load()

    expect(register).toHaveBeenCalledWith('/custom-sw.js')
    expect(onRegistered).toHaveBeenCalled()
  })

  it('registers immediately when the document is already loaded', () => {
    setDocumentReadyState('complete')

    const register = vi.fn(() => Promise.resolve())

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    })

    registerSW()

    expect(register).toHaveBeenCalledTimes(1)
  })

  it('reports registration errors via callback', async () => {
    const error = new Error('boom')

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register: () => Promise.reject(error) },
    })

    const onRegisterError = vi.fn()

    setDocumentReadyState('complete')
    registerSW({ onRegisterError })

    await vi.waitFor(() => {
      expect(onRegisterError).toHaveBeenCalledWith(error)
    })
  })

  it('unregisters all existing registrations when available', async () => {
    const unregisterA = vi.fn(() => Promise.resolve())
    const unregisterB = vi.fn(() => Promise.resolve())
    const getRegistrations = vi.fn(() => Promise.resolve([{ unregister: unregisterA }, { unregister: unregisterB }]))

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

  it('ignores unregister requests when service workers are unsupported', () => {
    delete window.navigator.serviceWorker

    expect(unregisterSW()).toBeUndefined()
  })

  it('sends messages to the active service worker', async () => {
    const postMessage = vi.fn()

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: () =>
          Promise.resolve({
            active: { postMessage },
          }),
      },
    })

    await sendMessageToSW({ type: 'PING' })

    expect(postMessage).toHaveBeenCalledWith({ type: 'PING' })
  })

  it('requests waiting workers to skip waiting', async () => {
    const postMessage = vi.fn()

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: () =>
          Promise.resolve({
            waiting: { postMessage },
          }),
      },
    })

    await requestSkipWaiting()

    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })
})
