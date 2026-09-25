self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options = {
        body: data.body,
        icon: '/icon-512x512.png', // Assuming an icon exists, or fallback to default
        badge: '/icon-512x512.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: data.url || '/',
        tag: data.tag || 'gopal-cake-shop-notification',
        renotify: true,
        requireInteraction: true,
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Gopal Cake Shop', options)
      );
    } catch (err) {
      console.error('Error parsing push data', err);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
