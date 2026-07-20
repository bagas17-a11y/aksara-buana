// Aksara Buana Service Worker
// Handles offline caching for the driver PWA.
// NOTE: Browser-based geolocation is throttled/suspended when the screen is locked
// or the browser is backgrounded on most mobile OSes. This is a fundamental PWA
// limitation. Drivers should keep the screen on and the browser tab active while
// the trip is in progress. For true background tracking, a native app (React Native,
// Flutter, or a Capacitor wrapper) would be needed.

const CACHE_NAME = 'aksara-buana-v1'
const STATIC_ASSETS = [
  '/',
  '/driver/dashboard',
  '/auth/login',
  '/manifest.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag ?? 'aksara-buana',
      data: { url: data.url ?? '/' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const existing = windowClients.find(c => c.url.includes(url) && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})

self.addEventListener('fetch', event => {
  // Network-first for API and Supabase calls; cache-first for static assets
  const url = new URL(event.request.url)

  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    // Network-only for data requests
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
