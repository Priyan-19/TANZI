// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTask } from "../context/TaskContext";
import { generateDailyReport } from "../services/analyticsService";
import { CheckCircle2, Clock, Target, TrendingUp, Plus, Calendar } from "lucide-react";
import { format } from "date-fns";
import TaskModal from "../components/TaskModal";
import PomodoroTimer from "../components/PomodoroTimer";

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="backdrop-blur-sm bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {sub && <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">{sub}</span>}
      </div>
      <p className="text-3xl font-bold text-slate-100 mb-1">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { getTodayTasks, getPendingTasks, loading } = useTask();
  const [todayReport, setTodayReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);

  const todayTasks = getTodayTasks();
  const pendingTasks = getPendingTasks();
  const completedToday = todayTasks.filter((t) => t.status === "completed").length;
  const completionRate = todayTasks.length > 0
    ? Math.round((completedToday / todayTasks.length) * 100)
    : 0;

  useEffect(() => {
    if (user && todayTasks.length > 0) {
      generateDailyReport(user.uid, new Date()).then(setTodayReport);
    }
  }, [user, todayTasks.length]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm mb-1">{format(new Date(), "EEEE, MMMM d")}</p>
          <h1 className="text-3xl font-bold text-slate-100">
            {greeting()}, {(user?.displayName || "there").split(" ")[0]} 👋
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPomodoro((s) => !s)}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Clock size={16} />
            Pomodoro
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {/* Pomodoro */}
      {showPomodoro && <PomodoroTimer className="mb-6" />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Today"
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

      {/* Progress bar */}
      {todayTasks.length > 0 && (
        <div className="backdrop-blur-sm bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-300">Today's Progress</p>
            <p className="text-sm text-slate-400">{completedToday}/{todayTasks.length} tasks</p>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {completionRate === 100
              ? "🎉 All tasks completed!"
              : `${pendingTasks.length} task${pendingTasks.length !== 1 ? "s" : ""} remaining`}
          </p>
        </div>
      )}

      {/* Today's Tasks */}
      <div className="backdrop-blur-sm bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-200">Today's Tasks</h2>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">
            {format(new Date(), "MMM d")}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : todayTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Target size={20} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm">No tasks for today</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-violet-400 text-sm hover:text-violet-300"
            >
              Add your first task →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <DashboardTaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {showModal && <TaskModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function DashboardTaskRow({ task }) {
  const { completeTask, uncompleteTask } = useTask();
  const isCompleted = task.status === "completed";

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
      isCompleted ? "opacity-50" : "hover:bg-slate-800/50"
    }`}>
      <button
        onClick={() => isCompleted ? uncompleteTask(task.id) : completeTask(task.id)}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
          isCompleted
            ? "bg-emerald-500 border-emerald-500"
            : "border-slate-600 hover:border-violet-500"
        }`}
      >
        {isCompleted && <CheckCircle2 size={12} className="text-white m-auto" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCompleted ? "line-through text-slate-500" : "text-slate-200"}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-500 truncate">{task.description}</p>
        )}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-lg ${
        isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
      }`}>
        {isCompleted ? "Done" : "Pending"}
      </span>
    </div>
  );
}
