// Service Worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase app in the service worker
// Note: These credentials are configured for the lingolive-ia-f5778 project
firebase.initializeApp({
  apiKey: "AIzaSyBbX50RcztVjJfk0RWBE0RwhnqLQlVKlSg",
  authDomain: "lingolive-ia-f5778.firebaseapp.com",
  projectId: "lingolive-ia-f5778",
  storageBucket: "lingolive-ia-f5778.firebasestorage.app",
  messagingSenderId: "995910450073",
  appId: "1:995910450073:web:4f34f7f8b3b4afc2be3108"
});

const messaging = firebase.messaging();

// Customize background message handling
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification?.title || 'LingoLive: Hora de Praticar! 🚀';
  const notificationOptions = {
    body: payload.notification?.body || 'Não perca sua ofensiva de hoje. Venha falar com o Kamba IA!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'lingolive-reminder',
    renotify: true,
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to focus/open the application
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = new URL(self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // If a window tab is already open, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
