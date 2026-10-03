// Firebase Messaging Service Worker for ResumeCraft background notifications
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Parse Firebase configuration from query parameters passed during registration
const urlParams = new URL(location).searchParams;
const firebaseConfig = {
  apiKey: urlParams.get('apiKey') || '',
  authDomain: urlParams.get('authDomain') || '',
  projectId: urlParams.get('projectId') || 'resumecraft-9534f',
  storageBucket: urlParams.get('storageBucket') || '',
  messagingSenderId: urlParams.get('messagingSenderId') || '',
  appId: urlParams.get('appId') || '',
};

// Initialize Firebase App inside the service worker
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const messaging = firebase.messaging();

    // Official Firebase SDK Background Message Handler
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Background message received via FCM SDK:', payload);
      const title = payload.notification?.title || payload.data?.title || 'Resume Template Update';
      const body =
        payload.notification?.body ||
        payload.data?.body ||
        'A new or updated resume template is available in ResumeCraft.';
      const notificationOptions = {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: payload.data || {},
      };
      return self.registration.showNotification(title, notificationOptions);
    });
  } catch (err) {
    console.warn('[firebase-messaging-sw.js] Firebase SDK initialization warning:', err.message);
  }
}

// Fallback listener for raw Web Push events
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const payload = event.data.json();
      const title = payload.notification?.title || payload.data?.title || 'Resume Template Update';
      const body =
        payload.notification?.body ||
        payload.data?.body ||
        'A new or updated resume template is available in ResumeCraft.';
      const options = {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: payload.data || {},
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch {
      event.waitUntil(
        self.registration.showNotification('Resume Template Update', {
          body: event.data.text() || 'A new resume template is available in ResumeCraft.',
          icon: '/favicon.svg',
        })
      );
    }
  }
});

// Notification click event: focus or open the /templates page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/templates') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/templates');
      }
    })
  );
});
