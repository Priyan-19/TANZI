// src/layouts/Layout.jsx
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTask } from "../context/TaskContext";
import { useTheme } from "../context/ThemeContext";
import { useTimer } from "../context/TimerContext";
import { format } from "date-fns";
import {
  LayoutDashboard, CheckSquare, BarChart3, LogOut,
  Sun, Moon, Menu, X, Zap, Bell,
  AlertCircle, ChevronRight, Settings, Clock
} from "lucide-react";
import CountdownDisplay from "../components/CountdownDisplay";
import {
  requestNotificationPermission,
  startTaskReminders,
  stopTaskReminders,
  setupForegroundMessageHandler,
  showBrowserNotification,
  dismissNotifications,
  scheduleCheckInBatch,
  initNativeNotifications,
  parseFreq,
  consumePendingAction,
} from "../services/notificationService";
import { Capacitor } from '@capacitor/core';

const navItems = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/app/analytics", icon: BarChart3, label: "Analytics" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { tasks } = useTask();
  const { isDark, toggle } = useTheme();
  const { isAlarmRinging, dismissAlarm: contextDismissAlarm, resetTimer, isSleepMode, toggleSleepMode, sleepSchedule, updateSleepSchedule } = useTimer();
  const [collapsed, setCollapsed] = useState(false);
  const [notifStatus, setNotifStatus] = useState(
    typeof window !== "undefined" && window.Notification ? window.Notification.permission : "default"
  );
  const [notifsEnabled, setNotifsEnabled] = useState(() => {
    const saved = localStorage.getItem("notifs_enabled");
    return saved === null ? true : saved === "true";
  });
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [showSleepSettings, setShowSleepSettings] = useState(false);
  const clickTimerRef = useRef(null);
  const [notifFrequency, setNotifFrequency] = useState("1h");
  const [showFreqSelector, setShowFreqSelector] = useState(false);
  const [showMobileFreqSelector, setShowMobileFreqSelector] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [customFreq, setCustomFreq] = useState("");
  const navigate = useNavigate();
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const userRef = useRef(user);
  userRef.current = user;

  // Sync notif status and settings on mount/user change
  useEffect(() => {
    // 1. Initialize Native Activity Listeners (essential for Action buttons to work)
    initNativeNotifications();

    // 2. Check for pending notification actions (app cold start)
    const pending = consumePendingAction();
    if (pending) {
      console.log('Handling pending notification action on mount:', pending);
      // We'll let the event listener handle it if it fires, 
      // but manually trigger handleReset-style logic here for cold starts
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('checkinReset', { detail: { action: pending } }));
      }, 500);
    }

    if (typeof window !== "undefined" && window.Notification) {
      setNotifStatus(window.Notification.permission);
    }
    if (user?.uid) {
      // Basic fetch of user settings if not in auth context
      import("../firebase/config").then(({ db }) => {
        import("firebase/firestore").then(({ doc, getDoc }) => {
          getDoc(doc(db, "users", user.uid)).then(snap => {
            if (snap.exists()) {
              const data = snap.data();
              if (data.notifFrequency) setNotifFrequency(data.notifFrequency);
            }
          });
        });
      });
    }
  }, [user]);

  // Lock body scroll when mobile popover is open
  useEffect(() => {
    if (profilePopoverOpen || showSleepSettings) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [profilePopoverOpen, showSleepSettings]);

  const handleSleepClick = () => {
    if (clickTimerRef.current) {
      // Double tap detected
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      setShowSleepSettings(true);
    } else {
      // Single tap potential
      clickTimerRef.current = setTimeout(() => {
        toggleSleepMode(true);
        clickTimerRef.current = null;
      }, 250);
    }
  };

  // Timer logic has been moved to TimerProvider context for performance.
  // We only handle beep here on web if alarm is active.
  useEffect(() => {
    let audioCtx = null;
    let interval = null;
    if (isAlarmRinging && !Capacitor.isNativePlatform()) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playBeep = () => {
          if (audioCtx.state === 'suspended') audioCtx.resume();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
          oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.5);
        };
        playBeep();
        interval = setInterval(playBeep, 1000);
      } catch (e) {
        console.error("Audio error:", e);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx) audioCtx.close().catch(() => { });
    };
  }, [isAlarmRinging]);

  const handleDismissAlarm = () => {
    contextDismissAlarm(notifFrequency);
  };

  useEffect(() => {
    const handleReset = (e) => {
      console.log('Resetting check-in via native notification listener:', e.detail.action);
      contextDismissAlarm(notifFrequency);
      if (e.detail.action === 'FREE') {
        navigate("/app/tasks");
      }
    };
    window.addEventListener('checkinReset', handleReset);
    return () => window.removeEventListener('checkinReset', handleReset);
  }, [notifFrequency]);

  // CountdownDisplay is now a standalone component in ../components/CountdownDisplay.jsx

  const toggleNotifs = async () => {
    // Safe helper — returns "granted"/"denied"/"default" regardless of platform
    const getPermStatus = () => {
      if (typeof window !== "undefined" && window.Notification) {
        return window.Notification.permission;
      }
      // On native Capacitor, window.Notification is undefined; treat as grantable
      return "default";
    };

    if (!notifsEnabled) {
      // ── Trying to ENABLE ─────────────────────────────────────────
      const currentPerm = getPermStatus();

      if (currentPerm === "denied") {
        // Permission is hard-denied — show banner with instructions
        setShowNotifBanner(true);
        setTimeout(() => setShowNotifBanner(false), 7000);
        return;
      }

      if (currentPerm !== "granted") {
        // Need to ask for permission first
        await requestNotificationPermission(user?.uid).catch(() => { });
        const perm = getPermStatus();
        setNotifStatus(perm);
        if (perm === "granted") {
          setNotifsEnabled(true);
          localStorage.setItem("notifs_enabled", "true");
          resetTimer(notifFrequency);
        } else if (perm === "denied") {
          setShowNotifBanner(true);
          setTimeout(() => setShowNotifBanner(false), 7000);
        } else {
          // Native platform: requestNotificationPermission handles its own permission flow
          // If we reach here, assume granted (Capacitor resolves via its own listener)
          setNotifsEnabled(true);
          localStorage.setItem("notifs_enabled", "true");
          resetTimer(notifFrequency);
        }
      } else {
        // Permission already granted — enable immediately
        setNotifsEnabled(true);
        localStorage.setItem("notifs_enabled", "true");
        resetTimer(notifFrequency);
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

  const updateFrequency = async (freq) => {
    setNotifFrequency(freq);
    localStorage.setItem("notif_frequency", freq);
    resetTimer(freq);
    if (!user) return;
    try {
      const { db } = await import("../firebase/config");
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", user.uid), { notifFrequency: freq });
    } catch (err) {
      console.error("Failed to update frequency:", err);
    }
  };

  const handleLogout = async () => {
    stopTaskReminders();
    await logout();
    navigate("/login");
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const pendingCount = tasks.filter(
    (t) => t.date === todayStr && t.status === "pending"
  ).length;

  return (
    <div className="flex h-dvh bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-slate-100 overflow-hidden transition-colors duration-500 font-sans selection:bg-violet-500/30">

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
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.03em', fontStyle: 'italic', background: 'linear-gradient(to right, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block', paddingRight: '0.15em' }}>
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
                    Click the 🔒 lock icon in your browser&apos;s address bar, then set Notifications to &quot;Allow&quot;.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Timer Display */}
          {notifsEnabled && notifFrequency !== 'off' && !collapsed && (
            <CountdownDisplay />
          )}

          {/* Notification Toggle Container */}
          <div
            onClick={() => {
              toggleNotifs();
              if (!notifsEnabled && notifStatus !== "denied") setShowFreqSelector(true);
            }}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-2xl transition-all duration-200 group cursor-pointer
              ${notifStatus === "denied" || !notifsEnabled
                ? "text-red-500 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20"
                : notifFrequency === 'off'
                  ? "text-amber-500 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20"
                  : "text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20"}`}
          >
            <div className="relative flex-shrink-0">
              <Bell size={18} className={notifsEnabled && notifFrequency !== 'off' ? "fill-emerald-500/20" : notifsEnabled && notifFrequency === 'off' ? "fill-amber-500/20" : "fill-red-500/20"} />
              {notifsEnabled && notifFrequency !== 'off' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />}
              {notifsEnabled && notifFrequency === 'off' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />}
            </div>
            {!collapsed && (
              <>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs font-bold leading-tight">Notifications</span>
                  <span className={`text-[10px] font-medium uppercase tracking-tighter ${!notifsEnabled ? "text-red-500/80" : notifFrequency === 'off' ? "text-amber-500/80" : "text-emerald-500/70"
                    }`}>
                    {!notifsEnabled ? "Disabled" : notifFrequency === 'off' ? 'Paused' : notifFrequency}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {notifsEnabled && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowFreqSelector(!showFreqSelector); }}
                      className={`p-1.5 rounded-lg transition-colors ${notifFrequency === 'off' ? 'hover:bg-amber-500/20' : 'hover:bg-emerald-500/20'}`}
                    >
                      <Settings size={12} className={showFreqSelector ? "rotate-90 transition-transform" : ""} />
                    </button>
                  )}
                  <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${!notifsEnabled ? "bg-red-500" : notifFrequency === 'off' ? "bg-amber-500" : "bg-emerald-500"}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${notifsEnabled ? "left-[18px]" : "left-0.5"}`} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Frequency Selector */}
          {notifsEnabled && !collapsed && showFreqSelector && (
            <div className="p-3 rounded-2xl bg-white/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 animate-slide-down">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2.5">Check-in Frequency</p>

              <div className="space-y-1.5">
                {/* Row 1: 15m, 30m, 1h */}
                <div className="grid grid-cols-3 gap-1.5">
                  {["15m", "30m", "1h"].map((f) => (
                    <button
                      key={f}
                      onClick={() => updateFrequency(f)}
                      className={`px-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all
                        ${notifFrequency === f
                          ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                          : "text-slate-500 bg-slate-100/50 dark:bg-slate-700/30 hover:bg-slate-200 dark:hover:bg-slate-700/50"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Row 2: Turn Off / Turn On toggle */}
                <button
                  onClick={() => updateFrequency(notifFrequency === "off" ? "15m" : "off")}
                  className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all
                    ${notifFrequency === "off"
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "text-slate-500 bg-slate-100/50 dark:bg-slate-700/30 hover:bg-slate-200 dark:hover:bg-slate-700/50"}`}
                >
                  {notifFrequency === "off" ? "Turn On" : "Turn Off"}
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex gap-1.5">
                <input
                  type="number"
                  placeholder="MIN"
                  value={customFreq}
                  onChange={(e) => setCustomFreq(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-100/80 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-slate-800 dark:text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button
                  onClick={() => {
                    if (customFreq) {
                      updateFrequency(`${customFreq}m`);
                      setCustomFreq("");
                    }
                  }}
                  className="px-4 bg-violet-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-violet-500/25 active:scale-95 transition-all"
                >
                  Set
                </button>
              </div>
            </div>
          )}

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
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 mx-4 mb-4 rounded-2xl border border-slate-300/60 dark:border-slate-800/50 text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center justify-center transition-all bg-white/50 dark:bg-slate-800/20"
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <div className="flex items-center gap-2"><div className="flex items-center gap-2 font-bold uppercase tracking-widest whitespace-nowrap">Shrink</div></div>
          }
        </button>
      </aside>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden">

        {/* Top Floating Header */}
        <header className="sticky top-0 z-40 p-4 pb-0 md:p-4">
          <div className="flex items-center justify-between px-5 md:px-6 py-3 rounded-2xl md:rounded-2xl bg-white/80 dark:bg-slate-900/60 md:backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/40 shadow-sm md:shadow-lg shadow-slate-200/50 dark:shadow-black/20 transition-colors duration-500">
            <div className="flex items-center gap-3">
              {/* Mobile Logo */}
              <Link to="/app" className="md:hidden flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 p-[2px] shadow-lg shadow-violet-500/20">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Zap size={16} className="text-white fill-white" />
                  </div>
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.04em', fontStyle: 'italic', background: 'linear-gradient(to right, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', paddingRight: '0.15em' }}>TANZI</span>
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
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] md:text-xs font-black animate-slide-up">
                  <AlertCircle size={11} />
                  <span>{pendingCount} Left</span>
                </div>
              )}
              <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-800" />

              {/* Sleep Mode Toggle (Mobile Only) */}
              {Capacitor.isNativePlatform() && (
                <button
                  onClick={handleSleepClick}
                  className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90
                    ${isSleepMode
                      ? "bg-gradient-to-br from-indigo-600 to-violet-800 text-white shadow-lg shadow-indigo-500/40 border border-indigo-400/30"
                      : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-transparent"
                    }`}
                >
                  <Moon size={15} fill={isSleepMode ? "currentColor" : "none"} strokeWidth={2.5} />
                  {isSleepMode && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-slate-950 animate-pulse" />
                  )}
                </button>
              )}

              <button
                onClick={() => setProfilePopoverOpen(true)}
                className="flex items-center gap-2 py-1 pr-1 md:pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all border border-transparent"
              >
                <div className="w-8 h-8 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-violet-500/20">
                  {(user?.displayName || user?.email || "U")[0].toUpperCase()}
                </div>
                <span className="hidden lg:block text-xs font-black tracking-tight text-slate-700 dark:text-slate-300">My Account</span>
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
          <div className="mx-3 mb-3 p-2 rounded-3xl bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-black/60 flex items-center justify-around bottom-nav-safe transition-colors duration-500">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/app"}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all duration-200
                  ${isActive
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute inset-0 bg-violet-600 dark:bg-violet-600/40 rounded-2xl shadow-lg shadow-violet-500/20" />
                    )}
                    <div className="relative">
                      <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
                      {label === "Tasks" && pendingCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-lg">
                          {pendingCount > 9 ? "9+" : pendingCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[9px] font-black uppercase tracking-widest relative z-10 ${isActive ? "text-white dark:text-violet-200" : ""}`}>
                        {label}
                      </span>
                    </div>
                    {isActive && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400 dark:bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {/* Theme toggle in bottom nav */}
            <button
              onClick={toggle}
              className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-all"
            >
              {isDark ? <Sun size={21} strokeWidth={1.8} /> : <Moon size={21} strokeWidth={1.8} />}
              <span className="text-[9px] font-black uppercase tracking-widest">
                {isDark ? "Light" : "Dark"}
              </span>
            </button>
          </div>
        </nav>
      </main>

      {/* ─── Alarm Modal ────────────────────────────────────────── */}
      {isAlarmRinging && (
        <div className="md:hidden fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl shadow-violet-500/20 border border-slate-200 dark:border-slate-800 animate-slide-up transform scale-100 flex flex-col items-center">
            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-pulse">
              <Clock size={48} className="text-amber-500 animate-bounce" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Are You Free..!</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
              Your check-in timer has finished. Time to review your tasks!
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => handleDismissAlarm()}
                className="w-1/2 py-4 text-sm font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all uppercase tracking-widest"
              >
                Busy
              </button>
              <button
                onClick={() => {
                  handleDismissAlarm();
                  navigate("/app/tasks");
                }}
                className="w-1/2 py-4 text-sm font-black text-white bg-gradient-to-r from-violet-600 to-cyan-500 rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-95 transition-all uppercase tracking-widest"
              >
                Free
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Profile Popover Overlay (Mobile Bottom Sheet) ─────────────────────────────── */}
      {profilePopoverOpen && (
        <div className="fixed inset-0 z-[100] md:hidden animate-fade-in flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setProfilePopoverOpen(false)}
          />

          {/* Panel (Bottom Sheet) */}
          <div className="relative w-full bg-white dark:bg-slate-950 rounded-t-[2.5rem] border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] overflow-hidden animate-slide-up pb-safe transition-colors duration-500">
            {/* Grab handle */}
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-4 mb-2" onClick={() => setProfilePopoverOpen(false)} />

            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6 px-1">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">Account Settings</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Control your workspace</p>
                </div>
                <button
                  onClick={() => setProfilePopoverOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User card */}
              <div className="mb-6 p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/50 backdrop-blur-sm flex items-center gap-4 shadow-sm transition-colors duration-500">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-cyan-400 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-violet-500/20 flex-shrink-0">
                  {(user?.displayName || user?.email || "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black truncate text-slate-900 dark:text-white tracking-tight italic">{user?.displayName || "User"}</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                </div>
              </div>

              {/* Timer Display */}
              {notifsEnabled && notifFrequency !== 'off' && (
                <div className="mb-4 px-1">
                  <CountdownDisplay mobile={true} />
                </div>
              )}

              {/* Notification Row */}
              <div className="space-y-3">
                <div
                  onClick={() => {
                    toggleNotifs();
                    if (!notifsEnabled) setShowMobileFreqSelector(true);
                  }}
                  className={`flex items-center gap-4 w-full p-5 rounded-3xl font-black transition-all border cursor-pointer active:scale-[0.98]
                  ${!notifsEnabled
                      ? "text-red-500 bg-red-500/[0.03] border-red-500/20 shadow-sm"
                      : notifFrequency === 'off'
                        ? "text-amber-500 bg-amber-500/[0.03] border-amber-500/20"
                        : "text-emerald-500 bg-emerald-500/[0.03] border-emerald-500/20"}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors
                    ${!notifsEnabled ? "bg-red-500/10" : notifFrequency === 'off' ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                    <Bell size={22} className={notifsEnabled ? (notifFrequency === 'off' ? "text-amber-500 fill-amber-500/20" : "text-emerald-500 fill-emerald-500/20") : "text-red-500 fill-red-500/20"} />
                  </div>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-base font-black leading-tight uppercase tracking-widest">Notifications</span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] mt-0.5 opacity-80 ${!notifsEnabled ? "text-red-500" : notifFrequency === 'off' ? "text-amber-500" : "text-emerald-500"}`}>
                      {!notifsEnabled ? "OFFLINE" : notifFrequency === 'off' ? 'PAUSED' : `ACTIVE • ${notifFrequency}`}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMobileFreqSelector(!showMobileFreqSelector); }}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${notifFrequency === 'off' ? 'hover:bg-amber-500/20' : 'hover:bg-emerald-500/20 bg-slate-100 dark:bg-slate-900'}`}
                  >
                    <Settings size={16} className={showMobileFreqSelector ? "rotate-180 transition-transform duration-500" : "transition-transform duration-500"} />
                  </button>
                </div>

                {/* Freq Selector */}
                {notifsEnabled && showMobileFreqSelector && (
                  <div className="p-4 rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 animate-slide-up shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-3">Sync Interval</p>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {["15m", "30m", "1h"].map((f) => (
                        <button
                          key={f}
                          onClick={() => updateFrequency(f)}
                          className={`py-3 rounded-2xl text-[11px] font-black uppercase transition-all active:scale-95
                          ${notifFrequency === f ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30" : "text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    {/* Custom Input Integrated */}
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        placeholder="MIN"
                        value={customFreq}
                        onChange={(e) => setCustomFreq(e.target.value)}
                        className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-black text-slate-800 dark:text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                      />
                      <button
                        onClick={() => {
                          if (customFreq) {
                            updateFrequency(`${customFreq}m`);
                            setCustomFreq("");
                          }
                        }}
                        className="px-6 bg-violet-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg shadow-violet-500/25 active:scale-95 transition-all tracking-widest"
                      >
                        Set
                      </button>
                    </div>

                    <button
                      onClick={() => updateFrequency(notifFrequency === "off" ? "15m" : "off")}
                      className={`w-full py-3.5 rounded-2xl text-[11px] font-black uppercase transition-all active:scale-95 border
                      ${notifFrequency === "off" ? "bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20" : "text-slate-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}
                    >
                      {notifFrequency === "off" ? "Activate Protocol" : "Pause Protocol"}
                    </button>
                  </div>
                )}

                {/* Sign Out */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 w-full p-5 rounded-3xl font-black text-red-500 bg-red-500/[0.03] border border-red-500/10 hover:bg-red-500/10 active:scale-[0.98] transition-all shadow-sm group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <LogOut size={22} />
                  </div>
                  <span className="text-base tracking-tight italic">Sign Out</span>
                  <ChevronRight size={18} className="ml-auto opacity-30" />
                </button>
              </div>

              {/* Bottom spacer for safe area */}
              <div className="h-6" />
            </div>
          </div>
        </div>
      )}
      {/* ─── Sleep Settings Modal (Mobile only) ────────────────────── */}
      {showSleepSettings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Clock size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tighter italic">Sleep Routine</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notification Silence</p>
                </div>
              </div>
              <button
                onClick={() => setShowSleepSettings(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Starts At</label>
                <input
                  type="time"
                  value={sleepSchedule.start}
                  onChange={(e) => updateSleepSchedule(e.target.value, sleepSchedule.end)}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wakes Up At</label>
                <input
                  type="time"
                  value={sleepSchedule.end}
                  onChange={(e) => updateSleepSchedule(sleepSchedule.start, e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl mb-8">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-shrink-0">
                <Zap size={15} />
              </div>
              <p className="text-[10px] font-bold text-slate-500 leading-normal">
                Sleep mode automatically pauses all "Are You Free..?" reminders during your window.
              </p>
            </div>

            <button
              onClick={() => setShowSleepSettings(false)}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all"
            >
              Update Routine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
