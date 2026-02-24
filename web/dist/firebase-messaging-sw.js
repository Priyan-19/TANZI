// public/firebase-messaging-sw.js
// Firebase Service Worker for background FCM messages (Background Push Notifications)

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

// Hard-coded firebase config (env vars not available in service workers)
firebase.initializeApp({
  apiKey: "AIzaSyCqnrEXz0Li6J1vtAivqmqPodOIQZtoJ3Q",
  authDomain: "task-analyzer-1.firebaseapp.com",
  projectId: "task-analyzer-1",
  storageBucket: "task-analyzer-1.firebasestorage.app",
  messagingSenderId: "693281183147",
  appId: "1:693281183147:web:7a34eb10b4c704a77feeee",
});

const messaging = firebase.messaging();

// Handle background FCM messages
messaging.onBackgroundMessage((payload) => {
  console.log("[TANZI SW] Background message:", payload);

  const notification = payload.notification || {};
  const title = notification.title || "TANZI — Task Reminder";
  const body = notification.body || "You have tasks pending today.";

  self.registration.showNotification(title, {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: payload.data?.tag || "tanzi-notification",
    requireInteraction: false,
    data: payload.data || {},
  });
});

// Handle notification click — open/focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open the app
      return clients.openWindow("/app/tasks");
    })
  );
});
