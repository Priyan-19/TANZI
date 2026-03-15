// src/services/notificationService.jsx
// Production-grade notification service with:
// 1. FCM push notifications (when supported)
// 2. Browser Notification API fallback
// 3. In-app toast reminders for pending tasks

import React from "react";
import toast from "react-hot-toast";
import { Bell, X } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

let pendingAction = null;

/**
 * Get and clear the pending notification action if any.
 */
export function consumePendingAction() {
  const action = pendingAction;
  pendingAction = null;
  return action;
}

/**
 * Initialize native notification listeners once on app start.
 */
export async function initNativeNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Setup Native Local Notification Action Listeners
    await LocalNotifications.removeAllListeners();
    await LocalNotifications.addListener('localNotificationActionPerformed', (result) => {
      console.log('Local Notification Action Performed:', result);

      const action = result.actionId;
      if (['FREE', 'BUSY'].includes(action) || action === 'tap') {
        pendingAction = action;
        window.dispatchEvent(new CustomEvent('checkinReset', { detail: { action } }));
      }

      window.focus();
    });

    // Register Action Types (Free/Busy buttons)
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'CHECKIN_ACTIONS',
          actions: [
            { id: 'FREE', title: 'FREE', foreground: true },
            { id: 'BUSY', title: 'BUSY', foreground: true }
          ]
        }
      ]
    });

    console.log("Native listeners initialized");
  } catch (err) {
    console.error("Failed to init native listeners:", err);
  }
}

export const parseFreq = (f) => {
  if (!f || f === "off") return 0;
  const str = String(f).toLowerCase();
  if (str.endsWith("m")) return parseInt(str) * 60;
  if (str.endsWith("h")) return parseInt(str) * 3600;
  const val = parseInt(str);
  return isNaN(val) ? 0 : val * 60;
};

// ─── FCM-based notifications (optional, when Firebase Messaging is available) ─

/**
 * Request notification permission and save FCM token to Firestore.
 * Falls back to Browser Notification API if FCM is not supported.
 */
export async function requestNotificationPermission(userId) {
  try {
    // ─── NATIVE PLATFORM (Android/iOS) ──────────────────────────────
    if (Capacitor.isNativePlatform()) {
      console.log("Initializing Native Push Notifications...");

      // Request permissions for both Push and Local notifications
      const pushPerms = await PushNotifications.requestPermissions();
      const localPerms = await LocalNotifications.requestPermissions();

      if (pushPerms.receive !== 'granted' && localPerms.display !== 'granted') {
        toast.error("Notification permissions denied.");
        return null;
      }

      // Create a default channel for Android (required for local notifications)
      try {
        await LocalNotifications.createChannel({
          id: 'tanzi_default_channel',
          name: 'Default Notifications',
          description: 'Default notifications for TANZI reminders',
          importance: 5,
          visibility: 1,
          sound: 'beep.wav', // optional
          vibration: true,
        });
      } catch (err) {
        console.warn("Failed to create native notification channel:", err);
      }

      await PushNotifications.register();

      return new Promise((resolve) => {
        PushNotifications.removeAllListeners();

        PushNotifications.addListener('registration', async (token) => {
          console.log('Native Push Token:', token.value);
          const { db } = await import("../firebase/config");
          const { doc, updateDoc } = await import("firebase/firestore");
          await updateDoc(doc(db, "users", userId), { fcmToken: token.value });
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Registration error: ', error);
          toast.error("Failed to register for push.");
          resolve(null);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received (Native): ', notification);
          showInAppNotification(notification.title, notification.body);
        });
      });
    }

    // ─── WEB PLATFORM ───────────────────────────────────────────────
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return null;
    }

    const permission = await window.Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Notifications blocked. Enable them in browser settings.", { id: "notif-blocked" });
      console.warn("Notification permission denied");
      return null;
    }

    // Try FCM if Firebase Messaging is available
    try {
      const [{ getToken }, { getMessagingInstance }, { doc, updateDoc }, { db }] = await Promise.all([
        import("firebase/messaging"),
        import("../firebase/config"),
        import("firebase/firestore"),
        import("../firebase/config"),
      ]);

      const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      const messaging = await getMessagingInstance();

      if (messaging && VAPID_KEY) {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          await updateDoc(doc(db, "users", userId), { fcmToken: token });
          console.log("FCM Token saved:", token);
          return token;
        }
      }
    } catch (fcmErr) {
      console.warn("FCM not available, using browser notifications:", fcmErr.message);
    }

    // Fallback: Browser Notification API is now permitted
    return "browser-notification";
  } catch (err) {
    console.error("Failed to setup notifications:", err);
    return null;
  }
}

/**
 * Listen for FCM foreground messages (only if FCM is initialized).
 */
