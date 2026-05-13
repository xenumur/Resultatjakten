self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    }

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(data.title, options),
        // Set app badge if supported
        'setAppBadge' in self.navigator ? self.navigator.setAppBadge(data.badgeCount || 1) : Promise.resolve()
      ])
    )
  }
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})
