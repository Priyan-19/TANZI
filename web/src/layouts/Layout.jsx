// src/layouts/Layout.jsx
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTask } from "../context/TaskContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard, CheckSquare, BarChart3, LogOut,
  Sun, Moon, Menu, X, Zap, Bell,
  CheckCircle2, AlertCircle, ChevronRight
} from "lucide-react";
import {
  requestNotificationPermission,
  startTaskReminders,
  stopTaskReminders,
  setupForegroundMessageHandler,
} from "../services/notificationService";

const navItems = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/app/analytics", icon: BarChart3, label: "Analytics" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { tasks } = useTask();
  const { isDark, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const navigate = useNavigate();
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // ─── Start task reminders after login ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Setup FCM foreground listener
    setupForegroundMessageHandler(null);

    // Only start reminders if permission is already granted
    if (Notification.permission === "granted") {
      startTaskReminders(() => tasksRef.current, 30 * 60 * 1000);
    }

    return () => stopTaskReminders();
  }, [user]);

  const handleNotifSetup = async () => {
    const token = await requestNotificationPermission(user?.uid);
    if (token) {
      setNotifStatus("granted");
      startTaskReminders(() => tasksRef.current, 30 * 60 * 1000);
    } else {
      setNotifStatus(
        typeof Notification !== "undefined" ? Notification.permission : "denied"
      );
    }
  };

  const handleLogout = async () => {
    stopTaskReminders();
    await logout();
    navigate("/login");
  };

  // Pending tasks count for badge
  const today = new Date().toISOString().split("T")[0];
  const pendingCount = tasks.filter(
    (t) => t.date === today && t.status === "pending"
  ).length;

  const isNotifGranted = notifStatus === "granted";
  const isNotifDenied = notifStatus === "denied";

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      {/* ─── Sidebar ─── */}
      <aside
        className={`
          flex flex-col transition-all duration-300 border-r border-slate-200 dark:border-slate-800/70
          bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950
          ${collapsed ? "w-16" : "w-64"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center px-4 py-5 border-b border-slate-200 dark:border-slate-800/70">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
              <Zap size={16} className="text-white" />
            </div>
            {!collapsed && (
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent truncate">
                TANZI
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto text-slate-500 hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-800/50"
          >
            {collapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/70">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md shadow-violet-500/20">
                {(user?.displayName || user?.email || "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app"}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                ${isActive
                  ? "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300 border border-violet-500/20 dark:border-violet-500/25"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
              {/* Pending badge on Tasks */}
              {label === "Tasks" && pendingCount > 0 && (
                <span
                  className={`
                    ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400
                    ${collapsed
                      ? "absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[9px] bg-amber-500 text-white"
                      : ""
                    }
                  `}
                >
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="px-2 py-3 border-t border-slate-200 dark:border-slate-800/70 space-y-0.5">
          {/* Notification button */}
          {!isNotifGranted && !isNotifDenied && (
            <button
              onClick={handleNotifSetup}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-amber-400 hover:bg-amber-400/10 transition-all text-sm"
              title="Enable Notifications"
            >
              <div className="relative flex-shrink-0">
                <Bell size={17} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              </div>
              {!collapsed && <span className="font-medium">Enable Notifications</span>}
            </button>
          )}

          {isNotifGranted && (
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-emerald-400/80 text-xs"
              title="Notifications active"
            >
              <CheckCircle2 size={15} className="flex-shrink-0" />
              {!collapsed && <span>Notifications active</span>}
            </div>
          )}

          {isNotifDenied && (
            <button
              onClick={handleNotifSetup}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-all text-sm group"
              title="Notifications are blocked. Click to try re-enabling or check browser settings."
            >
              <AlertCircle size={15} className="flex-shrink-0" />
              {!collapsed && (
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-medium">Notifications blocked</span>
                  <span className="text-[10px] opacity-70 truncate">Click to try again</span>
                </div>
              )}
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all text-sm"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun size={17} className="flex-shrink-0" />
            ) : (
              <Moon size={17} className="flex-shrink-0" />
            )}
            {!collapsed && (isDark ? "Light Mode" : "Dark Mode")}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-all text-sm"
            title="Logout"
          >
            <LogOut size={17} className="flex-shrink-0" />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50 flex-shrink-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                <AlertCircle size={11} />
                {pendingCount} pending today
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-violet-500/20">
              {(user?.displayName || user?.email || "U")[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
