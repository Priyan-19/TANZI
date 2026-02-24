// src/pages/Landing.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTask } from "../context/TaskContext";
import { useState, useEffect, useRef } from "react";
import {
    Zap, CheckCircle2, BarChart3, Clock, Rocket, Shield, Github,
    ArrowRight, Play, Pause, RotateCcw, Target, TrendingUp, Bell,
    Star, ChevronRight, Sparkles, X, Coffee, CheckSquare, Calendar,
    Users, Award, Activity
} from "lucide-react";

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ end, duration = 1500, suffix = "" }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                let start = 0;
                const step = end / (duration / 16);
                const timer = setInterval(() => {
                    start += step;
                    if (start >= end) { setCount(end); clearInterval(timer); }
                    else setCount(Math.floor(start));
                }, 16);
                observer.disconnect();
            }
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, duration]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Live Demo Modal ─────────────────────────────────────────────────────────
function LiveDemoModal({ onClose, initialTab = "tasks" }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [demoTasks, setDemoTasks] = useState([
        { id: 1, title: "Design new landing page", status: "completed", date: new Date().toISOString().split("T")[0], priority: "high" },
        { id: 2, title: "Review pull requests", status: "pending", date: new Date().toISOString().split("T")[0], priority: "medium" },
        { id: 3, title: "Write unit tests", status: "pending", date: new Date().toISOString().split("T")[0], priority: "high" },
        { id: 4, title: "Update documentation", status: "completed", date: new Date().toISOString().split("T")[0], priority: "low" },
        { id: 5, title: "Deploy to production", status: "pending", date: new Date().toISOString().split("T")[0], priority: "high" },
    ]);
    const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
    const [pomodoroRunning, setPomodoroRunning] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (pomodoroRunning) {
            intervalRef.current = setInterval(() => {
                setPomodoroTime(t => {
                    if (t <= 1) { clearInterval(intervalRef.current); setPomodoroRunning(false); return 0; }
                    return t - 1;
                });
            }, 1000);
        } else clearInterval(intervalRef.current);
        return () => clearInterval(intervalRef.current);
    }, [pomodoroRunning]);

    const toggleTask = (id) => {
        setDemoTasks(prev => prev.map(t =>
            t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t
        ));
    };

    const mins = String(Math.floor(pomodoroTime / 60)).padStart(2, "0");
    const secs = String(pomodoroTime % 60).padStart(2, "0");
    const progress = 1 - pomodoroTime / (25 * 60);
    const circumference = 2 * Math.PI * 54;

    const completed = demoTasks.filter(t => t.status === "completed").length;
    const completionRate = Math.round((completed / demoTasks.length) * 100);

    const barData = [
        { day: "Mon", done: 5, total: 7 },
        { day: "Tue", done: 8, total: 10 },
        { day: "Wed", done: 3, total: 6 },
        { day: "Thu", done: 9, total: 9 },
        { day: "Fri", done: 6, total: 8 },
        { day: "Sat", done: 4, total: 5 },
        { day: "Sun", done: 2, total: 3 },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-4xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                            <Zap size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-100 text-sm">TANZI — Live Demo</h2>
                            <p className="text-xs text-slate-500">Interactive preview — no sign-in needed</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-6 pt-4 pb-0 flex-shrink-0">
                    {["tasks", "analytics", "pomodoro"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${activeTab === tab
                                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                : "text-slate-500 hover:text-slate-300"
                                }`}
                        >
                            {tab === "tasks" ? "📋 Tasks" : tab === "analytics" ? "📊 Analytics" : "⏱ Pomodoro"}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6">
                    {activeTab === "tasks" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-slate-200">Today's Tasks</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{completed}/{demoTasks.length} completed • {completionRate}% done</p>
                                </div>
                                <div className="text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                                    ✨ Click to complete
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
                            </div>
                            {demoTasks.map(task => (
                                <div key={task.id} onClick={() => toggleTask(task.id)}
                                    className={`group flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${task.status === "completed"
                                        ? "border-slate-800/30 bg-slate-900/30 opacity-60"
                                        : "border-slate-700/50 bg-slate-900/60 hover:border-violet-500/40 hover:bg-slate-800/60"
                                        }`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${task.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-slate-600 group-hover:border-violet-500"
                                        }`}>
                                        {task.status === "completed" && <CheckCircle2 size={11} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-slate-500" : "text-slate-200"}`}>
                                            {task.title}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-0.5">Today</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-lg ${task.priority === "high" ? "bg-red-500/15 text-red-400" :
                                        task.priority === "medium" ? "bg-amber-500/15 text-amber-400" :
                                            "bg-slate-700/50 text-slate-400"
                                        }`}>
                                        {task.priority}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-lg ${task.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "analytics" && (
                        <div className="space-y-6">
                            {/* Score cards */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "Productivity Score", value: "87", icon: Award, color: "text-amber-400", bg: "bg-amber-400/10" },
                                    { label: "Avg Completion", value: "74%", icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-400/10" },
                                    { label: "Day Streak", value: "12", icon: Activity, color: "text-cyan-400", bg: "bg-cyan-400/10" },
                                ].map(({ label, value, icon: Icon, color, bg }) => (
                                    <div key={label} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-4">
                                        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${color} mb-3`}>
                                            <Icon size={16} />
                                        </div>
                                        <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
                                        <p className="text-xs text-slate-500">{label}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Bar chart */}
                            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
                                <h4 className="text-sm font-semibold text-slate-300 mb-4">Weekly Completion</h4>
                                <div className="flex items-end gap-2 h-28">
                                    {barData.map(({ day, done, total }) => {
                                        const pct = Math.round((done / total) * 100);
                                        return (
                                            <div key={day} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-xs text-slate-500">{pct}%</span>
                                                <div className="w-full rounded-t-lg overflow-hidden bg-slate-800" style={{ height: "80px" }}>
                                                    <div
                                                        className="w-full bg-gradient-to-t from-violet-600 to-cyan-500 rounded-t-lg transition-all"
                                                        style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-600">{day}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Distribution */}
                            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
                                <h4 className="text-sm font-semibold text-slate-300 mb-4">Task Distribution</h4>
                                <div className="space-y-3">
                                    {[
                                        { label: "Completed", pct: 68, color: "from-emerald-500 to-emerald-400" },
                                        { label: "In Progress", pct: 20, color: "from-violet-500 to-violet-400" },
                                        { label: "Pending", pct: 12, color: "from-amber-500 to-amber-400" },
                                    ].map(({ label, pct, color }) => (
                                        <div key={label}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-400">{label}</span>
                                                <span className="text-slate-500">{pct}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "pomodoro" && (
                        <div className="flex flex-col items-center gap-6 py-4">
                            <div className="text-center">
                                <h3 className="font-semibold text-slate-200 mb-1">Focus Timer</h3>
                                <p className="text-sm text-slate-500">Stay in the zone with 25-minute focus sessions</p>
                            </div>
                            {/* Circular progress */}
                            <div className="relative w-48 h-48">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="8" />
                                    <circle
                                        cx="60" cy="60" r="54" fill="none" stroke="url(#demoGrad)"
                                        strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={circumference * (1 - progress)}
                                        className="transition-all duration-1000"
                                    />
                                    <defs>
                                        <linearGradient id="demoGrad" x1="0%" y1="0%" x2="100%">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold text-slate-100 font-mono">{mins}:{secs}</span>
                                    <span className="text-xs text-slate-500 mt-1">Focus Session</span>
                                </div>
                            </div>
                            {/* Controls */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setPomodoroRunning(r => !r)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
                                >
                                    {pomodoroRunning ? <Pause size={18} /> : <Play size={18} />}
                                    {pomodoroRunning ? "Pause" : "Start Focus"}
                                </button>
                                <button
                                    onClick={() => { setPomodoroTime(25 * 60); setPomodoroRunning(false); }}
                                    className="p-3 rounded-2xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                                >
                                    <RotateCcw size={18} />
                                </button>
                            </div>
                            <div className="flex gap-3">
                                {[
                                    { label: "Focus", time: 25 * 60 },
                                    { label: "Short Break", time: 5 * 60 },
                                    { label: "Long Break", time: 15 * 60 },
                                ].map(({ label, time }) => (
                                    <button
                                        key={label}
                                        onClick={() => { setPomodoroTime(time); setPomodoroRunning(false); }}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-violet-500/50 transition-all"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Coffee size={14} />
                                <span>Complete a session for a break reward ☕</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* CTA footer */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between flex-shrink-0">
                    <p className="text-sm text-slate-400">
                        <span className="text-violet-400 font-medium">Sign up free</span> — no credit card required
                    </p>
                    <Link
                        to="/login"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                        Get Started Free
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, bg, badge, onClick, liveValue }) {
    return (
        <div
            onClick={onClick}
            className="group relative p-8 rounded-3xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-600/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 overflow-hidden cursor-pointer"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {badge && (
                <span className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 font-medium">
                    {badge}
                </span>
            )}
            {liveValue && (
                <span className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold animate-pulse uppercase tracking-wider">
                    Live: {liveValue}
                </span>
            )}
            <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center ${color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={26} />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
        </div>
    );
}

// ─── Testimonial ─────────────────────────────────────────────────────────────
function TestimonialCard({ name, role, text, stars = 5 }) {
    return (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/50 hover:border-slate-700 transition-all">
            <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                ))}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">"{text}"</p>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                    {name[0]}
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-200">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Landing() {
    const { user } = useAuth();
    const { getTodayTasks, tasks } = useTask();
    const navigate = useNavigate();
    const [showDemo, setShowDemo] = useState(false);
    const [demoTab, setDemoTab] = useState("tasks");
    const [scrolled, setScrolled] = useState(false);

    const todayTasks = user ? getTodayTasks() : [];
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = todayTasks.filter(t => t.status === 'pending').length;

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-violet-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-violet-600/8 rounded-full blur-[140px]" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-600/8 rounded-full blur-[140px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-600/5 rounded-full blur-[100px]" />
                {/* Subtle grid pattern */}
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px"
                }} />
            </div>

            {/* Navigation */}
            <nav className={`relative z-50 sticky top-0 transition-all duration-300 ${scrolled ? "bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60 shadow-xl shadow-black/20" : "bg-slate-950/40 backdrop-blur-md border-b border-transparent"
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Zap size={17} className="text-white" />
                        </div>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', background: 'linear-gradient(to right, #a78bfa, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block', paddingRight: '3px' }}>
                            TANZI
                        </span>
                    </div>

                    {/* Center links */}
                    <div className="hidden md:flex items-center gap-1">
                        {[
                            { label: "Features", href: "#features" },
                            { label: "Demo", href: "#demo", action: () => setShowDemo(true) },
                            { label: "Testimonials", href: "#testimonials" },
                        ].map(({ label, href, action }) => (
                            <button
                                key={label}
                                onClick={action || (() => document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }))}
                                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all font-medium"
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <button
                                onClick={() => navigate("/app")}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
                            >
                                Open Dashboard
                                <ChevronRight size={14} />
                            </button>
                        ) : (
                            <>
                                <Link className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors px-2" to="/login">
                                    Login
                                </Link>
                                <Link
                                    to="/login"
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20 hidden sm:flex"
                                >
                                    Get Started
                                    <ArrowRight size={14} />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section className="relative z-10 pt-32 pb-20 px-4 sm:px-6 text-center">
                <div className="max-w-5xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs font-semibold mb-8 hover:bg-violet-500/15 transition-colors cursor-default">
                        <Sparkles size={12} className="animate-pulse" />
                        <span>Introducing TANZI v1.0 — Your AI-powered productivity hub</span>
                        <ChevronRight size={12} />
                    </div>

                    <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em', lineHeight: 1.1, paddingBottom: '0.2em', overflow: 'visible' }} className="text-5xl sm:text-7xl mb-7">
                        <span className="text-slate-50">Master your time with</span>
                        <br />
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent inline-block pb-1 pr-4">
                            Intelligent Analytics
                        </span>
                    </h1>

                    <p className="text-slate-400 text-lg sm:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                        Stop guessing your productivity. TANZI gives you <strong className="text-slate-300">real-time insights</strong>, smart task management, and a built-in{" "}
                        <strong className="text-slate-300">Pomodoro timer</strong> — all in one beautiful dashboard.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link
                            id="hero-cta-signup"
                            to="/login"
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold text-base hover:shadow-2xl hover:shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            Start for Free
                            <ArrowRight size={18} />
                        </Link>
                        <button
                            id="hero-live-demo-btn"
                            onClick={() => setShowDemo(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-2xl border border-slate-700 bg-slate-900/60 text-slate-200 font-bold text-base hover:bg-slate-800/80 hover:border-slate-600 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <Play size={16} className="text-violet-400" />
                            Watch Live Demo
                        </button>
                    </div>

                    {/* Social proof */}
                    <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {["V", "A", "M", "R"].map((l, i) => (
                                    <div key={i} className="w-7 h-7 rounded-full border-2 border-slate-950 bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                        {l}
                                    </div>
                                ))}
                            </div>
                            <span>Trusted by <strong className="text-slate-300">2,000+</strong> users</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
                            <span><strong className="text-slate-300">4.9/5</strong> rating</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Shield size={13} className="text-emerald-400" />
                            <span>100% <strong className="text-slate-300">free forever</strong></span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Stats ─── */}
            <section className="relative z-10 py-16 px-4 sm:px-6 bg-slate-900/30 border-y border-slate-800/50">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { end: 2000, suffix: "+", label: "Active Users", icon: Users },
                        { end: 48000, suffix: "+", label: "Tasks Completed", icon: CheckSquare },
                        { end: 12500, suffix: "+", label: "Focus Sessions", icon: Clock },
                        { end: 98, suffix: "%", label: "Satisfaction Rate", icon: Award },
                    ].map(({ end, suffix, label, icon: Icon }) => (
                        <div key={label} className="flex flex-col items-center gap-2">
                            <Icon size={20} className="text-violet-400 mb-1" />
                            <p className="text-3xl font-extrabold text-slate-100">
                                <AnimatedCounter end={end} suffix={suffix} />
                            </p>
                            <p className="text-sm text-slate-500">{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Features ─── */}
            <section id="features" className="relative z-10 py-24 px-4 sm:px-6 scroll-mt-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
                            <Zap size={11} />
                            EVERYTHING YOU NEED
                        </div>
                        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em', paddingBottom: '4px', overflow: 'visible' }} className="text-4xl sm:text-5xl text-slate-100 mb-4">
                            Built for serious <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent inline-block pr-2">achievers</span>
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                            A complete productivity toolkit designed from the ground up for people who want results.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={CheckCircle2}
                            title="Seamless Tasking"
                            desc="Create, organize, and complete tasks with a fluid interface that works beautifully on any device. Filter by today, week, or month."
                            color="text-emerald-400"
                            bg="bg-emerald-400/10"
                            liveValue={user ? `${pendingTasks} pending` : null}
                            onClick={() => {
                                if (user) navigate("/app/tasks");
                                else { setDemoTab("tasks"); setShowDemo(true); }
                            }}
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Smart Analytics"
                            desc="Visualize your productivity patterns with interactive charts. See daily completion rates, weekly trends, and monthly breakdowns."
                            color="text-violet-400"
                            bg="bg-violet-400/10"
                            badge="Popular"
                            liveValue={user ? `${completedTasks} focus done` : null}
                            onClick={() => {
                                if (user) navigate("/app/analytics");
                                else { setDemoTab("analytics"); setShowDemo(true); }
                            }}
                        />
                        <FeatureCard
                            icon={Clock}
                            title="Pomodoro Timer"
                            desc="Built-in focus timer to eliminate distractions. Customize focus and break intervals to match your working style."
                            color="text-cyan-400"
                            bg="bg-cyan-400/10"
                            liveValue={user ? "Active" : null}
                            onClick={() => {
                                if (user) navigate("/app");
                                else { setDemoTab("pomodoro"); setShowDemo(true); }
                            }}
                        />
                        <FeatureCard
                            icon={Bell}
                            title="Smart Reminders"
                            desc="Get notified about pending tasks automatically. Browser push notifications keep you on track even when the app is in the background."
                            color="text-amber-400"
                            bg="bg-amber-400/10"
                            badge="New"
                            onClick={() => {
                                if (user) navigate("/app");
                                else { setDemoTab("tasks"); setShowDemo(true); }
                            }}
                        />
                        <FeatureCard
                            icon={TrendingUp}
                            title="Streak Tracking"
                            desc="Build powerful habits with daily streak tracking. Stay motivated as you watch your productivity streak grow day after day."
                            color="text-fuchsia-400"
                            bg="bg-fuchsia-400/10"
                            onClick={() => {
                                if (user) navigate("/app/analytics");
                                else { setDemoTab("analytics"); setShowDemo(true); }
                            }}
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Secure & Private"
                            desc="Your data is protected by Firebase's enterprise-grade security. Google authentication ensures only you can access your tasks."
                            color="text-sky-400"
                            bg="bg-sky-400/10"
                            onClick={() => {
                                if (user) navigate("/app");
                                else navigate("/login");
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* ─── Demo CTA Banner ─── */}
            <section id="demo" className="relative z-10 py-16 px-4 sm:px-6 scroll-mt-20">
                <div className="max-w-4xl mx-auto">
                    <div className="relative rounded-3xl overflow-hidden border border-violet-500/30 bg-gradient-to-br from-violet-900/30 via-slate-900 to-cyan-900/20 p-10 text-center">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-cyan-500/5" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-6">
                                <Play size={10} />
                                INTERACTIVE DEMO
                            </div>
                            <h2 className="text-4xl font-extrabold text-slate-100 mb-4">
                                Try it right now — <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">no sign-up needed</span>
                            </h2>
                            <p className="text-slate-400 mb-8 text-lg max-w-xl mx-auto">
                                Click through the full app experience including task management, analytics, and the Pomodoro timer.
                            </p>
                            <button
                                id="demo-section-btn"
                                onClick={() => setShowDemo(true)}
                                className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold text-lg hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <Play size={20} />
                                Launch Interactive Demo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Testimonials ─── */}
            <section id="testimonials" className="relative z-10 py-24 px-4 sm:px-6 scroll-mt-20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
                            <Star size={11} className="fill-amber-400" />
                            LOVED BY USERS
                        </div>
                        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em', paddingBottom: '4px', overflow: 'visible' }} className="text-4xl text-slate-100">What people are saying</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <TestimonialCard
                            name="Priya Sharma"
                            role="Product Designer"
                            text="TANZI completely transformed how I manage my day. The analytics give me insights I never had before. My productivity is up by 40%!"
                        />
                        <TestimonialCard
                            name="Alex Chen"
                            role="Software Engineer"
                            text="The Pomodoro timer integration with task tracking is brilliant. I can see exactly how much time I spend on each project."
                        />
                        <TestimonialCard
                            name="Marcus Williams"
                            role="Freelancer"
                            text="The reminders and streak tracking keep me accountable. Best productivity app I've used. And it's completely free!"
                        />
                    </div>
                </div>
            </section>

            {/* ─── Final CTA ─── */}
            <section className="relative z-10 py-24 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em', lineHeight: 1.1, paddingBottom: '8px', overflow: 'visible' }} className="text-5xl text-slate-100 mb-6">
                        Ready to take <br />
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent inline-block pr-4">
                            control of your time?
                        </span>
                    </h2>
                    <p className="text-slate-400 text-xl mb-10">
                        Join thousands of people already using TANZI to achieve more every day.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/login"
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-12 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold text-lg hover:shadow-2xl hover:shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <Rocket size={20} />
                            Start for Free — No CC Required
                        </Link>
                    </div>
                    <p className="text-slate-600 text-sm mt-5">Sign up with email or Google in under 30 seconds</p>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="relative z-10 py-12 px-4 sm:px-6 border-t border-slate-800/60">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                                <Zap size={14} className="text-white" />
                            </div>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.03em', color: '#e2e8f0', display: 'inline-block', paddingRight: '2px' }}>TANZI</span>
                        </div>
                        <p className="text-slate-500 text-sm">
                            © 2026 TANZI. Crafted with ❤️ for productive minds.
                        </p>
                        <div className="flex items-center gap-4 text-slate-500">
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer transition-colors hover:scale-110 duration-200">
                                <Github size={20} />
                            </a>
                            <Shield size={20} className="hover:text-white cursor-pointer transition-colors hover:scale-110 duration-200" />
                            <Bell size={20} className="hover:text-white cursor-pointer transition-colors hover:scale-110 duration-200" />
                        </div>
                    </div>
                </div>
            </footer>

            {/* Live Demo Modal */}
            {showDemo && <LiveDemoModal initialTab={demoTab} onClose={() => setShowDemo(false)} />}
        </div>
    );
}
