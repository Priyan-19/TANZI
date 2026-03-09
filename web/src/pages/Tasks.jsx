// src/pages/Tasks.jsx
import React, { useState, useMemo } from "react";
import { useTask } from "../context/TaskContext";
import { Plus, Search, CheckCircle2, Trash2, Edit3, Clock, X } from "lucide-react";
import TaskModal from "../components/TaskModal";
import { format } from "date-fns";

const FILTERS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "Month" },
];

const TaskCard = React.memo(({ task, onComplete, onUncomplete, onEdit, onDelete }) => {
  const isCompleted = task.status === "completed";

  // Pre-formatted date for performance
  const displayDate = React.useMemo(() => {
    try {
      return format(new Date(task.date.replace(/-/g, '/')), "MMM d");
    } catch (e) {
      return task.date;
    }
  }, [task.date]);

  const completionTime = React.useMemo(() => {
    if (!task.completedAt) return null;
    try {
      return format(task.completedAt, "HH:mm");
    } catch (e) {
      return "";
    }
  }, [task.completedAt]);

  return (
    <div
      className={`group flex items-start gap-3 md:gap-4 p-4 md:p-5 bg-white border rounded-[1.25rem] md:rounded-[1.5rem] transition-all duration-200 shadow-md shadow-slate-200/50
        ${isCompleted
          ? "border-slate-200 opacity-50 grayscale"
          : "border-slate-300 hover:border-primary-600/30 hover:translate-x-0.5 active:scale-[0.99]"
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => isCompleted ? onUncomplete(task.id) : onComplete(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center tap-target
          ${isCompleted
            ? "bg-primary-600 border-primary-600 shadow-md shadow-primary-600/20"
            : "border-slate-300 hover:border-primary-600 active:scale-90"
          }`}
      >
        {isCompleted && <CheckCircle2 size={11} className="text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm leading-snug ${isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-1">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
            {displayDate}
          </span>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider
            ${isCompleted ? "bg-primary-600/10 text-primary-600" : "bg-slate-100 text-slate-500"}`}>
            {task.status}
          </span>
          {completionTime && (
            <span className="text-[10px] text-slate-400">
              Done {completionTime}
            </span>
          )}
        </div>
      </div>

      {/* Actions — always visible on mobile, hover on desktop */}
      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
        {!isCompleted && (
          <button
            onClick={() => onEdit(task)}
            className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-slate-50 transition-all tap-target flex items-center justify-center"
          >
            <Edit3 size={14} />
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-slate-100 transition-all tap-target flex items-center justify-center"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
});

export default function Tasks() {
  const { getFilteredTasks, filter, setFilter, loading, completeTask, uncompleteTask, deleteTask } = useTask();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { pending, completed, totalCount } = useMemo(() => {
    const rawTasks = getFilteredTasks().filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return {
      pending: rawTasks.filter((t) => t.status === "pending"),
      completed: rawTasks.filter((t) => t.status === "completed"),
      totalCount: rawTasks.length
    };
  }, [getFilteredTasks, search, statusFilter]);

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
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1 md:pt-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 rounded-full bg-primary-600/10 border border-primary-600/20 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">
              LOGISTICS
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Inventory</span>
          </div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em', lineHeight: 1, paddingBottom: '4px', overflow: 'visible' }} className="text-3xl md:text-4xl text-slate-900">
            Objective <span className="text-primary-600">Archive</span>
          </h1>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">{totalCount} entries registered</p>
        </div>
        <button
          onClick={() => { setEditTask(null); setShowModal(true); }}
          className="self-start sm:self-auto flex items-center gap-2 px-5 md:px-7 py-2.5 md:py-3 rounded-2xl bg-primary-600 text-white text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary-600/10"
        >
          <Plus size={16} strokeWidth={3} />
          <span>New Entry</span>
        </button>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-10 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-600 transition-all shadow-lg shadow-slate-200/50"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ─── Filter Pills ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Date filter */}
        <div className="flex gap-1 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-md overflow-x-auto no-scrollbar">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${filter === key
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10"
                  : "text-slate-600 hover:text-primary-600"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-md">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "completed", label: "Done" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${statusFilter === key
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-primary-600"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Task List ─── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center py-14 md:py-20 bg-white border border-slate-200 rounded-[1.5rem] md:rounded-[2rem] shadow-sm">
          <Clock size={28} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-600 font-semibold text-sm">No tasks found</p>
          <p className="text-slate-400 text-xs mt-1">Try a different filter or add a new task</p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-4 text-xs text-primary-600 hover:text-primary-700 font-bold transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filter === "today" && statusFilter === "all" ? (
            <>
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-wider px-1 pt-2 pb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
                Daily Tasks ({totalCount})
              </p>
              {[...pending, ...completed].map((task) => (
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
          ) : (
            <>
              {/* Pending */}
              {(statusFilter === "all" || statusFilter === "pending") && pending.length > 0 && (
                <>
                  {statusFilter === "all" && (
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1 pt-2 pb-1">
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
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-wider px-1 pt-4 pb-1">
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
            </>
          )}
        </div>
      )}

      {/* Spacer for mobile nav */}
      <div className="h-2 md:h-0" />

      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
        />
      )}
    </div>
  );
}
