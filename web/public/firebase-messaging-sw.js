// public/firebase-messaging-sw.js
// Firebase Service Worker for background FCM messages

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js");

// ⚠️ Must match your firebase config (use hard-coded values here since env vars aren't available in SW)
firebase.initializeApp({
  apiKey: "__VITE_FIREBASE_API_KEY__",          // Replace during build
  authDomain: "__VITE_FIREBASE_AUTH_DOMAIN__",
  projectId: "__VITE_FIREBASE_PROJECT_ID__",
  storageBucket: "__VITE_FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__VITE_FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__VITE_FIREBASE_APP_ID__",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message received:", payload);

  const { title, body } = payload.notification || {};
  const { type } = payload.data || {};

  if (type === "FREE_OR_BUSY") {
    self.registration.showNotification(title || "Task Analizer", {
      body: body || "Are you free or busy?",
      icon: "/icon-192.png",
      badge: "/badge.png",
      actions: [
        { action: "FREE", title: "✅ I'm Free!" },
        { action: "BUSY", title: "⏳ I'm Busy" },
      ],
      requireInteraction: true,
      data: payload.data,
    });
  } else {
    self.registration.showNotification(title || "Task Analizer", {
      body: body || "",
      icon: "/icon-192.png",
    });
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { action } = event;
  const { userId } = event.notification.data || {};

  if (action === "FREE") {
    // Open the app to the tasks page
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/tasks") && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow("/tasks?notification=free");
      })
    );
  } else if (action === "BUSY") {
    // Migrated from Cloud Functions: Update Firestore directly
    const busyUntil = new Date();
    busyUntil.setHours(busyUntil.getHours() + 1);

    event.waitUntil(
      firebase.firestore().doc(`users/${userId}`).update({
        busyUntil: firebase.firestore.Timestamp.fromDate(busyUntil),
      }).catch(console.error)
    );
  } else {
    // Default click - open app
    event.waitUntil(clients.openWindow("/"));
  }
});
