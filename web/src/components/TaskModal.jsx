// src/components/TaskModal.jsx
import { useState, useEffect } from "react";
import { useTask } from "../context/TaskContext";
import { X, Calendar, FileText, Type } from "lucide-react";
import { format } from "date-fns";

export default function TaskModal({ task, onClose }) {
  const { addTask, updateTask } = useTask();
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    date: task?.date || format(new Date(), "yyyy-MM-dd"),
  });
  const [loading, setLoading] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await updateTask(task.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          date: form.date,
        });
      } else {
        await addTask(form);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Sheet-style on mobile, centered dialog on sm+ */}
      <div className="w-full sm:max-w-md bg-white dark:bg-[#0f172a] border border-slate-200/60 dark:border-slate-700/60 rounded-t-[2rem] sm:rounded-[1.75rem] shadow-2xl shadow-black/30 overflow-hidden animate-slide-up sm:animate-scale-in">

        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-600">
              <Type size={15} />
            </div>
            <h2 className="font-black text-slate-800 dark:text-slate-200 tracking-tight text-sm">
              {isEdit ? "Edit Task" : "New Task"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="tap-target flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <Type size={11} /> Title <span className="text-violet-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What do you need to do?"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <FileText size={11} /> Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add some details..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all resize-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <Calendar size={11} /> Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-black hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </form>

        {/* iOS safe area bottom spacing */}
        <div className="h-safe-bottom sm:h-0 pb-safe" />
      </div>
    </div>
  );
}
