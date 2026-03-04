// src/pages/Analytics.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useTask } from "../context/TaskContext";
import {
  getWeeklyAnalytics, getMonthlyAnalytics, calculateProductivityScore,
} from "../services/analyticsService";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Award, Calendar, BarChart3 } from "lucide-react";

const COLORS = {
  completed: "#10b981",
  pending: "#f59e0b",
  rate: "#8b5cf6",
  line: "#06b6d4",
};

// ─── Chart Card (Memoized) ──────────────────────────────────────────────────
const ChartCard = React.memo(({ title, children, icon: Icon }) => {
  return (
    <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/80 md:backdrop-blur-xl border border-slate-300/80 dark:border-slate-800/40 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-xl shadow-slate-300/20 dark:shadow-black/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          {Icon && (
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-600">
              <Icon size={15} className="md:hidden" />
              <Icon size={18} className="hidden md:block" />
            </div>
          )}
          <h3 className="text-[11px] md:text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{title}</h3>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      {children}
    </div>
  );
});

// ─── Custom Tooltip (Memoized) ──────────────────────────────────────────────
const CustomTooltip = React.memo(({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-800 dark:text-slate-300 font-bold mb-1">{label}</p>
      {payload.map((p, idx) => (
        <p key={idx} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="font-bold">{p.value}{p.name === "rate" ? "%" : ""}</span>
        </p>
      ))}
    </div>
  );
});

