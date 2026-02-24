// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";

// ── Map Firebase error codes → user-friendly messages ─────────────
function getFriendlyError(codeOrMessage = "") {
  const s = (codeOrMessage || "").toLowerCase();

  if (s.includes("invalid-credential") || s.includes("wrong-password") || s.includes("user-not-found"))
    return "Incorrect email or password. Please try again.";
  if (s.includes("email-already-in-use"))
    return "An account with this email already exists. Try signing in instead.";
  if (s.includes("weak-password"))
    return "Password is too weak — use at least 6 characters.";
  if (s.includes("invalid-email"))
    return "Please enter a valid email address.";
  if (s.includes("too-many-requests"))
    return "Too many failed attempts. Please wait a moment and try again.";
  if (s.includes("network-request-failed"))
    return "Network error. Check your internet connection and try again.";
  if (s.includes("popup-closed-by-user"))
    return "Sign-in popup was closed. Please try again.";
  if (s.includes("cancelled-popup-request"))
    return ""; // silently ignore duplicate popup
  if (s.includes("unauthorized-domain"))
    return "This domain is not authorised for sign-in. Contact support.";
  if (s.includes("operation-not-allowed"))
    return "This sign-in method is not enabled. Contact support.";

  // Fallback: strip "Firebase: " prefix + "(auth/...)" code suffix
  const cleaned = codeOrMessage
    .replace(/^Firebase:\s*/i, "")
    .replace(/\s*\(auth\/[^)]+\)\.?\s*$/i, "")
    .trim();

  return cleaned || "Something went wrong. Please try again.";
}

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
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
      navigate("/app");
    } catch (err) {
      const msg = getFriendlyError(err.code || err.message);
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
      navigate("/app");
    } catch (err) {
      const msg = getFriendlyError(err.code || err.message);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh bg-slate-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background ambient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(148,163,184,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(148,163,184,0.03) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-[420px] relative z-10">
        <div className="backdrop-blur-xl bg-slate-900/80 border border-slate-700/50 rounded-3xl p-7 md:p-8 shadow-2xl shadow-black/60">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent italic tracking-tighter">
                TANZI
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Smart productivity tracker</p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-100 mb-1 tracking-tight">
            {isRegister ? "Create account" : "Welcome back"}
          </h2>
          <p className="text-slate-400 text-sm mb-6 font-medium">
            {isRegister ? "Start tracking your productivity" : "Sign in to continue"}
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 animate-slide-down">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm leading-snug">{error}</p>
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
                  className="w-full bg-slate-800/60 border border-slate-700/70 rounded-2xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"
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
                className="w-full bg-slate-800/60 border border-slate-700/70 rounded-2xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"
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
                className="w-full bg-slate-800/60 border border-slate-700/70 rounded-2xl py-3 pl-10 pr-11 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 transition-all"
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
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-black text-sm tracking-wide hover:scale-[1.01] active:scale-[0.98] transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 mt-1"
            >
              {loading ? "Please wait…" : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-600 text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 rounded-2xl border border-slate-700/70 text-slate-300 text-sm font-semibold hover:bg-slate-800/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
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
              className="text-violet-400 hover:text-violet-300 font-bold transition-colors"
            >
              {isRegister ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
