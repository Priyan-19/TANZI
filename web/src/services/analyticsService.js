// src/services/analyticsService.js
import {
  collection, query, where, getDocs, setDoc, doc,
  orderBy, Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

/**
 * Generate or update a daily report for a user
 */
export async function generateDailyReport(userId, date) {
  const dateStr = format(date, "yyyy-MM-dd");

  // Fetch all tasks for this user on this date
  const q = query(
    collection(db, "tasks"),
    where("userId", "==", userId),
    where("date", "==", dateStr)
  );

  const snap = await getDocs(q);
  const tasks = snap.docs.map((d) => d.data());

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const reportId = `${userId}_${dateStr}`;
  await setDoc(doc(db, "dailyReports", reportId), {
    userId,
    date: dateStr,
    totalTasks,
    completedTasks,
    pendingTasks,
    completionRate,
    updatedAt: Timestamp.now(),
  });

  return { totalTasks, completedTasks, pendingTasks, completionRate };
}

/**
 * Fetch daily reports for a date range
 */
export async function fetchReportsForRange(userId, startDate, endDate) {
  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  const q = query(
    collection(db, "dailyReports"),
    where("userId", "==", userId),
    where("date", ">=", startStr),
    where("date", "<=", endStr),
    orderBy("date", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

/**
 * Get weekly analytics data (last 7 days)
 */
export async function getWeeklyAnalytics(userId, date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const reports = await fetchReportsForRange(userId, start, end);
  const reportMap = Object.fromEntries(reports.map((r) => [r.date, r]));

  return days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const report = reportMap[dateStr] || {
      totalTasks: 0, completedTasks: 0, pendingTasks: 0, completionRate: 0
    };
    return {
      date: dateStr,
      label: format(day, "EEE"),
      ...report,
    };
  });
}

/**
 * Get monthly analytics data
 */
export async function getMonthlyAnalytics(userId, date = new Date()) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  const reports = await fetchReportsForRange(userId, start, end);

  // Aggregate into weeks
  const weeklyMap = {};
  reports.forEach((r) => {
    const d = new Date(r.date);
    const week = format(startOfWeek(d, { weekStartsOn: 1 }), "MMM d");
    if (!weeklyMap[week]) {
      weeklyMap[week] = { label: week, totalTasks: 0, completedTasks: 0 };
    }
    weeklyMap[week].totalTasks += r.totalTasks;
    weeklyMap[week].completedTasks += r.completedTasks;
  });

  return Object.values(weeklyMap).map((w) => ({
    ...w,
    completionRate: w.totalTasks > 0
      ? Math.round((w.completedTasks / w.totalTasks) * 100)
      : 0,
  }));
}

/**
 * Calculate productivity score (0-100)
 * Based on last 7 days completion rate + streak bonus
 */
export async function calculateProductivityScore(userId) {
  const weekData = await getWeeklyAnalytics(userId);
  const avgCompletion = weekData.reduce((sum, d) => sum + d.completionRate, 0) / 7;
  return Math.round(avgCompletion);
}
