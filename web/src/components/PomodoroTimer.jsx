// src/components/PomodoroTimer.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, SkipForward, Volume2, VolumeX } from "lucide-react";
import { notifyPomodoroComplete } from "../services/notificationService";

const MODES = {
  focus: { label: "Focus", duration: 25 * 60, color: "from-violet-500 to-violet-600", bg: "bg-violet-500/10", text: "text-violet-400" },
  short: { label: "Short Break", duration: 5 * 60, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  long: { label: "Long Break", duration: 15 * 60, color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-500/10", text: "text-cyan-400" },
};

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
  modeRef.current = mode;

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

  // Update document title while running
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
  const progress = 1 - timeLeft / MODES[mode].duration;
  const circumference = 2 * Math.PI * 54;
  const currentMode = MODES[mode];

  return (
    <div className={`bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-5 transition-colors duration-300 ${className}`}>
      <div className="flex items-center gap-6">
        {/* Circular Progress */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="7" className="text-slate-100 dark:text-slate-800" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="url(#pomGrad)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="pomGrad" x1="0%" y1="0%" x2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-200 font-mono tracking-tight">{minutes}:{seconds}</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-600 uppercase tracking-wider mt-0.5">
              {running ? "Running" : "Paused"}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Mode Tabs */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {Object.entries(MODES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${mode === key
                  ? `${val.bg} ${val.text} border border-current/20`
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                  }`}
              >
                {val.label}
              </button>
            ))}
          </div>

          <p className={`text-sm font-semibold mb-3 ${currentMode.text}`}>{currentMode.label}</p>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeLeft(t => Math.max(60, t - 60))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
                title="Decrease 1 min"
              >
                <div className="w-3.5 h-3.5 flex items-center justify-center text-lg">-</div>
              </button>

              <button
                onClick={() => setRunning((r) => !r)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                {running ? <Pause size={13} /> : <Play size={13} />}
                {running ? "Pause" : "Start"}
              </button>

              <button
                onClick={() => setTimeLeft(t => t + 60)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
                title="Increase 1 min"
              >
                <div className="w-3.5 h-3.5 flex items-center justify-center text-lg">+</div>
              </button>

              <button
                onClick={reset}
                title="Reset"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            <button
              onClick={skip}
              title="Skip"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <SkipForward size={13} />
            </button>

            <button
              onClick={() => setSoundEnabled((s) => !s)}
              title={soundEnabled ? "Mute" : "Unmute"}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>

            <div className="flex items-center gap-1.5 ml-1 text-xs text-slate-500">
              <Coffee size={12} />
              <span>{sessions} session{sessions !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
