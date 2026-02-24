// src/services/notificationService.jsx
// Production-grade notification service with:
// 1. FCM push notifications (when supported)
// 2. Browser Notification API fallback
// 3. In-app toast reminders for pending tasks

import toast from "react-hot-toast";
import { Bell, X, Clock } from "lucide-react";

// ─── FCM-based notifications (optional, when Firebase Messaging is available) ─

/**
 * Request notification permission and save FCM token to Firestore.
 * Falls back to Browser Notification API if FCM is not supported.
 */
export async function requestNotificationPermission(userId) {
  try {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return null;
    }

    const permission = await Notification.requestPermission();
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
          toast.success("Push notifications enabled! 🔔");
          return token;
        }
      }
    } catch (fcmErr) {
      console.warn("FCM not available, using browser notifications:", fcmErr.message);
    }

    // Fallback: Browser Notification API is now permitted
    toast.success("Notifications enabled! 🔔");
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
 */
export function showBrowserNotification(title, body, options = {}) {
  if (Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, {
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
        className={`flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 shadow-2xl shadow-black/40 max-w-sm w-full transition-all duration-300 ${t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
      >
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <Bell size={16} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{body}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5"
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
 * @param {number} intervalMs - how often to check (default: every 30 minutes)
 */
export function startTaskReminders(getTasksFn, intervalMs = 30 * 60 * 1000) {
  stopTaskReminders(); // Clear any existing reminder

  const checkAndNotify = () => {
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
    if (Notification.permission === "granted") {
      showBrowserNotification(title, body, {
        tag: "tanzi-task-reminder",
        requireInteraction: false,
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

  if (Notification.permission === "granted") {
    showBrowserNotification(title, body, {
      tag: "tanzi-pomodoro",
      requireInteraction: true,
    });
  }

  showInAppNotification(title, body, { duration: 8000, id: "pomodoro-done" });
}
