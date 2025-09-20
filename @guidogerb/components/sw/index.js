const createDeferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const isServiceWorkerSupported = () => {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  )
}

const noopPromise = () => new Promise(() => {})

export function registerSW(options = {}) {
  if (!isServiceWorkerSupported()) {
    const never = noopPromise()
    return {
      ready: Promise.resolve(null),
      updateReady: never,
      waitForUpdate: () => never,
      registration: Promise.resolve(null),
      checkForUpdates: async () => false,
    }
  }

  const {
    url = '/sw.js',
    immediate = false,
    onRegistered,
    onRegisterError,
    onUpdateFound,
    onUpdateReady,
    onOfflineReady,
    onControllerChange,
  } = options ?? {}

  const readyDeferred = createDeferred()
  const updateDeferred = createDeferred()
  let registrationRef = null
  let updateResolved = false
  let offlineNotified = false

  const readyPromise = readyDeferred.promise.catch(() => null)

  const safeCall = (callback, payload) => {
    if (typeof callback !== 'function') return
    try {
      callback(payload)
    } catch (error) {
      console.error(error)
    }
  }

  const notifyOfflineReady = (registration) => {
    if (offlineNotified) return
    offlineNotified = true
    safeCall(onOfflineReady, { registration })
  }

  const notifyUpdateReady = (registration) => {
    if (updateResolved) return
    updateResolved = true
    const detail = { registration, waiting: registration.waiting ?? null }
    safeCall(onUpdateReady, detail)
    updateDeferred.resolve(detail)
  }

  const watchInstallingWorker = (worker, registration) => {
    if (!worker || typeof worker.addEventListener !== 'function') return

    const handleStateChange = () => {
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          notifyUpdateReady(registration)
        } else {
          notifyOfflineReady(registration)
        }
      }
    }

    worker.addEventListener('statechange', handleStateChange)
    handleStateChange()
  }

  const attachRegistration = (registration) => {
    registrationRef = registration
    readyDeferred.resolve(registration)
    safeCall(onRegistered, registration)

    if (registration.waiting && navigator.serviceWorker.controller) {
      notifyUpdateReady(registration)
    }

    watchInstallingWorker(registration.installing, registration)

    if (typeof registration.addEventListener === 'function') {
      registration.addEventListener('updatefound', () => {
        safeCall(onUpdateFound, registration)
        watchInstallingWorker(registration.installing, registration)
      })
    }
  }

  if (typeof onControllerChange === 'function') {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      safeCall(onControllerChange, navigator.serviceWorker.controller ?? null)
    })
  }

  const performRegistration = () => {
    navigator.serviceWorker
      .register(url)
      .then((registration) => {
        attachRegistration(registration)
      })
      .catch((error) => {
        readyDeferred.reject(error)
        safeCall(onRegisterError, error)
      })
  }

  const pageLoaded = typeof document !== 'undefined' ? document.readyState === 'complete' : false

  if (immediate || pageLoaded) {
    performRegistration()
  } else {
    const onLoad = () => {
      window.removeEventListener('load', onLoad)
      performRegistration()
    }
    window.addEventListener('load', onLoad)
  }

  return {
    ready: readyPromise,
    updateReady: updateDeferred.promise,
    waitForUpdate: () => updateDeferred.promise,
    registration: readyPromise,
    checkForUpdates: async () => {
      try {
        const registration = registrationRef ?? (await readyPromise)
        if (!registration || typeof registration.update !== 'function') {
          return false
        }
        await registration.update()
        return true
      } catch (error) {
        return false
      }
    },
  }
}

export function unregisterSW() {
  if (!isServiceWorkerSupported()) return
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => registrations.forEach((registration) => registration.unregister()))
    .catch(() => void 0)
}
