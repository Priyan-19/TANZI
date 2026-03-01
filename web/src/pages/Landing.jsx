// src/pages/Landing.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import {
    Zap, BarChart3, Clock,
    ArrowRight, Target, Activity, Award,
    ChevronRight, Sparkles, Users, Smartphone, Monitor, Tablet as TabletIcon
} from "lucide-react";

// ─── Bento Card Component ───────────────────────────────────────────────────
function BentoCard({ children, className = "", title, desc, icon: Icon, colorClass = "text-violet-400" }) {
    return (
        <div
            className={`group relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/5 bg-slate-900/40 backdrop-blur-md transition-all duration-300 hover:border-white/10 hover:bg-slate-900/60 ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 p-8 h-full flex flex-col">
                {Icon && (
                    <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${colorClass} mb-5 group-hover:scale-110 transition-transform shadow-2xl`}>
                        <Icon size={28} />
                    </div>
                )}
                {title && <h3 className="text-lg md:text-xl font-black text-white mb-2 tracking-tight">{title}</h3>}
                {desc && <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed mb-8">{desc}</p>}
                <div className="mt-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ─── Mock Dashboard Component ──────────────────────────────────────────────
function MockDashboard() {
    return (
        <div className="w-full max-w-sm mx-auto bg-slate-950/90 rounded-[2rem] border border-white/10 shadow-2xl p-5 transform transition-transform group-hover:scale-[1.02] duration-500">
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/40" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/40" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
                </div>
                <div className="h-5 w-28 bg-white/5 rounded-full" />
            </div>
            <div className="space-y-4">
                {[
                    { t: "Deep Work Session", p: "80%", c: "bg-violet-500" },
                    { t: "Project Analytics", p: "45%", c: "bg-cyan-500" },
                    { t: "Team Sync", p: "100%", c: "bg-emerald-500" }
                ].map((item, i) => (
                    <div key={i} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                        <div className="flex justify-between text-xs text-slate-500 mb-2 font-black uppercase tracking-[0.1em]">
                            <span>{item.t}</span>
                            <span>{item.p}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${item.c} shadow-[0_0_10px_rgba(139,92,246,0.3)] rounded-full`} style={{ width: item.p }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Landing Page ──────────────────────────────────────────────────────
export default function Landing() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [activeDevice, setActiveDevice] = useState("MOBILE");

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30 font-sans overflow-x-hidden">

            {/* ── Background Effects ── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.2]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.1'%3E%3Cpath d='M36 34v2h2v-2h-2zm0 8v2h2v-2h-2zm-8-4v2h2v-2h-2zm0 8v2h2v-2h-2zm-8-4v2h2v-2h-2zm0 8v2h2v-2h-2zm-8-4v2h2v-2h-2zm0 8v2h2v-2h-2zm0-8V6h2v26h-2zm8 8V14h2v26h-2zm8 8V22h2v26h-2zm8 8V30h2v26h-2zM8 6v2h2V6H8zm8 8v2h2v-2h-2zm8 8v2h2v-2h-2zm8 8v2h2v-2h-2zM0 0h2v2H0V0zm0 8h2v2H0V8zm0 8h2v2H0v-2zm0 8h2v2H0v-2zm0 8h2v2H0v-2zm0 8h2v2H0v-2zm0 8h2v2H0v-2zm0 8h2v2H0v-2zm8-8h2v2H8v-2zm0-8h2v2H8v-2zm0-8h2v2H8v-2zm0-8h2v2H8v-2zm0-8h2v2H8V0zm0 8h2v2H8V8zm8 8h2v2h-2v-2zm0-8h2v2h-2V8zm0-8h2v2h-2V0zm8 8h2v2h-2V8zm0-8h2v2h-2V0zm8 0h2v2h-2V0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />
            </div>

            {/* ── Navigation ── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? "py-4 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5" : "py-4 md:py-8 bg-transparent"
                }`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="relative w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 p-[2px] transition-transform group-hover:scale-110">
                            <div className="w-full h-full bg-slate-950 rounded-[18px] flex items-center justify-center">
                                <Zap size={22} className="text-white fill-white" />
                            </div>
                        </div>
                        <span className="text-2xl md:text-3xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent italic pr-8 overflow-visible">
                            TANZI
                        </span>
                    </div>

                    <div className="flex items-center gap-5">
                        {user ? (
                            <button
                                onClick={() => navigate("/app")}
                                className="px-8 py-3 rounded-full bg-white text-slate-950 text-[13px] font-black hover:scale-105 transition-all shadow-xl"
                            >
                                DASHBOARD
                            </button>
                        ) : (
                            <>
                                <Link to="/login" className="text-[13px] font-black text-slate-500 hover:text-white transition-colors hidden sm:block tracking-widest">LOGIN</Link>
                                <button
                                    onClick={() => navigate("/login")}
                                    className="px-8 py-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-[13px] font-black hover:shadow-2xl transition-all"
                                >
                                    GET STARTED
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ── */}
            <section className="relative z-10 pt-32 md:pt-56 pb-24 md:pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] mb-10 md:mb-14">
                        <Sparkles size={14} />
                        The Future of Time Management
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black tracking-[-0.04em] leading-[0.9] text-white mb-8 md:mb-10">
                        Unleash Your <br />
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent italic">Productivity</span>
                    </h1>

                    <p className="max-w-3xl mx-auto text-base md:text-2xl font-medium leading-[1.6] mb-12 md:mb-16 px-4">
                        Experience a radical shift in how you work. TANZI combines high-performance
                        tracking with elite analytics to turn your goals into <span className="text-white italic font-bold">completed missions.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                        <Link
                            to="/login"
                            className="group relative w-full sm:w-auto px-8 py-5 md:px-12 md:py-6 rounded-2xl md:rounded-3xl bg-white text-slate-950 font-black text-lg md:text-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-200 to-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                START YOUR JOURNEY <ArrowRight size={24} />
                            </span>
                        </Link>
                        <div className="text-slate-500 font-extrabold text-[12px] tracking-[0.4em] uppercase">Free Forever</div>
                    </div>
                </div>
            </section>

            {/* ── Bento Grid Section ── */}
            <section id="features" className="relative z-10 py-24 md:py-32 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    <BentoCard
                        className="md:col-span-2"
                        title="Smarter Orchestration"
                        desc="Our intelligent dashboard syncs your tasks, focus sessions, and analytics into one high-performance flow. Experience total visibility."
                        icon={Target}
                    >
                        <div className="relative mt-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <MockDashboard />
                                <div className="hidden lg:flex flex-col justify-center gap-5">
                                    <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5">
                                        <p className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Efficiency Rating</p>
                                        <div className="text-4xl font-black text-emerald-400 tracking-tighter">94.8%</div>
                                    </div>
                                    <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5">
                                        <p className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Focus Gained</p>
                                        <div className="text-4xl font-black text-violet-400 tracking-tighter">+12.4h</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard
                        title="Elite Analytics"
                        desc="Visualize every second with data engine insights."
                        icon={BarChart3}
                        colorClass="text-cyan-400"
                    >
                        <div className="mt-8 flex items-end gap-2 h-48 px-4">
                            {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                                <div key={i} className="flex-1 bg-gradient-to-t from-cyan-600 to-violet-500 rounded-t-xl transition-all hover:brightness-125 origin-bottom" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </BentoCard>

                    <BentoCard
                        title="Deep Focus"
                        desc="Shatter distractions with our high-intensity engine."
                        icon={Clock}
                        colorClass="text-fuchsia-400"
                    >
                        <div className="mt-4 flex flex-col items-center py-10 md:py-12 bg-slate-950/50 rounded-[2rem] md:rounded-[2.5rem] border border-white/5">
                            <div className="text-4xl md:text-5xl font-black text-white font-mono tracking-tighter mb-4">30:00</div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
                                <div className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Session</div>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard
                        className="md:col-span-2"
                        title="Hyper-Responsive"
                        desc="Engineered for speed on any device. TANZI looks and feels professional across the entire web ecosystem."
                        icon={Activity}
                        colorClass="text-emerald-400"
                    >
                        <div className="relative mb-8 flex justify-center py-12 md:py-16 bg-slate-950/40 rounded-[2rem] border border-white/5">
                            {activeDevice === "DESKTOP" && <Monitor size={80} className="text-white/20 animate-pulse md:size-[100px]" />}
                            {activeDevice === "MOBILE" && <Smartphone size={80} className="text-white/20 animate-pulse md:size-[100px]" />}
                            {activeDevice === "TABLET" && <TabletIcon size={80} className="text-white/20 animate-pulse md:size-[100px]" />}
                        </div>
                        <div className="flex gap-2 md:gap-4">
                            <button
                                onClick={() => setActiveDevice("DESKTOP")}
                                className={`flex-1 h-12 md:h-16 rounded-xl md:rounded-2xl border transition-all font-black text-[10px] md:text-xs tracking-[0.1em] md:tracking-[0.2em] ${activeDevice === "DESKTOP"
                                    ? "bg-white text-slate-950 border-white scale-105"
                                    : "bg-white/10 border-white/5 text-slate-400 hover:text-white"
                                    }`}
                            >
                                DESKTOP
                            </button>
                            <button
                                onClick={() => setActiveDevice("MOBILE")}
                                className={`flex-1 h-12 md:h-16 rounded-xl md:rounded-2xl border transition-all font-black text-[10px] md:text-xs tracking-[0.1em] md:tracking-[0.2em] ${activeDevice === "MOBILE"
                                    ? "bg-white text-slate-950 border-white scale-105"
                                    : "bg-white/10 border-white/5 text-slate-400 hover:text-white"
                                    }`}
                            >
                                MOBILE
                            </button>
                            <button
                                onClick={() => setActiveDevice("TABLET")}
                                className={`flex-1 h-12 md:h-16 rounded-xl md:rounded-2xl border transition-all font-black text-[10px] md:text-xs tracking-[0.1em] md:tracking-[0.2em] ${activeDevice === "TABLET"
                                    ? "bg-white text-slate-950 border-white scale-105"
                                    : "bg-white/10 border-white/5 text-slate-400 hover:text-white"
                                    }`}
                            >
                                TABLET
                            </button>
                        </div>
                    </BentoCard>

                </div>
            </section>

            {/* ── Efficiency Section ── */}
            <section id="efficiency" className="relative z-10 py-24 md:py-48 bg-slate-900/20 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
                    <div>
                        <div className="text-cyan-400 font-black text-[11px] uppercase tracking-[0.4em] mb-6">Execution Metrics</div>
                        <h2 className="text-3xl md:text-6xl font-black text-white tracking-[-0.04em] leading-[0.9] mb-10 md:mb-12">
                            REVOLUTIONIZE <br />
                            <span className="text-slate-600">YOUR WORKFLOW</span>
                        </h2>
                        <div className="space-y-8 md:space-y-12">
                            {[
                                { label: "Task completion speed", pct: "78%" },
                                { label: "Focus duration increase", pct: "124%" },
                                { label: "Mental fatigue reduction", pct: "40%" }
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">
                                        <span>{stat.label}</span>
                                        <span className="text-cyan-400">{stat.pct}</span>
                                    </div>
                                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]" style={{ width: stat.pct }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:gap-8">
                        <div className="p-5 md:p-12 rounded-[2rem] md:rounded-[3.5rem] bg-white text-slate-950 flex flex-col justify-between aspect-square transition-transform hover:-rotate-2 shadow-2xl">
                            <Award size={24} className="md:size-[48px]" />
                            <div>
                                <div className="text-3xl md:text-6xl font-black italic tracking-tighter">98%</div>
                                <div className="text-[8px] md:text-xs font-black uppercase tracking-[0.2em] opacity-40">Satisfaction</div>
                            </div>
                        </div>
                        <div className="p-5 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border border-white/10 bg-slate-950/60 flex flex-col justify-between aspect-square transition-transform hover:rotate-2 shadow-2xl">
                            <Users size={24} className="text-violet-500 md:size-[48px]" />
                            <div>
                                <div className="text-3xl md:text-6xl font-black italic tracking-tighter">2K+</div>
                                <div className="text-[8px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-700">Elite Users</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="relative z-10 py-32 md:py-56 px-6 text-center border-t border-white/5">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl md:text-8xl font-black italic tracking-tight text-white mb-12 md:mb-16 uppercase leading-none">
                        EVOLVE <br />
                        <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">TODAY.</span>
                    </h2>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-4 md:gap-6 px-8 py-5 md:px-16 md:py-8 rounded-2xl md:rounded-[2.5rem] bg-white text-slate-950 font-black text-xl md:text-3xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
                    >
                        DOMINATE THE CLOCK <ChevronRight className="size-8 md:size-[48px]" strokeWidth={3} />
                    </Link>
                    <div className="mt-16 text-xs font-black text-slate-500 tracking-[0.5em] uppercase">Join 2,000+ High Achievers</div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="relative z-10 py-16 md:py-24 bg-slate-950 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Zap size={28} className="text-violet-500 fill-violet-500" />
                        </div>
                        <span className="text-3xl font-black tracking-tighter text-white">TANZI</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-[10px] md:text-xs font-black text-slate-600 tracking-[0.3em] uppercase">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">X / Twitter</a>
                    </div>
                    <div className="text-xs font-black text-slate-800 uppercase tracking-[0.4em]">
                        © 2026 TANZI PERFORMANCE SYSTEMS
                    </div>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
        html { scroll-behavior: smooth; }
      `}} />
        </div>
    );
}
