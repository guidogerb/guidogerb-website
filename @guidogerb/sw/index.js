// Service worker registration helpers shared across tenant sites.
export function registerSW(options = {}) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  const {
    url = '/sw.js',
    immediate = false,
    onRegistered,
    onRegisterError,
  } = options

  const register = () =>
    navigator.serviceWorker
      .register(url)
      .then((registration) => {
        if (typeof onRegistered === 'function') onRegistered(registration)
        return registration
      })
      .catch((error) => {
        if (typeof onRegisterError === 'function') onRegisterError(error)
      })

  if (immediate || document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}

export function unregisterSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => registrations.forEach((registration) => registration.unregister()))
    .catch(() => void 0)
}

export async function sendMessageToSW(message) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration || !registration.active) return
  registration.active.postMessage(message)
}

export async function requestSkipWaiting() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
}