export async function setupForegroundMessageHandler(onNotification) {
  try {
    const [{ onMessage }, { getMessagingInstance }] = await Promise.all([
      import("firebase/messaging"),
      import("../firebase/config"),
    ]);

    const messaging = await getMessagingInstance();
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log("Foreground FCM message:", payload);
      const { title, body } = payload.notification || {};

      if (onNotification) {
        onNotification(payload);
      } else {
        showInAppNotification(title || "TANZI", body || "You have a new notification");
      }
    });
  } catch (err) {
    console.warn("FCM foreground listener not available:", err.message);
  }
}

// ─── Browser Notification API ─────────────────────────────────────────────────

/**
 * Show a native browser notification (requires permission).
 * Uses Service Worker if available to support actions and background clicks.
 */
export async function showBrowserNotification(title, body, options = {}) {
  // ─── NATIVE PLATFORM (Android/iOS) ──────────────────────────────
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 100) },
            extra: options.data || {},
            smallIcon: 'ic_stat_tanzi',
            channelId: 'tanzi_default_channel',
          }
        ]
      });
      return;
    } catch (err) {
      console.error("Native local notification error:", err);
    }
  }

  // ─── WEB PLATFORM ───────────────────────────────────────────────
  if (typeof window === "undefined" || !window.Notification || window.Notification?.permission !== "granted") return;

  try {
    // 1. Try Service Worker Registration (Supports Actions on Mobile)
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: "/favicon.svg",
          badge: "/favicon.svg",
          tag: options.tag || "tanzi-notification",
          requireInteraction: options.requireInteraction || false,
          actions: options.actions || [],
          data: options.data || {},
          ...options,
        });
        return;
      }
    }

    // 2. Fallback to default Notification API
    const notification = new window.Notification(title, {
      body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: options.tag || "tanzi-notification",
      requireInteraction: options.requireInteraction || false,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) options.onClick();
    };

    return notification;
  } catch (err) {
    console.error("Browser notification error:", err);
  }
}

// ─── In-App Toast Notification ────────────────────────────────────────────────

/**
 * Show a rich in-app notification toast.
 */
export function showInAppNotification(title, body, options = {}) {
  toast.custom(
    (t) => (
      <div
        className={`flex items-start gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-2xl shadow-slate-200/40 max-w-sm w-full transition-all duration-300 ${t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
      >
        <div className="w-9 h-9 rounded-xl bg-primary-600/10 flex items-center justify-center flex-shrink-0">
          <Bell size={16} className="text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 tracking-tight italic">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{body}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 mt-0.5"
        >
          <X size={14} />
        </button>
      </div>
    ),
    {
      duration: options.duration || 6000,
      position: "top-right",
      id: options.id,
    }
  );
}

// ─── Task Reminder System ─────────────────────────────────────────────────────

let reminderInterval = null;

/**
 * Start a background task reminder that checks for pending tasks
 * and notifies the user if they're running late.
 * 
 * @param {Function} getTasksFn - function that returns current tasks array
 * @param {number} intervalMs - how often to check
 * @param {Function} getUserFn - optional function to check user busy status
 */
export function startTaskReminders(getTasksFn, intervalMs = 30 * 60 * 1000, getUserFn = null) {
  stopTaskReminders(); // Clear any existing reminder

  const checkAndNotify = () => {
    // 1. Check Busy Status
    if (getUserFn) {
      const userData = getUserFn();
      if (userData?.busyUntil) {
        const busyDate = userData.busyUntil.toDate ? userData.busyUntil.toDate() : new Date(userData.busyUntil);
        if (busyDate > new Date()) {
          console.log("User is BUSY until", busyDate.toLocaleTimeString(), "- Skipping notification.");
          return;
        }
      }
    }

    const tasks = getTasksFn();
    if (!tasks || tasks.length === 0) return;

    const today = new Date().toISOString().split("T")[0];
    const pendingToday = tasks.filter(
      (t) => t.date === today && t.status === "pending"
    );

    if (pendingToday.length === 0) return;

    const hour = new Date().getHours();
    const isWorkingHours = hour >= 8 && hour <= 22;
    if (!isWorkingHours) return;

    const title = `⏰ ${pendingToday.length} Task${pendingToday.length > 1 ? "s" : ""} Pending`;
    const body =
      pendingToday.length === 1
        ? `Don't forget: "${pendingToday[0].title}"`
        : `You have ${pendingToday.length} tasks to complete today. Keep going!`;

    // Show browser notification
    const isGranted = (typeof window !== "undefined" && window.Notification?.permission === "granted");
    if (isGranted) {
      const user = getUserFn ? getUserFn() : null;
      showBrowserNotification(title, body, {
        tag: "tanzi-task-reminder",
        requireInteraction: true,
        data: { userId: user?.uid, type: "SMART_REACH_OUT", actionUrl: "/#/app/tasks" },
        actions: [
          { action: "FREE", title: "I'M FREE" },
          { action: "BUSY", title: "BUSY" }
        ],
        onClick: () => window.focus(),
      });
    }

    // Also show in-app toast
    showInAppNotification(title, body, {
      id: "task-reminder",
      duration: 8000,
    });
  };

  // Run immediately, then on interval
  checkAndNotify();
  reminderInterval = setInterval(checkAndNotify, intervalMs);

  console.log(`Task reminders started (every ${intervalMs / 60000} min)`);
  return reminderInterval;
}

/**
 * Dismiss any active notifications (native/sw) and cancel pending ones.
 */
export async function dismissNotifications() {
  if (Capacitor.isNativePlatform()) {
    try {
      // Clear delivered notifications from bar
      await LocalNotifications.removeAllDeliveredNotifications();
      // Cancel pending scheduled notifications (like future check-ins)
      const { notifications } = await LocalNotifications.getPending();
      if (notifications.length > 0) {
        await LocalNotifications.cancel({ notifications });
      }
    } catch (err) {
      console.warn("Failed to clear native notifications:", err);
    }
  }

  // Web SW path
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const notifs = await registration.getNotifications();
        notifs.forEach(n => n.close());
      }
    } catch (err) {
      console.warn("Failed to clear SW notifications:", err);
    }
  }
}

