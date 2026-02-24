// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTask } from "../context/TaskContext";
import { generateDailyReport } from "../services/analyticsService";
import {
  CheckCircle2, Clock, Target, TrendingUp, Plus, Calendar,
  Flame, Zap, ChevronRight, MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import TaskModal from "../components/TaskModal";
import PomodoroTimer from "../components/PomodoroTimer";
import { Link } from "react-router-dom";

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, trend }) {
  return (
    <div className="backdrop-blur-sm bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-5 hover:border-slate-400 dark:hover:border-slate-700/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shadow-sm`}>
          <Icon size={18} className="text-white" />
        </div>
        {sub && (
          <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
            {sub}
          </span>
        )}
      </div>
      <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {trend !== undefined && (
        <p className={`text-xs mt-1.5 ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs yesterday
        </p>
      )}
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────
function DashboardTaskRow({ task }) {
  const { completeTask, uncompleteTask } = useTask();
  const isCompleted = task.status === "completed";

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCompleted ? "opacity-50" : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
        }`}
    >
      <button
        onClick={() =>
          isCompleted ? uncompleteTask(task.id) : completeTask(task.id)
        }
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${isCompleted
          ? "bg-emerald-500 border-emerald-500"
          : "border-slate-300 dark:border-slate-600 hover:border-violet-500"
          }`}
      >
        {isCompleted && <CheckCircle2 size={11} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${isCompleted ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"
            }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {task.description}
          </p>
        )}
      </div>

      <span
        className={`text-xs px-2 py-0.5 rounded-lg flex-shrink-0 ${isCompleted
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-amber-500/20 text-amber-400"
          }`}
      >
        {isCompleted ? "Done" : "Pending"}
      </span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-slate-500 text-sm mb-1">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {todayTasks.length === 0
              ? "You have no tasks scheduled for today."
              : completionRate === 100
                ? "🎉 All tasks complete! Incredible work."
                : `You have ${pendingTasks.length} task${pendingTasks.length !== 1 ? "s" : ""} left today.`}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            id="toggle-pomodoro-btn"
            onClick={() => setShowPomodoro((s) => !s)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${showPomodoro
              ? "border-violet-500/50 text-violet-600 dark:text-violet-300 bg-violet-500/10"
              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
          >
            <Clock size={15} />
            <span className="hidden sm:inline">Pomodoro</span>
          </button>
          <button
            id="add-task-btn"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>

      {/* ─── Pomodoro ─── */}
      {showPomodoro && <PomodoroTimer className="mb-6" />}

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Today's Tasks"
          value={todayTasks.length}
          icon={Calendar}
          color="bg-violet-500"
        />
        <StatCard
          label="Completed"
          value={completedToday}
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
        <StatCard
          label="Pending"
          value={pendingTasks.length}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={Target}
          color="bg-cyan-500"
          sub="today"
        />
      </div>

      {/* ─── Progress Bar ─── */}
      {todayTasks.length > 0 && (
        <div className="backdrop-blur-sm bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-violet-500 dark:text-violet-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Today's Progress</p>
            </div>
            <p className="text-sm text-slate-400">
              {completedToday}/{todayTasks.length} tasks
            </p>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2.5">
            {completionRate === 100
              ? "🎉 All tasks completed! You crushed it today."
              : completionRate >= 50
                ? `🔥 Over halfway there! Keep the momentum going.`
                : `💪 ${pendingTasks.length} task${pendingTasks.length !== 1 ? "s" : ""} remaining — you've got this!`}
          </p>
        </div>
      )}

      {/* ─── Today's Tasks ─── */}
      <div className="backdrop-blur-sm bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-violet-500 dark:text-violet-400" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Today's Tasks</h2>
            {todayTasks.length > 0 && (
              <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
                {todayTasks.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {format(new Date(), "MMM d")}
            </span>
            <Link
              to="/app/tasks"
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition-colors"
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-slate-800/50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : todayTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700/50">
              <Zap size={22} className="text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm font-medium">
              No tasks for today
            </p>
            <p className="text-slate-600 text-xs mt-1 mb-4">
              Start by adding your first task for the day
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
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
                className="flex items-center justify-center gap-1.5 mt-2 py-2 text-xs text-slate-500 hover:text-violet-400 transition-colors"
              >
                <MoreHorizontal size={14} />
                {todayTasks.length - 8} more tasks — view all
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showModal && <TaskModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
