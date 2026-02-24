// src/layouts/Layout.jsx
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTask } from "../context/TaskContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard, CheckSquare, BarChart3, LogOut,
  Sun, Moon, Menu, X, Zap, Bell,
  AlertCircle, ChevronRight, Settings
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
  const [notifsEnabled, setNotifsEnabled] = useState(() => {
    const saved = localStorage.getItem("notifs_enabled");
    return saved === null ? true : saved === "true";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const navigate = useNavigate();
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // Sync notif status on mount
  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifStatus(Notification.permission);
    }
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!user || !notifsEnabled) {
      stopTaskReminders();
      return;
    }
    setupForegroundMessageHandler(null);
    if (Notification.permission === "granted") {
      startTaskReminders(() => tasksRef.current, 30 * 60 * 1000);
    }
    return () => stopTaskReminders();
  }, [user, notifsEnabled]);

  const toggleNotifs = async () => {
    if (!notifsEnabled) {
      // ── Trying to ENABLE ─────────────────────────────────────────
      const currentPerm = typeof Notification !== "undefined" ? Notification.permission : "default";

      if (currentPerm === "denied") {
        // Permission is hard-denied — show banner with instructions, don't call requestPermission
        setShowNotifBanner(true);
        setTimeout(() => setShowNotifBanner(false), 7000);
        return;
      }

      if (currentPerm !== "granted") {
        // Need to ask for permission first
        await requestNotificationPermission(user?.uid).catch(() => { });
        const perm = typeof Notification !== "undefined" ? Notification.permission : "default";
        setNotifStatus(perm);
        if (perm === "granted") {
          setNotifsEnabled(true);
          localStorage.setItem("notifs_enabled", "true");
          startTaskReminders(() => tasksRef.current, 30 * 60 * 1000);
        } else if (perm === "denied") {
          setShowNotifBanner(true);
          setTimeout(() => setShowNotifBanner(false), 7000);
        }
      } else {
        // Permission already granted — enable immediately, no token needed
        setNotifsEnabled(true);
        localStorage.setItem("notifs_enabled", "true");
        startTaskReminders(() => tasksRef.current, 30 * 60 * 1000);
        // Best-effort FCM token refresh (don't block on it)
        requestNotificationPermission(user?.uid).catch(() => { });
      }
    } else {
      // ── DISABLE ──────────────────────────────────────────────────
      setNotifsEnabled(false);
      localStorage.setItem("notifs_enabled", "false");
      stopTaskReminders();
    }
  };

  const handleLogout = async () => {
    stopTaskReminders();
    await logout();
    navigate("/login");
  };

  const today = new Date().toISOString().split("T")[0];
  const pendingCount = tasks.filter(
    (t) => t.date === today && t.status === "pending"
  ).length;

  return (
    <div className="flex h-screen h-dvh bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-slate-100 overflow-hidden transition-colors duration-500 font-sans selection:bg-violet-500/30">

      {/* ─── Desktop Sidebar ─────────────────────────────────────── */}
      <aside
        className={`
          hidden md:flex flex-col transition-all duration-300 m-4 rounded-3xl
          border border-slate-300/80 dark:border-slate-800/40
          bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl
          shadow-2xl shadow-slate-300/40 dark:shadow-black/40
          ${collapsed ? "w-20" : "w-64"}
        `}
        style={{ overflow: 'visible', clipPath: 'none' }}
      >
        {/* Logo */}
        <div className="flex items-center px-4 py-6">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 p-[2px] shadow-lg shadow-violet-500/30 flex-shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Zap size={18} className="text-white fill-white" />
              </div>
            </div>
            {!collapsed && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.03em', fontStyle: 'italic', background: 'linear-gradient(to right, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block', paddingRight: '4px' }}>
                TANZI
              </span>
            )}
          </Link>
        </div>

        {/* User Card */}
        {!collapsed && (
          <div className="mx-4 mb-4 p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-300/60 dark:border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/20 flex-shrink-0">
                {(user?.displayName || user?.email || "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{user?.displayName || "User"}</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app"}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200
                ${isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25 scale-[1.02]"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                }`
              }
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-bold tracking-tight">{label}</span>}
              {label === "Tasks" && pendingCount > 0 && !collapsed && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-amber-500/20">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 space-y-1">
          {/* Notification Banner - shown when blocked */}
          {showNotifBanner && (
            <div className="mb-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-slide-up">
              <div className="flex items-start gap-2">
                <Bell size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 leading-tight">Notifications blocked</p>
                  <p className="text-[10px] text-amber-700/70 dark:text-amber-500/70 mt-0.5 leading-relaxed">
                    Click the 🔒 lock icon in your browser's address bar, then set Notifications to "Allow".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notification Toggle */}
          <button
            onClick={toggleNotifs}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-2xl transition-all duration-200 group
              ${notifStatus === "denied"
                ? "text-amber-500 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20"
                : notifsEnabled
                  ? "text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"}`}
          >
            <div className="relative flex-shrink-0">
              <Bell size={18} className={notifsEnabled ? "fill-emerald-500/20" : ""} />
              {notifsEnabled && <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />}
            </div>
            {!collapsed && (
              <>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs font-bold leading-tight">Notifications</span>
                  <span className={`text-[10px] font-medium uppercase tracking-tighter ${notifStatus === "denied" ? "text-amber-500/80" : notifsEnabled ? "text-emerald-500/70" : "text-slate-500"
                    }`}>
                    {notifStatus === "denied" ? "Blocked" : notifsEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className={`ml-auto w-8 h-4 rounded-full relative transition-colors duration-300 ${notifsEnabled ? "bg-emerald-500" : notifStatus === "denied" ? "bg-amber-400" : "bg-slate-300 dark:bg-slate-700"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${notifsEnabled ? "left-[18px]" : "left-0.5"}`} />
                </div>
              </>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-all font-bold text-xs"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && (isDark ? "Light Mode" : "Dark Mode")}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold text-xs group"
          >
            <LogOut size={18} className="transition-transform group-hover:translate-x-0.5" />
            {!collapsed && "Sign Out"}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 mx-4 mb-4 rounded-2xl border border-slate-300/60 dark:border-slate-800/50 text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center justify-center transition-all bg-white/50 dark:bg-slate-800/20"
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <div className="flex items-center gap-2"><Menu size={16} /><span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Shrink</span></div>
          }
        </button>
      </aside>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden">

        {/* Top Floating Header */}
        <header className="sticky top-0 z-40 p-3 md:p-4 pb-0">
          <div className="flex items-center justify-between px-4 md:px-6 py-2.5 md:py-3 rounded-2xl bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-300/80 dark:border-slate-800/40 shadow-lg shadow-slate-300/30 dark:shadow-black/20">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden tap-target flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>

              {/* Mobile Logo */}
              <Link to="/" className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 p-[2px] shadow-md shadow-violet-500/25">
                  <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                    <Zap size={14} className="text-white fill-white" />
                  </div>
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.03em', fontStyle: 'italic', background: 'linear-gradient(to right, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block', paddingRight: '3px' }}>TANZI</span>
              </Link>

              {/* Desktop date */}
              <div className="hidden md:flex flex-col">
                <h1 className="text-sm font-black tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                  {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] md:text-xs font-bold animate-slide-up">
                  <AlertCircle size={11} />
                  <span>{pendingCount} Left</span>
                </div>
              )}
              <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-800" />
              <button className="flex items-center gap-2 px-1 py-1 pr-2 md:pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {(user?.displayName || user?.email || "U")[0].toUpperCase()}
                </div>
                <span className="hidden lg:block text-xs font-bold tracking-tighter">My Account</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2 pb-28 md:px-6 md:pt-3 md:pb-6">
          <Outlet />
        </div>

        {/* ─── Mobile Bottom Navigation ─── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <div className="mx-3 mb-3 p-2 rounded-3xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/60 flex items-center justify-around bottom-nav-safe">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/app"}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all duration-200
                  ${isActive
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-300"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute inset-0 bg-violet-600/25 rounded-2xl" />
                    )}
                    <div className="relative">
                      <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
                      {label === "Tasks" && pendingCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-lg">
                          {pendingCount > 9 ? "9+" : pendingCount}
                        </span>
                      )}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? "text-violet-300" : ""}`}>
                      {label}
                    </span>
                    {isActive && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {/* Theme toggle in bottom nav */}
            <button
              onClick={toggle}
              className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl text-slate-500 hover:text-slate-300 transition-all"
            >
              {isDark ? <Sun size={21} strokeWidth={1.8} /> : <Moon size={21} strokeWidth={1.8} />}
              <span className="text-[9px] font-black uppercase tracking-widest">
                {isDark ? "Light" : "Dark"}
              </span>
            </button>
          </div>
        </nav>
      </main>

      {/* ─── Mobile Sidebar Overlay ─────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-3 left-3 bottom-3 w-[min(80vw,300px)] bg-white dark:bg-[#0f172a] rounded-[28px] flex flex-col animate-slide-right border border-slate-300/60 dark:border-slate-800/60 shadow-2xl shadow-black/40 overflow-hidden">

            {/* Panel Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 p-[2px] shadow-lg shadow-violet-500/25">
                  <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center">
                    <Zap size={15} className="text-white fill-white" />
                  </div>
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.03em', fontStyle: 'italic', background: 'linear-gradient(to right, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block', paddingRight: '4px' }}>TANZI</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="tap-target flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* User card */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/20 flex-shrink-0">
                  {(user?.displayName || user?.email || "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">{user?.displayName || "User"}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Nav links */}
            <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/app"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 p-4 rounded-2xl font-bold transition-all
                    ${isActive
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={20} />
                      <span>{label}</span>
                      {label === "Tasks" && pendingCount > 0 && (
                        <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-amber-500 text-white"}`}>
                          {pendingCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Bottom actions */}
            <div className="p-3 space-y-1 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={toggleNotifs}
                className="flex items-center gap-4 w-full p-4 rounded-2xl font-bold transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Bell size={20} />
                <span className="flex-1 text-left">Notifications</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${notifsEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${notifsEnabled ? "left-[22px]" : "left-0.5"}`} />
                </div>
              </button>

              <button
                onClick={toggle}
                className="flex items-center gap-4 w-full p-4 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                {isDark ? "Light Mode" : "Dark Mode"}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-4 w-full p-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
