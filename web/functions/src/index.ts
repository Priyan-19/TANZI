// Firebase Cloud Functions for Task Analyzer
// Deploy with: firebase deploy --only functions

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// ─── Smart Dynamic Notification System ────────────────────────────────────────
// Triggered every 15 minutes via Cloud Scheduler
// Schedule: "*/15 8-22 * * *" (8 AM to 10 PM)
export const sendHourlyNotifications = functions.pubsub
  .schedule("*/15 8-22 * * *")
  .timeZone("UTC") // ideally should be dynamic per user, but for now UTC
  .onRun(async () => {
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    const freqMap: Record<string, number> = {
      "15m": 15 * 60 * 1000,
      "30m": 30 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "2h": 120 * 60 * 1000,
    };

    console.log(`Smart notification job running at: ${new Date().toISOString()}`);

    // Fetch users with FCM tokens and notifications enabled
    const usersSnap = await db
      .collection("users")
      .where("fcmToken", "!=", null)
      .get();

    if (usersSnap.empty) return null;

    const promises: Promise<any>[] = [];

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const { fcmToken, name, notifFrequency = "1h", lastHourlyNotifAt, busyUntil } = userData;

      if (!fcmToken || notifFrequency === "off") continue;

      const interval = freqMap[notifFrequency] || freqMap["1h"];
      const lastSend = lastHourlyNotifAt ? lastHourlyNotifAt.toMillis() : 0;
      const busyUntilTime = busyUntil ? busyUntil.toMillis() : 0;

      // Logic check: Is it time to notify and is user NOT busy?
      // Busy check: skip if current time is less than busyUntilTime
      if (now < lastSend + (interval - 60000)) continue; // -1 minute buffer for scheduler jitter
      if (now < busyUntilTime) {
        console.log(`Skipping notification for user ${userDoc.id} as they are BUSY until ${new Date(busyUntilTime).toLocaleTimeString()}`);
        continue;
      }

      // Check if user has pending tasks today before bothering them
      const taskCheck = db
        .collection("tasks")
        .where("userId", "==", userDoc.id)
        .where("date", "==", today)
        .where("status", "==", "pending")
        .limit(1)
        .get()
        .then(async (tasksSnap) => {
          if (tasksSnap.empty) return;

          const message: admin.messaging.Message = {
            token: fcmToken,
            notification: {
              title: "Are you Free or Busy?",
              body: `Hey ${name || "there"}, you have pending tasks today. Ready to focus?`,
            },
            data: {
              type: "SMART_REACH_OUT",
              userId: userDoc.id,
              actionUrl: "/app/tasks",
            },
            webpush: {
              notification: {
                icon: "/favicon.svg",
                badge: "/favicon.svg",
                actions: [
                  { action: "FREE", title: "✅ I'M FREE" },
                  { action: "BUSY", title: "⏳ BUSY" },
                ],
                requireInteraction: true,
              },
              fcmOptions: {
                link: "/app/tasks",
              },
            },
          };

          await messaging.send(message);
          return userDoc.ref.update({
            lastHourlyNotifAt: admin.firestore.Timestamp.now(),
          });
        })
        .catch((err) => {
          console.error(`Error sending to ${userDoc.id}:`, err);
        });

      promises.push(taskCheck);
    }

    await Promise.allSettled(promises);
    return null;
  });

// ─── Handle BUSY response: reschedule (mark user as busy for 1 hour) ─────────
export const handleBusyResponse = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const { userId } = data;
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError("permission-denied", "Cannot update other users");
  }

  // Mark the user as busy until the next hour
  const busyUntil = new Date();
  busyUntil.setHours(busyUntil.getHours() + 1);

  await db.doc(`users/${userId}`).update({
    busyUntil: admin.firestore.Timestamp.fromDate(busyUntil),
  });

  return { success: true, message: "Reminder rescheduled for 1 hour." };
});

// ─── Handle FREE response: return pending tasks ───────────────────────────────
export const getPendingTasksForUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const today = new Date().toISOString().split("T")[0];
  const snap = await db
    .collection("tasks")
    .where("userId", "==", context.auth.uid)
    .where("date", "==", today)
    .where("status", "==", "pending")
    .get();

  const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { tasks };
});

// ─── Daily end-of-day analytics aggregation (11:59 PM daily) ─────────────────
export const generateDailyReports = functions.pubsub
  .schedule("59 23 * * *")
  .timeZone("UTC")
  .onRun(async () => {
    const today = new Date().toISOString().split("T")[0];
    console.log(`Generating daily reports for ${today}`);

    const usersSnap = await db.collection("users").get();
    const promises: Promise<any>[] = [];

    usersSnap.forEach((userDoc) => {
      const userId = userDoc.id;

      const p = db
        .collection("tasks")
        .where("userId", "==", userId)
        .where("date", "==", today)
        .get()
        .then((tasksSnap) => {
          const tasks = tasksSnap.docs.map((d) => d.data());
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter((t) => t.status === "completed").length;
          const pendingTasks = totalTasks - completedTasks;
          const completionRate =
            totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          if (totalTasks === 0) return;

          const reportId = `${userId}_${today}`;
          return db.doc(`dailyReports/${reportId}`).set({
            userId,
            date: today,
            totalTasks,
            completedTasks,
            pendingTasks,
            completionRate,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });

      promises.push(p);
    });

    await Promise.allSettled(promises);
    console.log("Daily reports generated.");
    return null;
  });

// ─── Update streak on task completion ────────────────────────────────────────
export const updateStreak = functions.firestore
  .document("tasks/{taskId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger when a task is marked as completed
    if (before.status !== "pending" || after.status !== "completed") return null;

    const { userId } = after;
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let { streakCount = 0, lastActiveDate = null } = userData;

    if (lastActiveDate === today) {
      // Already counted today
      return null;
    } else if (lastActiveDate === yesterday) {
      // Continuing streak
      streakCount += 1;
    } else {
      // Streak broken or new streak
      streakCount = 1;
    }

    await userRef.update({ streakCount, lastActiveDate: today });
    console.log(`Streak updated for ${userId}: ${streakCount} days`);
    return null;
  });