/**
 * Schedule a batch of native local notifications for future check-ins.
 * This ensures notifications continue to trigger even if the app is 
 * completely closed (killed) by the OS.
 */
export async function scheduleCheckInBatch(firstTargetMs, intervalSeconds) {
  if (!Capacitor.isNativePlatform() || intervalSeconds <= 0) return;

  try {
    const START_ID = 900;
    const BATCH_SIZE = 20; // Schedule next 20 check-ins

    // Ensure channel exists
    await LocalNotifications.createChannel({
      id: "tanzi_default_channel",
      name: "Default Notifications",
      description: "Default notifications for reminders",
      importance: 5,
      visibility: 1,
      vibration: true,
    }).catch(() => { });

    // Cancel any previous batch
    const pending = await LocalNotifications.getPending();
    const idsToCancel = pending.notifications
      .map(n => n.id)
      .filter(id => id >= START_ID && id < START_ID + BATCH_SIZE);

    if (idsToCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: idsToCancel.map(id => ({ id })) });
    }

    const notifications = [];
    let nextTime = firstTargetMs;

    for (let i = 0; i < BATCH_SIZE; i++) {
      const trace_time = new Date(nextTime);
      if (nextTime > Date.now()) {
        const timeStr = trace_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        notifications.push({
          title: `Are You Free..? ⏰`,
          body: `Check Out Your Tasks`,
          id: START_ID + i,
          schedule: { at: trace_time },
          smallIcon: 'ic_stat_tanzi',
          largeIcon: 'ic_stat_tanzi',
          channelId: 'tanzi_default_channel',
          actionTypeId: 'CHECKIN_ACTIONS',
          allowWhileIdle: true,
        });
      }
      nextTime += (intervalSeconds * 1000);
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log(`Scheduled ${notifications.length} check-ins starting at ${new Date(firstTargetMs).toLocaleTimeString()}`);
    }
  } catch (err) {
    console.error("Error scheduling check-in batch:", err);
  }
}

/**
 * Stop the background task reminder.
 */
export function stopTaskReminders() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

// ─── Pomodoro Notification ────────────────────────────────────────────────────

/**
 * Notify the user when a Pomodoro session ends.
 */
export function notifyPomodoroComplete(isBreak = false) {
  const title = isBreak ? "☀️ Break's over!" : "🎉 Focus session complete!";
  const body = isBreak
    ? "Time to get back to work. Start your next focus session."
    : "Great work! Take a 5-minute break, then keep going.";

  const isGranted = (typeof window !== "undefined" && window.Notification?.permission === "granted");
  if (isGranted) {
    showBrowserNotification(title, body, {
      tag: "tanzi-pomodoro",
      requireInteraction: true,
    });
  }

  showInAppNotification(title, body, { duration: 8000, id: "pomodoro-done" });
}
/**
 * Notify the user when an analytics report is generated.
 * APPLICABLE ONLY FOR MOBILE APP.
 */
export function notifyReportGenerated(type) {
  if (!Capacitor.isNativePlatform()) return;

  const title = `${type} Report Ready 📊`;
  const body = `Your ${type.toLowerCase()} productivity analytics are now available.`;

  showBrowserNotification(title, body, {
    tag: `tanzi-report-${type.toLowerCase()}`,
    requireInteraction: true,
  });
}
