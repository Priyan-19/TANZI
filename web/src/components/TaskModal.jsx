// src/components/TaskModal.jsx
import React, { useState, useEffect } from "react";
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
    type: task?.type || "general", // "general" | "additional"
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
          type: form.type,
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
      <div className="w-full sm:max-w-md bg-white border border-slate-200 rounded-t-[2rem] sm:rounded-[1.75rem] shadow-2xl shadow-black/10 overflow-hidden animate-slide-up sm:animate-scale-in">

        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-100" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-600/10 flex items-center justify-center text-primary-600">
              <Type size={15} />
            </div>
            <h2 className="font-black text-slate-800 tracking-tight text-sm">
              {isEdit ? "Edit Task" : "New Task"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="tap-target flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Task Type Toggle */}
          <div className="p-1 bg-slate-50 rounded-2xl flex gap-1">
            {[
              { id: "general", label: "General Task", desc: "Routine, repeats daily" },
              { id: "additional", label: "Additional Task", desc: "Only for today" }
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setForm({ ...form, type: type.id })}
                className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-0.5
                  ${form.type === type.id
                    ? "bg-white shadow-md shadow-black/5 text-primary-600"
                    : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider">{type.label}</span>
                <span className="text-[8px] opacity-60 font-medium">{type.desc}</span>
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <Type size={11} /> Title <span className="text-primary-600">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What do you need to do?"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/5 transition-all"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/5 transition-all resize-none"
            />
          </div>

          {/* Date */}
          <div className={form.type === "general" ? "opacity-30 pointer-events-none grayscale" : ""}>
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <Calendar size={11} /> Date {form.type === "general" && "(Daily)"}
            </label>
            <input
              type="date"
              value={form.date}
              disabled={form.type === "general"}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/5 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-400 text-sm font-bold hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="flex-1 py-3 rounded-2xl bg-primary-600 text-white text-sm font-black hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-primary-600/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
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
