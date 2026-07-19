self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      const title = payload.title || 'Gopal Bakery';
      const options = {
        body: payload.body || 'Your order status has changed.',
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        data: payload.data || {}
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      const options = {
        body: event.data.text()
      };
      event.waitUntil(self.registration.showNotification('Gopal Bakery Update', options));
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const orderId = event.notification.data ? event.notification.data.orderId : null;
  const urlToOpen = orderId ? '/customer/orders' : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
