// src/components/PomodoroTimer.jsx
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

const MODES = {
  focus: { label: "Focus", duration: 25 * 60, color: "from-violet-500 to-violet-600" },
  short: { label: "Short Break", duration: 5 * 60, color: "from-emerald-500 to-emerald-600" },
  long: { label: "Long Break", duration: 15 * 60, color: "from-cyan-500 to-cyan-600" },
};

export default function PomodoroTimer({ className = "" }) {
  const [mode, setMode] = useState("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === "focus") setSessions((s) => s + 1);
            // Play notification sound
            new Audio("/notification.mp3").play().catch(() => {});
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const switchMode = (m) => {
    setMode(m);
    setTimeLeft(MODES[m].duration);
    setRunning(false);
  };

  const reset = () => {
    setTimeLeft(MODES[mode].duration);
    setRunning(false);
  };

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const progress = 1 - timeLeft / MODES[mode].duration;

  const circumference = 2 * Math.PI * 54;

  return (
    <div className={`bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 ${className}`}>
      <div className="flex items-center gap-6">
        {/* Circular progress */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="url(#grad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-slate-200 font-mono">{minutes}:{seconds}</span>
          </div>
        </div>

        <div className="flex-1">
          {/* Mode tabs */}
          <div className="flex gap-1 mb-3">
            {Object.entries(MODES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  mode === key
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {val.label}
              </button>
            ))}
          </div>

          <p className="text-sm font-medium text-slate-300 mb-3">{MODES[mode].label}</p>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {running ? <Pause size={14} /> : <Play size={14} />}
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={reset}
              className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            >
              <RotateCcw size={14} />
            </button>
            <div className="flex items-center gap-1.5 ml-2 text-xs text-slate-500">
              <Coffee size={12} />
              <span>{sessions} session{sessions !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
