// src/layouts/Layout.jsx
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard, CheckSquare, BarChart3, LogOut,
  Sun, Moon, Menu, X, Zap, Bell
} from "lucide-react";
import { requestNotificationPermission } from "../services/notificationService";

const navItems = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/app/analytics", icon: BarChart3, label: "Analytics" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [notifGranted, setNotifGranted] = useState(Notification.permission === "granted");
  const navigate = useNavigate();

  const handleNotifSetup = async () => {
    const token = await requestNotificationPermission(user.uid);
    if (token) setNotifGranted(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-950 dark:bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        flex flex-col transition-all duration-300 border-r border-slate-800
        bg-gradient-to-b from-slate-900 to-slate-950
        ${collapsed ? "w-16" : "w-64"}
      `}>
        {/* Logo */}
        <div className="flex items-center px-4 py-5 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent truncate">
                TANZI
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto text-slate-500 hover:text-slate-300 transition-colors pl-2"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
                {(user?.displayName || user?.email || "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.displayName || "User"}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app"}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }
              `}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-3 border-t border-slate-800 space-y-1">
          {!notifGranted && (
            <button
              onClick={handleNotifSetup}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-amber-400 hover:bg-amber-400/10 transition-all text-sm"
            >
              <Bell size={18} className="flex-shrink-0" />
              {!collapsed && "Enable Notifications"}
            </button>
          )}
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all text-sm"
          >
            {isDark ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
            {!collapsed && (isDark ? "Light Mode" : "Dark Mode")}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-400 hover:bg-red-400/10 transition-all text-sm"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
}
