const CACHE_NAME = 'app-cache-v1'
const PRECACHE = ['/offline.html']
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(PRECACHE)
    })(),
  )
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    })(),
  )
  self.clients.claim()
})
self.addEventListener('fetch', (event) => {
  const req = event.request
  const isNavigation = req.mode === 'navigate'
  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          const net = await fetch(req)
          return net
        } catch {
          // removed unused error param
          const cache = await caches.open(CACHE_NAME)
          const offline = await cache.match('/offline.html')
          return offline || new Response('Offline', { status: 503 })
        }
      })(),
    )
  }
})
