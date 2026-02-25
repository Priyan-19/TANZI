// public/firebase-messaging-sw.js
// Firebase Service Worker for background FCM messages (Background Push Notifications)

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js");

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
const db = firebase.firestore();

// Handle background FCM messages
messaging.onBackgroundMessage((payload) => {
  console.log("[TANZI SW] Background message:", payload);

  const notification = payload.notification || {};
  const title = notification.title || "TANZI — Task Reminder";
  const body = notification.body || "You have tasks pending today.";

  const actions = [];
  if (payload.data?.type === "SMART_REACH_OUT") {
    actions.push({ action: "FREE", title: "✅ I'M FREE" });
    actions.push({ action: "BUSY", title: "⏳ BUSY" });
  }

  self.registration.showNotification(title, {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: payload.data?.tag || "tanzi-notification",
    actions,
    requireInteraction: true,
    data: payload.data || {},
  });
});

// Handle notification click — open/focus the app
self.addEventListener("notificationclick", (event) => {
  const notificationData = event.notification.data || {};
  event.notification.close();

  // Handle Action Buttons
  if (event.action === "BUSY" && notificationData.userId) {
    const busyUntil = new Date();
    busyUntil.setHours(busyUntil.getHours() + 1);

    event.waitUntil(
      db.collection("users").doc(notificationData.userId).update({
        busyUntil: firebase.firestore.Timestamp.fromDate(busyUntil)
      }).then(() => {
        console.log("[TANZI SW] User marked as busy for 1hr");
      })
    );
    return;
  }

  // Default behavior or "FREE" action — open/focus the app
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const targetUrl = notificationData.actionUrl || "/app/tasks";

      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          // If already open, navigate to tasks if needed and focus
          if (!client.url.includes(targetUrl)) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
