// src/pages/Landing.jsx
import { Link } from "react-router-dom";
import { Zap, CheckCircle2, BarChart3, Clock, Rocket, Shield, Github, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-violet-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 border-b border-slate-800/50 backdrop-blur-md sticky top-0">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                            <Zap size={18} className="text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                            TANZI
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link to="/app" className="px-5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors">
                                    Login
                                </Link>
                                <Link to="/login" className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity hidden sm:block">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-16 px-4 text-center">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-6 animate-fade-in">
                        <Rocket size={14} />
                        <span>Introducing v1.0 of TANZI</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                        Master your time with <br />
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                            Intelligent Analytics
                        </span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                        Organize your tasks, track your progress, and optimize your productivity with our beautiful, intuitive mobile-first dashboard.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/20 transition-all">
                            Start Building Now
                            <ArrowRight size={20} />
                        </Link>
                        <button className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-bold text-lg transition-all">
                            Live Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="relative z-10 py-20 px-4 bg-slate-950/50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={CheckCircle2}
                            title="Seamless Tasking"
                            desc="Manage your daily todos with an interface that feels fast and responsive on any device."
                            color="text-emerald-400"
                            bg="bg-emerald-400/10"
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Smart Analytics"
                            desc="Visualize your productivity trends with interactive charts and weekly insights."
                            color="text-violet-400"
                            bg="bg-violet-400/10"
                        />
                        <FeatureCard
                            icon={Clock}
                            title="Pomodoro Timer"
                            desc="Stay focused with built-in productivity tools designed to eliminate distractions."
                            color="text-cyan-400"
                            bg="bg-cyan-400/10"
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 px-4 border-t border-slate-900">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Zap size={20} className="text-violet-500" />
                        <span className="font-bold text-slate-200">TANZI</span>
                    </div>
                    <p className="text-slate-500 text-sm">
                        © 2026 TANZI. Crafted for productivity.
                    </p>
                    <div className="flex items-center gap-4 text-slate-400">
                        <Github size={20} className="hover:text-white cursor-pointer transition-colors" />
                        <Shield size={20} className="hover:text-white cursor-pointer transition-colors" />
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc, color, bg }) {
    return (
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 transition-all group">
            <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center ${color} mb-6 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">{title}</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
                {desc}
            </p>
        </div>
    );
}
