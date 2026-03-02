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
 * Generate or update a weekly report
 */
export async function generateWeeklyReport(userId, date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const dateStr = format(start, "yyyy-MM-dd");

  const reports = await fetchReportsForRange(userId, start, end);

  const totalTasks = reports.reduce((s, r) => s + r.totalTasks, 0);
  const completedTasks = reports.reduce((s, r) => s + r.completedTasks, 0);
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const reportId = `${userId}_W_${dateStr}`;
  await setDoc(doc(db, "weeklyReports", reportId), {
    userId,
    weekStart: dateStr,
    totalTasks,
    completedTasks,
    pendingTasks,
    completionRate,
    updatedAt: Timestamp.now(),
  });

  return { totalTasks, completedTasks, pendingTasks, completionRate };
}

/**
 * Generate or update a monthly report
 */
export async function generateMonthlyReport(userId, date = new Date()) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const dateStr = format(start, "yyyy-MM-dd");

  const reports = await fetchReportsForRange(userId, start, end);

  const totalTasks = reports.reduce((s, r) => s + r.totalTasks, 0);
  const completedTasks = reports.reduce((s, r) => s + r.completedTasks, 0);
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const reportId = `${userId}_M_${dateStr}`;
  await setDoc(doc(db, "monthlyReports", reportId), {
    userId,
    monthStart: dateStr,
    totalTasks,
    completedTasks,
    pendingTasks,
    completionRate,
    updatedAt: Timestamp.now(),
  });

  return { totalTasks, completedTasks, pendingTasks, completionRate };
}

/**
 * Automated report checker: checks if reports need generation based on schedule.
 * Call this on app load or analytics view.
 */
export async function checkAndGenerateAutomatedReports(userId) {
  if (!userId) return;

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const hour = now.getHours();

  const lastDaily = localStorage.getItem(`last_daily_gen_${userId}`);
  const lastWeekly = localStorage.getItem(`last_weekly_gen_${userId}`);
  const lastMonthly = localStorage.getItem(`last_monthly_gen_${userId}`);

  const results = { daily: false, weekly: false, monthly: false };

  // 1. Daily Report (8:00 AM)
  if (hour >= 8 && lastDaily !== todayStr) {
    // Generate report for YESTERDAY
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    await generateDailyReport(userId, yesterday);
    localStorage.setItem(`last_daily_gen_${userId}`, todayStr);
    results.daily = true;
  }

  // 2. Weekly Report (Sunday Morning)
  const isSunday = now.getDay() === 0;
  const weekKey = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-ww");
  if (isSunday && hour >= 6 && lastWeekly !== weekKey) {
    await generateWeeklyReport(userId, now);
    localStorage.setItem(`last_weekly_gen_${userId}`, weekKey);
    results.weekly = true;
  }

  // 3. Monthly Report (Last day of month, morning)
  const lastDay = endOfMonth(now).getDate();
  const isLastDay = now.getDate() === lastDay;
  const monthKey = format(now, "yyyy-MM");
  if (isLastDay && hour >= 6 && lastMonthly !== monthKey) {
    await generateMonthlyReport(userId, now);
    localStorage.setItem(`last_monthly_gen_${userId}`, monthKey);
    results.monthly = true;
  }

  return results;
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

