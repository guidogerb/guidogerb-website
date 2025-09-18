import { registerSW, unregisterSW } from '../index.js'

const originalDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'serviceWorker')

function restoreServiceWorker() {
  if (originalDescriptor) {
    Object.defineProperty(window.navigator, 'serviceWorker', originalDescriptor)
  } else {
    delete window.navigator.serviceWorker
  }
}

describe('service worker helpers', () => {
  afterEach(() => {
    restoreServiceWorker()
    vi.restoreAllMocks()
  })

  it('skips registration when the browser does not support service workers', () => {
    delete window.navigator.serviceWorker
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

    expect(() => registerSW()).not.toThrow()

    if (!('serviceWorker' in window.navigator)) {
      expect(addEventListenerSpy).not.toHaveBeenCalled()
    }
  })

  it('registers the service worker once the window load event fires', async () => {
    const register = vi.fn(() => Promise.resolve())
    const handlers = {}

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    })

    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      handlers[event] = handler
    })

    registerSW({ url: '/custom-sw.js' })

    expect(handlers.load).toBeInstanceOf(Function)

    await handlers.load()

    expect(register).toHaveBeenCalledWith('/custom-sw.js')
  })

  it('unregisters all existing registrations when available', async () => {
    const unregisterA = vi.fn(() => Promise.resolve())
    const unregisterB = vi.fn(() => Promise.resolve())
    const getRegistrations = vi.fn(() =>
      Promise.resolve([
        { unregister: unregisterA },
        { unregister: unregisterB },
      ]),
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