export default function Analytics() {
  const { user } = useAuth();
  const { tasks } = useTask();
  const [weekData, setWeekData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState("week");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);

      // 1. Run automated checks (Silent)
      try {
        const { checkAndGenerateAutomatedReports } = await import("../services/analyticsService");
        await checkAndGenerateAutomatedReports(user.uid);
      } catch (err) {
        console.warn("Auto-report check failed:", err);
      }

      // 2. Fetch data for charts
      const [week, month, prod] = await Promise.all([
        getWeeklyAnalytics(user.uid),
        getMonthlyAnalytics(user.uid),
        calculateProductivityScore(user.uid),
      ]);
      setWeekData(week);
      setMonthData(month);
      setScore(prod);
      setLoading(false);
    };
    fetchData();
  }, [user, tasks.length]);

  const handleManualGenerate = async () => {
    if (!user || generating) return;
    try {
      setGenerating(true);
      const { generateDailyReport, generateWeeklyReport, generateMonthlyReport } = await import("../services/analyticsService");

      // Silently generate for this period
      await Promise.all([
        generateDailyReport(user.uid, new Date()),
        generateWeeklyReport(user.uid, new Date()),
        generateMonthlyReport(user.uid, new Date())
      ]);

      // Refresh chart data
      const [week, month, prod] = await Promise.all([
        getWeeklyAnalytics(user.uid),
        getMonthlyAnalytics(user.uid),
        calculateProductivityScore(user.uid),
      ]);
      setWeekData(week);
      setMonthData(month);
      setScore(prod);
    } catch (err) {
      console.error("Manual generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const currentData = React.useMemo(() => view === "week" ? weekData : monthData, [view, weekData, monthData]);


  const { pieData, avgCompletion, totalCompleted, totalPending } = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "completed").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const avg = currentData.length > 0
      ? Math.round(currentData.reduce((s, d) => s + (d.completionRate || 0), 0) / currentData.length)
      : 0;

    return {
      totalCompleted: completed,
      totalPending: pending,
      pieData: [
        { name: "Completed", value: completed },
        { name: "Pending", value: pending },
      ],
      avgCompletion: avg
    };
  }, [tasks, currentData]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-[1.5rem] animate-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-[1.5rem] animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1 md:pt-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              INTELLIGENCE REPORT
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Performance Data</span>
          </div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em', lineHeight: 1, paddingBottom: '4px', overflow: 'visible' }} className="text-3xl md:text-4xl text-slate-900 dark:text-slate-100">
            Strategic <span className="text-violet-600">Analyzers</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Operational efficiency metrics</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleManualGenerate}
            disabled={generating}
            className={`px-4 md:px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95
              ${generating
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02]"}`}
          >
            <BarChart3 size={14} className={generating ? "animate-spin" : ""} />
            {generating ? "Updating..." : "Generate"}
          </button>

          {/* Period toggle */}
          <div className="flex gap-1 p-1 bg-white/85 dark:bg-slate-900/40 backdrop-blur-md md:backdrop-blur-xl border border-slate-300/80 dark:border-slate-800/40 rounded-2xl shadow-md">
            {["week", "month"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 md:px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${view === v
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
              >
                {v === "week" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ─── Score Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {/* Efficiency */}
        <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/80 md:backdrop-blur-xl border border-slate-300/80 dark:border-slate-800/40 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-7 shadow-xl shadow-slate-300/20 dark:shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/20">
              <Award size={18} />
            </div>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Efficiency Index</p>
          </div>
          <p className="text-4xl md:text-5xl font-black text-amber-500 tracking-tighter italic mb-3">{score}</p>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Deployment Rate */}
        <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/80 md:backdrop-blur-xl border border-slate-300/80 dark:border-slate-800/40 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-7 shadow-xl shadow-slate-300/20 dark:shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-600 shadow-lg shadow-violet-500/20">
              <TrendingUp size={18} />
            </div>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Completion Rate</p>
          </div>
          <p className="text-4xl md:text-5xl font-black text-violet-600 dark:text-violet-400 tracking-tighter italic mb-2">{avgCompletion}%</p>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{view === "week" ? "Current Protocol" : "Extended Protocol"}</p>
        </div>

        {/* Total */}
        <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/80 md:backdrop-blur-xl border border-slate-300/80 dark:border-slate-800/40 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-7 shadow-xl shadow-slate-300/20 dark:shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 shadow-lg shadow-cyan-500/20">
              <Calendar size={18} />
            </div>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Total Captured</p>
          </div>
          <p className="text-4xl md:text-5xl font-black text-cyan-600 dark:text-cyan-400 tracking-tighter italic mb-2">{tasks.length}</p>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Lifecycle</p>
        </div>
      </div>

      {/* ─── Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Line Chart */}
        <ChartCard title="Completion Trend" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="completionRate"
                name="rate"
                stroke={COLORS.rate}
                strokeWidth={2.5}
                dot={{ fill: COLORS.rate, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar Chart */}
        <ChartCard title="Tasks Completed" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={currentData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completedTasks" name="completed" fill={COLORS.completed} radius={[5, 5, 0, 0]} />
              <Bar dataKey="pendingTasks" name="pending" fill={COLORS.pending} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie Chart */}
        <ChartCard title="Overall Distribution" icon={BarChart3}>
          <div className="flex items-center justify-center gap-6 md:gap-8">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill={COLORS.completed} />
                  <Cell fill={COLORS.pending} />
                </Pie>
                <Tooltip formatter={(val, name) => [`${val} tasks`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.completed }} />
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Completed</span>
                </div>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{totalCompleted}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.pending }} />
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Pending</span>
                </div>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tighter">{totalPending}</p>
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Breakdown Table */}
        <ChartCard title={`${view === "week" ? "Daily" : "Weekly"} Breakdown`} icon={Calendar}>
          <div className="space-y-2.5 overflow-y-auto max-h-[180px] pr-1 no-scrollbar">
            {currentData.map((d, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-[10px] text-slate-500 w-8 flex-shrink-0 font-medium">{d.label}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-700"
                    style={{ width: `${d.completionRate || 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 w-7 text-right font-bold">{d.completionRate || 0}%</span>
                <span className="text-[10px] text-slate-500 w-10 text-right">{d.completedTasks || 0}/{d.totalTasks || 0}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Spacer for mobile nav */}
      <div className="h-2 md:h-0" />
    </div>
  );
}
