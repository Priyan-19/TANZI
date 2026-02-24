// src/services/notificationService.js
import { getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { db, getMessagingInstance } from "../firebase/config";
import toast from "react-hot-toast";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(userId) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      // Save token to Firestore user doc
      await updateDoc(doc(db, "users", userId), { fcmToken: token });
      console.log("FCM Token saved:", token);
      return token;
    }
  } catch (err) {
    console.error("Failed to get FCM token:", err);
  }
  return null;
}

/**
 * Listen for foreground messages
 */
export async function setupForegroundMessageHandler(onNotification) {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload);
    const { title, body } = payload.notification || {};

    if (onNotification) {
      onNotification(payload);
    } else {
      toast(
        (t) => (
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-slate-400">{body}</p>
          </div>
        ),
        { duration: 5000 }
      );
    }
  });
}
