// src/pages/Analytics.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTask } from "../context/TaskContext";
import {
  getWeeklyAnalytics, getMonthlyAnalytics, calculateProductivityScore
} from "../services/analyticsService";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, Award, Calendar, BarChart3 } from "lucide-react";

const COLORS = {
  completed: "#10b981",
  pending: "#f59e0b",
  rate: "#8b5cf6",
  line: "#06b6d4",
};

function ChartCard({ title, children, icon: Icon }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        {Icon && <Icon size={16} className="text-violet-400" />}
        <h3 className="font-semibold text-slate-200 text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}{p.name === "rate" ? "%" : ""}</span>
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { user } = useAuth();
  const { tasks } = useTask();
  const [weekData, setWeekData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("week"); // week | month

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
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

  const currentData = view === "week" ? weekData : monthData;

  // Pie chart data - all tasks total
  const totalCompleted = tasks.filter((t) => t.status === "completed").length;
  const totalPending = tasks.filter((t) => t.status === "pending").length;
  const pieData = [
    { name: "Completed", value: totalCompleted },
    { name: "Pending", value: totalPending },
  ];

  const avgCompletion = currentData.length > 0
    ? Math.round(currentData.reduce((s, d) => s + (d.completionRate || 0), 0) / currentData.length)
    : 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
          <p className="text-slate-400 text-sm">Your productivity insights</p>
        </div>
        <div className="flex gap-1 p-1 bg-slate-900/60 border border-slate-800 rounded-xl">
          {["week", "month"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                view === v ? "bg-violet-500 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {v === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-amber-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider">Productivity Score</p>
          </div>
          <p className="text-4xl font-bold text-amber-400">{score}</p>
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-violet-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider">Avg Completion</p>
          </div>
          <p className="text-4xl font-bold text-violet-400">{avgCompletion}%</p>
          <p className="text-xs text-slate-500 mt-2">{view === "week" ? "This week" : "This month"}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-cyan-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider">Total Tasks</p>
          </div>
          <p className="text-4xl font-bold text-cyan-400">{tasks.length}</p>
          <p className="text-xs text-slate-500 mt-2">all time</p>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line chart - Completion Trend */}
        <ChartCard title="Completion Trend" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="completionRate"
                name="rate"
                stroke={COLORS.rate}
                strokeWidth={2.5}
                dot={{ fill: COLORS.rate, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar chart - Daily Completed */}
        <ChartCard title="Tasks Completed" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={currentData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completedTasks" name="completed" fill={COLORS.completed} radius={[6, 6, 0, 0]} />
              <Bar dataKey="pendingTasks" name="pending" fill={COLORS.pending} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie chart */}
        <ChartCard title="Overall Distribution" icon={BarChart3}>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill={COLORS.completed} />
                  <Cell fill={COLORS.pending} />
                </Pie>
                <Tooltip formatter={(val, name) => [`${val} tasks`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS.completed }} />
                  <span className="text-xs text-slate-400">Completed</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">{totalCompleted}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS.pending }} />
                  <span className="text-xs text-slate-400">Pending</span>
                </div>
                <p className="text-2xl font-bold text-amber-400">{totalPending}</p>
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Weekly summary table */}
        <ChartCard title={`${view === "week" ? "Daily" : "Weekly"} Breakdown`} icon={Calendar}>
          <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
            {currentData.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-10 flex-shrink-0">{d.label}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                    style={{ width: `${d.completionRate || 0}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{d.completionRate || 0}%</span>
                <span className="text-xs text-slate-600 w-12 text-right">{d.completedTasks || 0}/{d.totalTasks || 0}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
