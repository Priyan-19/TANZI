// src/pages/Tasks.jsx
import { useState } from "react";
import { useTask } from "../context/TaskContext";
import { Plus, Search, Filter, CheckCircle2, Trash2, Edit3, Clock } from "lucide-react";
import TaskModal from "../components/TaskModal";
import { format } from "date-fns";

const FILTERS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

export default function Tasks() {
  const { getFilteredTasks, filter, setFilter, loading, completeTask, uncompleteTask, deleteTask } = useTask();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | completed

  const tasks = getFilteredTasks().filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pending = tasks.filter((t) => t.status === "pending");
  const completed = tasks.filter((t) => t.status === "completed");

  const handleEdit = (task) => {
    setEditTask(task);
    setShowModal(true);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm("Delete this task?")) {
      await deleteTask(taskId);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{tasks.length} task{tasks.length !== 1 ? "s" : ""} found</p>
        </div>
        <button
          onClick={() => { setEditTask(null); setShowModal(true); }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Time filter tabs */}
      <div className="flex gap-1 p-1 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl mb-4 w-fit shadow-sm">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === key
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + status filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors shadow-sm"
          />
        </div>
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          {["all", "pending", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${statusFilter === s
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl shadow-sm transition-colors">
          <Clock size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
          <p className="text-slate-600 dark:text-slate-400">No tasks found</p>
          <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">Try a different filter or add a new task</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Pending */}
          {(statusFilter === "all" || statusFilter === "pending") && pending.length > 0 && (
            <>
              {statusFilter === "all" && (
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider px-1 mb-2 mt-4">
                  Pending ({pending.length})
                </p>
              )}
              {pending.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={completeTask}
                  onUncomplete={uncompleteTask}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}

          {/* Completed */}
          {(statusFilter === "all" || statusFilter === "completed") && completed.length > 0 && (
            <>
              {statusFilter === "all" && (
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider px-1 mb-2 mt-4">
                  Completed ({completed.length})
                </p>
              )}
              {completed.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={completeTask}
                  onUncomplete={uncompleteTask}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onComplete, onUncomplete, onEdit, onDelete }) {
  const isCompleted = task.status === "completed";

  return (
    <div className={`group flex items-start gap-4 p-4 bg-white dark:bg-slate-900/60 border rounded-2xl transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm ${isCompleted ? "border-slate-100 dark:border-slate-800/30 opacity-70" : "border-slate-200 dark:border-slate-800"
      }`}>
      <button
        onClick={() => isCompleted ? onUncomplete(task.id) : onComplete(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${isCompleted
            ? "bg-emerald-500 border-emerald-500"
            : "border-slate-300 dark:border-slate-600 hover:border-violet-500"
          }`}
      >
        {isCompleted && <CheckCircle2 size={12} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${isCompleted ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-500 mt-0.5 truncate leading-relaxed">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-tight">{format(new Date(task.date), "MMM d")}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${isCompleted ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}>
            {task.status}
          </span>
          {task.completedAt && (
            <span className="text-[10px] text-slate-400 dark:text-slate-600">
              Done {format(task.completedAt, "HH:mm")}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
