// public/firebase-messaging-sw.js
// Firebase Service Worker for:
// 1. Background FCM push messages
// 2. Sleep boundary detection & automated check-in scheduling
// 3. Auto-resume check-in timer when sleep ends (background)

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

// ─── Helper: Parse HH:MM into total minutes from midnight ────────────────────
function parseClockTime(value) {
  if (!value) return 0;
  const str = String(value).trim();
  
  // Try 12h format first
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[3].toLowerCase();
    if (meridiem === "am" && hours === 12) hours = 0;
    else if (meridiem === "pm" && hours !== 12) hours += 12;
    return (hours * 60) + minutes;
  }

  // Fallback: parse as 24h format
  const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    let hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    hours = (hours === 24) ? 0 : hours % 24;
    return (hours * 60) + minutes;
  }

  return 0;
}

// ─── Helper: Check if currently in sleep window ──────────────────────────────
function isInSleepWindow(start, end) {
  const startMins = parseClockTime(start);
  const endMins = parseClockTime(end);
  const now = new Date();
  const currentMins = (now.getHours() * 60) + now.getMinutes();

  if (startMins === endMins) return false;

  // Cross-midnight window (e.g., 22:00 – 07:00)
  if (endMins < startMins) {
    return currentMins >= startMins || currentMins < endMins;
  }

  // Same-day window (e.g., 00:00 – 07:00)
  return currentMins >= startMins && currentMins < endMins;
}

// ─── Helper: Get ms until next boundary (sleep end) ──────────────────────────
function getMsUntilSleepEnd(start, end) {
  const endMins = parseClockTime(end);
  const startMins = parseClockTime(start);
  const now = new Date();
  const currentMins = (now.getHours() * 60) + now.getMinutes();
  const currentMs = now.getTime();

  let endDate = new Date(now);
  endDate.setHours(0, 0, 0, 0);
  endDate.setMinutes(endMins);

  // If cross-midnight window and we are past midnight (i.e., wake time is today)
  if (endMins < startMins && currentMins < endMins) {
    // endDate is today
  } else if (endDate.getTime() <= currentMs) {
    // Wake time already passed today → move to tomorrow
    endDate.setDate(endDate.getDate() + 1);
  }

  return Math.max(0, endDate.getTime() - currentMs);
}

// ─── SW: Background Sleep Boundary Check ─────────────────────────────────────
// Uses a periodic SW keepalive approach to schedule wake-on-sleep-end.
// Cache of the registered alarm timeout handles (not persistent across SW lifetime)
let sleepEndTimeoutId = null;

function scheduleSleepEndWakeUp(sleepStart, sleepEnd, freqSeconds) {
  if (sleepEndTimeoutId) {
    clearTimeout(sleepEndTimeoutId);
    sleepEndTimeoutId = null;
  }

  if (!isInSleepWindow(sleepStart, sleepEnd)) return;
  if (!freqSeconds || freqSeconds <= 0) return;

  const msUntilEnd = getMsUntilSleepEnd(sleepStart, sleepEnd);
  if (msUntilEnd <= 0) return;

  console.log(`[TANZI SW] Scheduling sleep-end wakeup in ${Math.round(msUntilEnd / 60000)} min`);

  sleepEndTimeoutId = setTimeout(async () => {
    console.log("[TANZI SW] Sleep window ended. Sending wake-up notification.");

    // Show the wake-up notification
    await self.registration.showNotification("☀️ Good Morning — TANZI Active!", {
      body: `Your check-in routine has resumed (every ${freqSeconds >= 3600 ? freqSeconds / 3600 + "h" : freqSeconds / 60 + "m"}). Time to take on the day!`,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: "tanzi-sleep-end",
      requireInteraction: false,
    });

    // Post message to any open clients to resume the timer
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      client.postMessage({
        type: "SLEEP_ENDED",
        freqSeconds,
      });
    }
  }, msUntilEnd + 500); // +500ms buffer past boundary
}

// ─── SW: Message Handler (from main app thread) ───────────────────────────────
self.addEventListener("message", (event) => {
  const { type, sleepStart, sleepEnd, freqSeconds } = event.data || {};

  if (type === "SCHEDULE_SLEEP_END_WAKEUP") {
    scheduleSleepEndWakeUp(sleepStart, sleepEnd, freqSeconds);
  }

  if (type === "CANCEL_SLEEP_END_WAKEUP") {
    if (sleepEndTimeoutId) {
      clearTimeout(sleepEndTimeoutId);
      sleepEndTimeoutId = null;
      console.log("[TANZI SW] Sleep-end wakeup cancelled.");
    }
  }
});

// ─── Handle background FCM messages ──────────────────────────────────────────
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

// ─── Handle notification click — open/focus the app ───────────────────────────
self.addEventListener("notificationclick", (event) => {
  const notificationData = event.notification.data || {};
  event.notification.close();

  // Handle BUSY action
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

  // Default or FREE action — open/focus the app
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const targetUrl = notificationData.actionUrl || "/#/app/tasks";

      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
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
