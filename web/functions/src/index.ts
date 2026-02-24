// functions/src/index.ts
// Firebase Cloud Functions for Task Analizer
// Deploy with: firebase deploy --only functions

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// ─── Hourly "Are you Free or Busy?" notification ─────────────────────────────
// Triggered every hour via Cloud Scheduler (Pub/Sub)
// Schedule: "0 8-22 * * *"  (every hour from 8 AM to 10 PM)

export const sendHourlyNotifications = functions.pubsub
  .schedule("0 8-22 * * *")
  .timeZone("UTC") // adjust to your timezone e.g., "America/New_York"
  .onRun(async () => {
    const hour = new Date().getHours();
    console.log(`Hourly notification job running at hour: ${hour}`);

    // Fetch all users who have an FCM token
    const usersSnap = await db
      .collection("users")
      .where("fcmToken", "!=", null)
      .get();

    if (usersSnap.empty) {
      console.log("No users with FCM tokens found.");
      return null;
    }

    const today = new Date().toISOString().split("T")[0];
    const promises: Promise<any>[] = [];

    usersSnap.forEach((userDoc) => {
      const { fcmToken, name } = userDoc.data();
      if (!fcmToken) return;

      // Check if user has pending tasks today
      const taskCheck = db
        .collection("tasks")
        .where("userId", "==", userDoc.id)
        .where("date", "==", today)
        .where("status", "==", "pending")
        .get()
        .then((tasksSnap) => {
          if (tasksSnap.empty) return; // No tasks to notify about

          const message: admin.messaging.Message = {
            token: fcmToken,
            notification: {
              title: "⏰ Quick check-in!",
              body: `Hey ${name || "there"}, are you free or busy right now?`,
            },
            data: {
              type: "FREE_OR_BUSY",
              userId: userDoc.id,
              pendingCount: String(tasksSnap.size),
              actionUrl: "/tasks",
            },
            android: {
              priority: "high",
              notification: {
                channelId: "task_reminders",
                clickAction: "FREE_OR_BUSY_ACTION",
              },
            },
            apns: {
              payload: {
                aps: {
                  category: "FREE_OR_BUSY_CATEGORY",
                  sound: "default",
                },
              },
            },
            webpush: {
              notification: {
                icon: "/icon-192.png",
                badge: "/badge.png",
                actions: [
                  { action: "FREE", title: "✅ I'm Free!" },
                  { action: "BUSY", title: "⏳ I'm Busy" },
                ],
                requireInteraction: true,
              },
              fcmOptions: {
                link: "/tasks",
              },
            },
          };

          return messaging.send(message).catch((err) => {
            console.error(`Failed to send to ${userDoc.id}:`, err.code);
            // If token is invalid, remove it
            if (
              err.code === "messaging/registration-token-not-registered" ||
              err.code === "messaging/invalid-registration-token"
            ) {
              return db.doc(`users/${userDoc.id}`).update({ fcmToken: null });
            }
          });
        });

      promises.push(taskCheck);
    });

    await Promise.allSettled(promises);
    console.log(`Hourly notifications dispatched to ${usersSnap.size} users.`);
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
