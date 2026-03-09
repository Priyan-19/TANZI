// src/components/PomodoroTimer.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, SkipForward, Volume2, VolumeX } from "lucide-react";
import { notifyPomodoroComplete } from "../services/notificationService";

const MODES = {
  focus: { label: "Focus", duration: 30 * 60, primary: "#18181b", primaryEnd: "#18181b", bg: "bg-slate-100/50", badge: "bg-primary-600/10 text-primary-600 border-primary-600/20" },
  short: { label: "Short Break", duration: 5 * 60, primary: "#18181b", primaryEnd: "#18181b", bg: "bg-primary-600/5", badge: "bg-primary-600 text-white border-primary-600/20" },
  long: { label: "Long Break", duration: 15 * 60, primary: "#18181b", primaryEnd: "#18181b", bg: "bg-slate-100/50", badge: "bg-primary-600/10 text-primary-600 border-primary-600/20" },
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
    <div className={`relative overflow-hidden bg-white border border-slate-200 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 shadow-xl shadow-slate-200/20 transition-all duration-300 ${className}`}>
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary-600/5 blur-[80px] pointer-events-none" />

      {/* Mode Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-slate-50 rounded-xl w-full">
        {Object.entries(MODES).map(([key]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex-1 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all
              ${mode === key
                ? "bg-white text-primary-600 shadow-sm"
                : "text-slate-400 hover:text-primary-600"
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
                <stop offset="0%" stopColor={currentMode.primary} />
                <stop offset="100%" stopColor={currentMode.primaryEnd} />
              </linearGradient>
            </defs>

            {/* Track */}
            <circle
              cx="60" cy="60" r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              className="text-slate-100"
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
              className="text-primary-600"
            >
              {minutes}:{seconds}
            </span>
            <div className="flex items-center gap-1 mt-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${running ? "bg-primary-600 animate-pulse" : "bg-slate-200"}`} />
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
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Focus Protocol</p>
          </div>

          {/* Play / Pause + adjust */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-[1.25rem] border border-slate-200">
              <button
                onClick={() => setTimeLeft((t) => Math.max(60, t - 60))}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm hover:scale-105 active:scale-95 transition-transform font-bold text-base border border-slate-100"
                title="−1 min"
              >−</button>

              <button
                onClick={() => setRunning((r) => !r)}
                className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-5 h-9 md:h-10 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all shadow-lg active:scale-95
                  ${running
                    ? "bg-primary-600 text-white shadow-primary-600/10"
                    : "bg-primary-600 text-white shadow-primary-600/10"
                  }`}
              >
                {running ? <Pause size={13} strokeWidth={3} /> : <Play size={13} strokeWidth={3} />}
                {running ? "Pause" : "Start"}
              </button>

              <button
                onClick={() => setTimeLeft((t) => t + 60)}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm hover:scale-105 active:scale-95 transition-transform font-bold text-base border border-slate-100"
                title="+1 min"
              >+</button>
            </div>

            {/* Utility buttons */}
            <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <button onClick={reset} title="Reset" className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-white transition-all flex items-center justify-center border border-transparent hover:border-slate-100">
                <RotateCcw size={13} />
              </button>
              <button onClick={skip} title="Skip" className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-white transition-all flex items-center justify-center border border-transparent hover:border-slate-100">
                <SkipForward size={13} />
              </button>
              <button
                onClick={() => setSoundEnabled((s) => !s)}
                title={soundEnabled ? "Mute" : "Unmute"}
                className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-white transition-all flex items-center justify-center border border-transparent hover:border-slate-100"
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
            </div>

            {/* Sessions badge */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-primary-600/10 border border-primary-600/20 rounded-xl ml-auto">
              <Coffee size={12} className="text-primary-600" />
              <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{sessions} Cycles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
