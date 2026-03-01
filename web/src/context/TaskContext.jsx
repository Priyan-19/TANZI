// src/context/TaskContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, orderBy, getDoc
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";
import { generateDailyReport } from "../services/analyticsService";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, startOfMonth, endOfMonth } from "date-fns";
import toast from "react-hot-toast";

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today"); // today | week | month

  // Real-time Firestore subscription
  useEffect(() => {
    if (!user) { setTasks([]); setLoading(false); return; }

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasksData = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          // Convert Firestore Timestamps to JS Dates for convenience
          createdAt: d.data().createdAt?.toDate?.() || new Date(),
          completedAt: d.data().completedAt?.toDate?.() || null,
        }));
        setTasks(tasksData);
        setLoading(false);
      },
      (error) => {
        console.error("Task listener error:", error);
        toast.error("Failed to sync tasks");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // ── CRUD Operations ─────────────────────────────────────────────────────────

  const addTask = useCallback(async ({ title, description, date }) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "tasks"), {
        userId: user.uid,
        title: title.trim(),
        description: description?.trim() || "",
        date, // YYYY-MM-DD string
        status: "pending",
        createdAt: serverTimestamp(),
        completedAt: null,
      });
      toast.success("Task added!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add task");
    }
  }, [user]);

  const updateTask = useCallback(async (taskId, updates) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), updates);
      toast.success("Task updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task");
    }
  }, []);

  const deleteTask = useCallback(async (taskId) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      toast.success("Task deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  }, []);

  const updateStreak = useCallback(async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      const today = format(new Date(), "yyyy-MM-dd");
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = format(yesterdayDate, "yyyy-MM-dd");

      let { streakCount = 0, lastActiveDate = null } = userData;

      if (lastActiveDate === today) {
        return; // Already counted today
      } else if (lastActiveDate === yesterday) {
        streakCount += 1;
      } else {
        streakCount = 1;
      }

      await updateDoc(userRef, { streakCount, lastActiveDate: today });
      console.log(`Streak updated: ${streakCount} days`);
    } catch (err) {
      console.error("Failed to update streak:", err);
    }
  }, [user]);

  const completeTask = useCallback(async (taskId) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        status: "completed",
        completedAt: serverTimestamp(),
      });
      toast.success("Task completed! 🎉");

      // Migrated from Cloud Functions to Client-side
      await updateStreak();
      await generateDailyReport(user.uid, new Date());
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete task");
    }
  }, [user, updateStreak]);

  const uncompleteTask = useCallback(async (taskId) => {
    await updateDoc(doc(db, "tasks", taskId), {
      status: "pending",
      completedAt: null,
    });
  }, []); // ID-based update, no deps needed really, but user is good for sanity

  // ── Filtered Views ────────────────────────────────────────────────────────

  const getFilteredTasks = useCallback(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");

    if (filter === "today") {
      return tasks.filter((t) => t.date === todayStr);
    }

    if (filter === "week") {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return tasks.filter((t) => {
        const taskDate = parseISO(t.date);
        return isWithinInterval(taskDate, { start, end });
      });
    }

    if (filter === "month") {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return tasks.filter((t) => {
        const taskDate = parseISO(t.date);
        return isWithinInterval(taskDate, { start, end });
      });
    }

    return tasks;
  }, [tasks, filter]);

  const getTodayTasks = useCallback(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return tasks.filter((t) => t.date === todayStr);
  }, [tasks]);

  const getPendingTasks = useCallback(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return tasks.filter((t) => t.date === todayStr && t.status === "pending");
  }, [tasks]);

  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      filter,
      setFilter,
      addTask,
      updateTask,
      deleteTask,
      completeTask,
      uncompleteTask,
      getFilteredTasks,
      getTodayTasks,
      getPendingTasks,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTask = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTask must be used within TaskProvider");
  return ctx;
};
