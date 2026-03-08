// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";

// ── Map Firebase error codes → user-friendly messages ─────────────
function getFriendlyError(error) {
  const code = error?.code || "";
  const message = error?.message || "";
  const s = `${code} ${message}`.toLowerCase();

  // Handle specific Google/Auth error codes
  if (s.includes("12501") || s.includes("cancelled"))
    return "Sign-in was cancelled.";
  if (s.includes("invalid-credential") || s.includes("wrong-password") || s.includes("user-not-found"))
    return "Incorrect email or password.";
  if (s.includes("email-already-in-use"))
    return "An account with this email already exists.";
  if (s.includes("weak-password"))
    return "Password is too weak.";
  if (s.includes("invalid-email"))
    return "Please enter a valid email address.";
  if (s.includes("too-many-requests"))
    return "Too many attempts. Please try again later.";
  if (s.includes("network-request-failed"))
    return "Network error. Check your connection.";
  if (s.includes("popup-closed-by-user"))
    return "Sign-in popup was closed.";
  if (s.includes("unauthorized-domain"))
    return "This domain is not authorised.";

  // If it's a developer/config error, show it clearly
  if (s.includes("id token") || s.includes("configuration") || s.includes("client id"))
    return message;

  // Fallback but include a hint of what went wrong if possible
  const rawMsg = message.replace(/^Firebase:\s*/i, "").split("(")[0].trim();
  return rawMsg ? `Login failed: ${rawMsg}` : "Login failed. Please try again.";
}

export default function Login() {
  const { user, login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.email, form.password, form.name);
      } else {
        await login(form.email, form.password);
      }
      // No navigate("/app") here, useEffect handles it
    } catch (err) {
      const msg = getFriendlyError(err);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      // handled by useEffect
    } catch (err) {
      const msg = getFriendlyError(err);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F6F8F6] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-600/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#86A386]/[0.03] rounded-full blur-3xl" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-white border border-slate-200 rounded-3xl p-7 md:p-8 shadow-2xl shadow-slate-200/50">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/10 flex-shrink-0">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-primary-600 italic tracking-tighter">
                TANZI
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Smart productivity tracker</p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">
            {isRegister ? "Create account" : "Welcome back"}
          </h2>
          <p className="text-slate-400 text-sm mb-6 font-medium">
            {isRegister ? "Start tracking your productivity" : "Sign in to continue"}
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 animate-slide-down">
              <AlertCircle size={16} className="text-primary-600 flex-shrink-0 mt-0.5" />
              <p className="text-slate-800 text-sm leading-snug font-bold italic">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name (register only) */}
            {isRegister && (
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/5 transition-all"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/5 transition-all"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-11 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/5 transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-primary-600 text-white font-black text-sm tracking-wide hover:scale-[1.01] active:scale-[0.98] transition-all shadow-lg shadow-primary-600/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 mt-1"
            >
              {loading ? "Please wait…" : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-slate-400 text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Toggle register/login */}
          <p className="text-center text-slate-500 text-sm mt-5">
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => { setIsRegister((r) => !r); setError(""); }}
              className="text-primary-600 hover:text-primary-700 font-bold transition-colors"
            >
              {isRegister ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
