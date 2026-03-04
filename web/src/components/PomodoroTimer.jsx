// src/components/PomodoroTimer.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, SkipForward, Volume2, VolumeX } from "lucide-react";
import { notifyPomodoroComplete } from "../services/notificationService";

const MODES = {
  focus: { label: "Focus", duration: 30 * 60, accent: "#8b5cf6", accentEnd: "#06b6d4", bg: "from-violet-500/10 to-cyan-500/5", badge: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
  short: { label: "Short Break", duration: 5 * 60, accent: "#10b981", accentEnd: "#06b6d4", bg: "from-emerald-500/10 to-cyan-500/5", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  long: { label: "Long Break", duration: 15 * 60, accent: "#06b6d4", accentEnd: "#8b5cf6", bg: "from-cyan-500/10 to-violet-500/5", badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25" },
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (_) { }
}

export default function PomodoroTimer({ className = "" }) {
  const [mode, setMode] = useState("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const handleComplete = useCallback(() => {
    const isFocus = modeRef.current === "focus";
    if (isFocus) setSessions((s) => s + 1);
    if (soundEnabled) playBeep();
    notifyPomodoroComplete(!isFocus);
  }, [soundEnabled]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, handleComplete]);

  useEffect(() => {
    if (running) {
      const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
      const secs = String(timeLeft % 60).padStart(2, "0");
      document.title = `${mins}:${secs} — ${MODES[mode].label} | TANZI`;
    } else {
      document.title = "TANZI";
    }
    return () => { document.title = "TANZI"; };
  }, [running, timeLeft, mode]);

  const switchMode = (m) => {
    setMode(m);
    setTimeLeft(MODES[m].duration);
    setRunning(false);
    clearInterval(intervalRef.current);
  };

  const reset = () => {
    setTimeLeft(MODES[mode].duration);
    setRunning(false);
  };

  const skip = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    handleComplete();
    setTimeLeft(MODES[mode].duration);
  };

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const currentMode = MODES[mode];
  const totalDuration = MODES[mode].duration;
  const progress = timeLeft / totalDuration;
  const strokeDashoffset = CIRCUMFERENCE * progress; // full circle = not elapsed, 0 = elapsed

  const gradId = `pomodoro-grad-${mode}`;

  return (
    <div className={`relative overflow-hidden md:backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-slate-300/80 dark:border-slate-800/40 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 shadow-xl shadow-slate-300/20 dark:shadow-black/20 transition-all duration-300 ${className}`}>
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-violet-600/5 blur-[80px] pointer-events-none" />

      {/* Mode Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-slate-100/50 dark:bg-slate-800/20 rounded-xl w-full">
        {Object.entries(MODES).map(([key]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex-1 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all
              ${mode === key
                ? "bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-300"
              }`}
          >
            {key === "focus" ? "Focus" : key === "short" ? "Short" : "Long"}
          </button>
        ))}
      </div>

      {/* Layout: Circle + Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-5 md:gap-7">

        {/* ── Circular Timer ── */}
        <div className="relative flex-shrink-0 w-36 h-36 md:w-44 md:h-44">
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 120 120"
            aria-label={`Timer: ${minutes}:${seconds}`}
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={currentMode.accent} />
                <stop offset="100%" stopColor={currentMode.accentEnd} />
              </linearGradient>
            </defs>

            {/* Track */}
            <circle
              cx="60" cy="60" r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              className="text-slate-200 dark:text-slate-800"
            />

            {/* Progress arc */}
            <circle
              cx="60" cy="60" r={RADIUS}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: running ? "stroke-dashoffset 1s linear" : "stroke-dashoffset 0.4s ease-out" }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              style={{
                fontFamily: "Inter, monospace",
                fontWeight: 900,
                fontSize: "clamp(1.4rem, 4vw, 1.75rem)",
                letterSpacing: "-0.04em",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
              className="text-slate-900 dark:text-slate-100"
            >
              {minutes}:{seconds}
            </span>
            <div className="flex items-center gap-1 mt-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${running ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                {running ? "Active" : "Idle"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="flex-1 w-full min-w-0">

          {/* Mode label */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${currentMode.badge}`}>
              {currentMode.label}
            </span>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Focus Protocol</p>
          </div>

          {/* Play / Pause + adjust */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 dark:bg-slate-800/20 rounded-[1.25rem] border border-slate-300/60 dark:border-slate-700/50">
              <button
                onClick={() => setTimeLeft((t) => Math.max(60, t - 60))}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm hover:scale-105 active:scale-95 transition-transform font-black text-base"
                title="−1 min"
              >−</button>

              <button
                onClick={() => setRunning((r) => !r)}
                className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-5 h-9 md:h-10 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all shadow-lg active:scale-95
                  ${running
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-slate-900/20"
                    : "bg-violet-600 text-white shadow-violet-500/30"
                  }`}
              >
                {running ? <Pause size={13} strokeWidth={3} /> : <Play size={13} strokeWidth={3} />}
                {running ? "Pause" : "Start"}
              </button>

              <button
                onClick={() => setTimeLeft((t) => t + 60)}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm hover:scale-105 active:scale-95 transition-transform font-black text-base"
                title="+1 min"
              >+</button>
            </div>

            {/* Utility buttons */}
            <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/20 p-1.5 rounded-xl border border-slate-300/60 dark:border-slate-700/50">
              <button onClick={reset} title="Reset" className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center justify-center">
                <RotateCcw size={13} />
              </button>
              <button onClick={skip} title="Skip" className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center justify-center">
                <SkipForward size={13} />
              </button>
              <button
                onClick={() => setSoundEnabled((s) => !s)}
                title={soundEnabled ? "Mute" : "Unmute"}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center justify-center"
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
            </div>

            {/* Sessions badge */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl ml-auto">
              <Coffee size={12} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{sessions} Cycles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
