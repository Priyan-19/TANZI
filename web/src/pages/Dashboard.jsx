// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTask } from "../context/TaskContext";
import { generateDailyReport } from "../services/analyticsService";
import {
  CheckCircle2, Clock, Target, TrendingUp, Plus, Calendar,
  Zap, ChevronRight, MoreHorizontal, Flame,
} from "lucide-react";
import { format } from "date-fns";
import TaskModal from "../components/TaskModal";
import PomodoroTimer from "../components/PomodoroTimer";
import { Link } from "react-router-dom";

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, trend }) {
  return (
    <div className="relative overflow-hidden backdrop-blur-md bg-white/70 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/40 rounded-[1.5rem] p-4 md:p-6 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-xl hover:shadow-violet-500/10 group cursor-default">
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

      <div className="flex items-start justify-between relative z-10 mb-3 md:mb-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-current/20 transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={18} className="text-white md:hidden" />
          <Icon size={22} className="text-white hidden md:block" />
        </div>
        {sub && (
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
            {sub}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-2xl md:text-4xl font-black text-slate-900 dark:text-slate-100 italic tracking-tighter mb-0.5 md:mb-1">{value}</p>
        <p className="text-[9px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
        {trend !== undefined && (
          <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold ${trend >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
            {trend >= 0 ? <TrendingUp size={9} /> : <TrendingUp size={9} className="rotate-180" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Task Row ───────────────────────────────────────────────────────────────
function DashboardTaskRow({ task }) {
  const { completeTask, uncompleteTask } = useTask();
  const isCompleted = task.status === "completed";

  return (
    <div
      className={`group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-[1rem] md:rounded-[1.25rem] transition-all duration-200 border border-transparent
        ${isCompleted
          ? "opacity-40 grayscale"
          : "hover:bg-violet-500/5 active:bg-violet-500/10 hover:border-violet-500/10 hover:translate-x-0.5"
        }`}
    >
      <button
        onClick={() => isCompleted ? uncompleteTask(task.id) : completeTask(task.id)}
        className={`w-6 h-6 rounded-xl border-2 flex-shrink-0 transition-all flex items-center justify-center tap-target
          ${isCompleted
            ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30 scale-110"
            : "border-slate-200 dark:border-slate-700 hover:border-violet-500 active:scale-90"
          }`}
      >
        {isCompleted && <CheckCircle2 size={12} className="text-white fill-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate transition-colors ${isCompleted ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400"}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 truncate">
            {task.description}
          </p>
        )}
      </div>

      <div className={`flex-shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all
        ${isCompleted ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
        {isCompleted ? "Done" : "Pending"}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const { getTodayTasks, getPendingTasks, loading } = useTask();
  const [todayReport, setTodayReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);

  const todayTasks = getTodayTasks();
  const pendingTasks = getPendingTasks();
  const completedToday = todayTasks.filter((t) => t.status === "completed").length;
  const completionRate =
    todayTasks.length > 0
      ? Math.round((completedToday / todayTasks.length) * 100)
      : 0;

  useEffect(() => {
    if (user && todayTasks.length > 0) {
      generateDailyReport(user.uid, new Date()).then(setTodayReport).catch(() => { });
    }
  }, [user, todayTasks.length]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = (user?.displayName || "there").split(" ")[0];

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">

      {/* ─── Hero Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              MISSION BRIEFING
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{format(new Date(), "MMMM do")}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic leading-none mb-2">
            {greeting()},{" "}
            <span className="bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">{firstName}</span>.
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold leading-relaxed max-w-lg">
            {todayTasks.length === 0
              ? "Your schedule is clear. Ready to initiate a new session?"
              : completionRate === 100
                ? "🎉 All objectives completed. Excellent work today!"
                : `${pendingTasks.length} pending objective${pendingTasks.length !== 1 ? "s" : ""} remaining.`}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            id="toggle-pomodoro-btn"
            onClick={() => setShowPomodoro((s) => !s)}
            className={`flex-1 sm:flex-none px-4 md:px-5 py-2.5 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95
              ${showPomodoro
                ? "border-violet-600 bg-violet-600 text-white shadow-violet-500/30 scale-[1.02]"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 shadow-slate-200/50 dark:shadow-black/20"
              }`}
          >
            <Clock size={15} strokeWidth={2.5} />
            <span>Focus</span>
          </button>
          <button
            id="add-task-btn"
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10"
          >
            <Plus size={16} strokeWidth={3} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* ─── Pomodoro Timer ─── */}
      {showPomodoro && (
        <div className="animate-slide-down">
          <PomodoroTimer />
        </div>
      )}

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Today's Tasks" value={todayTasks.length} icon={Calendar} color="bg-violet-500" />
        <StatCard label="Completed" value={completedToday} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard label="Pending" value={pendingTasks.length} icon={Clock} color="bg-amber-500" />
        <StatCard label="Completion" value={`${completionRate}%`} icon={Target} color="bg-cyan-500" sub="today" />
      </div>

      {/* ─── Progress Bar ─── */}
      {todayTasks.length > 0 && (
        <div className="relative overflow-hidden backdrop-blur-xl bg-white/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/5 blur-[80px] pointer-events-none" />

          <div className="flex items-start md:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-600 flex-shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-sm md:text-base font-black tracking-tight italic">Operational Progress</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">Live Synchronization</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-2xl md:text-3xl font-black text-violet-600 tracking-tighter">{completionRate}%</span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                {completedToday}/{todayTasks.length} Done
              </p>
            </div>
          </div>

          <div className="relative h-3 md:h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(139,92,246,0.4)]"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          <div className="flex justify-between mt-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Start</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {completionRate >= 100 ? "✓ MISSION SUCCESS" : "IN PROGRESS"}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Tanzi v1.0</span>
          </div>
        </div>
      )}

      {/* ─── Objective Board ─── */}
      <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 shadow-xl shadow-slate-200/40 dark:shadow-black/20">
        <div className="flex items-center justify-between mb-5 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white">
              <CheckCircle2 size={14} />
            </div>
            <h2 className="text-base md:text-lg font-black tracking-tighter italic">Objective Board</h2>
            {todayTasks.length > 0 && (
              <span className="text-[10px] font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2.5 py-1 rounded-full uppercase">
                {todayTasks.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:block">{format(new Date(), "MMM d")}</span>
            <Link
              to="/app/tasks"
              className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition-colors font-semibold"
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : todayTasks.length === 0 ? (
          <div className="text-center py-10 md:py-14">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700/50">
              <Zap size={20} className="text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm font-semibold mb-1">No tasks for today</p>
            <p className="text-slate-400 dark:text-slate-600 text-xs mb-5">Start by adding your first task</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-violet-500/25"
            >
              <Plus size={14} />
              Add First Task
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {todayTasks.slice(0, 8).map((task) => (
              <DashboardTaskRow key={task.id} task={task} />
            ))}
            {todayTasks.length > 8 && (
              <Link
                to="/app/tasks"
                className="flex items-center justify-center gap-1.5 mt-3 py-3 text-xs text-slate-500 hover:text-violet-400 transition-colors font-semibold"
              >
                <MoreHorizontal size={14} />
                {todayTasks.length - 8} more tasks — view all
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Spacer for mobile nav */}
      <div className="h-2 md:h-0" />

      {showModal && <TaskModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
