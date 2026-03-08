import React from 'react';

export default function ColorTest() {
    return (
        <div className="min-h-screen bg-primary-50 p-8 text-primary-700 font-sans">
            <div className="max-w-4xl mx-auto space-y-12">
                <header className="border-b border-primary-600/10 pb-6">
                    <h1 className="text-4xl font-black text-primary-600 mb-2">Color Combination Test</h1>
                    <p className="text-primary-600/70">A playground to test the Emerald Obsidian theme colors.</p>
                </header>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold border-l-4 border-accent-500 pl-4">Color Palette</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="flex flex-col rounded-2xl overflow-hidden glass-card">
                            <div className="bg-primary-50 h-24 w-full flex items-end p-3"><span className="text-primary-600 font-mono text-xs">primary-50</span></div>
                        </div>
                        <div className="flex flex-col rounded-2xl overflow-hidden glass-card">
                            <div className="bg-primary-600 h-24 w-full flex items-end p-3"><span className="text-white font-mono text-xs">primary-600</span></div>
                        </div>
                        <div className="flex flex-col rounded-2xl overflow-hidden glass-card">
                            <div className="bg-primary-700 h-24 w-full flex items-end p-3"><span className="text-white font-mono text-xs">primary-700</span></div>
                        </div>
                        <div className="flex flex-col rounded-2xl overflow-hidden glass-card">
                            <div className="bg-accent-500 h-24 w-full flex items-end p-3"><span className="text-white font-mono text-xs">accent-500</span></div>
                        </div>
                        <div className="flex flex-col rounded-2xl overflow-hidden glass-card">
                            <div className="bg-accent-100 h-24 w-full flex items-end p-3"><span className="text-primary-600 font-mono text-xs">accent-100</span></div>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold border-l-4 border-accent-500 pl-4">Text & Background Checks</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Dark mode look card (Obsidian) */}
                        <div className="bg-primary-600 rounded-3xl p-8 shadow-xl shadow-primary-600/20 text-white space-y-4">
                            <h3 className="text-xl font-black text-accent-500 text-center">Obsidian Background</h3>
                            <p className="text-primary-50">
                                This simulates a primary dark card. White/primary-50 text on primary-600.
                            </p>
                            <div className="bg-primary-700 rounded-2xl p-4 border border-white/5 space-y-2">
                                <p className="text-sm text-accent-500 font-mono">Nested Primary-700</p>
                                <div className="text-xs text-white/70">With slightly dimmer text for hierarchy.</div>
                            </div>
                            <button className="w-full bg-accent-500 text-white py-3 rounded-2xl font-bold hover:bg-accent-500/90 transition-colors shadow-lg shadow-accent-500/20">
                                Accent Action
                            </button>
                        </div>

                        {/* Light mode look card (Moss / Light) */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 text-primary-600 border border-slate-100 space-y-4">
                            <h3 className="text-xl font-black text-primary-600 text-center">Light / Glass Background</h3>
                            <p className="text-primary-600/80">
                                This simulates a standard light card. Dark text on white background.
                            </p>
                            <div className="bg-accent-100 rounded-2xl p-4 border border-accent-500/20 space-y-2">
                                <p className="text-sm text-accent-500 font-mono font-bold">Nested Accent-100</p>
                                <div className="text-xs text-primary-700/70">Using light moss to highlight areas gently.</div>
                            </div>
                            <button className="w-full bg-primary-600 text-white py-3 rounded-2xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                                Primary Action
                            </button>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold border-l-4 border-accent-500 pl-4">Interactive Elements</h2>
                    <div className="flex flex-wrap gap-4 items-center">
                        <button className="px-6 py-3 bg-accent-500 text-white rounded-full font-bold shadow-lg shadow-accent-500/20 hover:scale-105 active:scale-95 transition-all">
                            Rounded Accent
                        </button>
                        <button className="px-6 py-3 bg-primary-600 text-white rounded-full font-bold shadow-lg shadow-primary-600/20 hover:scale-105 active:scale-95 transition-all">
                            Rounded Primary
                        </button>
                        <button className="px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-full font-bold hover:bg-primary-50 active:scale-95 transition-all">
                            Outline Primary
                        </button>
                        <button className="px-6 py-3 bg-accent-100 text-accent-500 rounded-full font-bold hover:bg-accent-500 hover:text-white transition-all">
                            Soft Accent
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
