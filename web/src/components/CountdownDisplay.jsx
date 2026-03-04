import React from "react";
import { Clock } from "lucide-react";
import { useTimer } from "../context/TimerContext";

const formatCountdown = (seconds) => {
    if (seconds <= 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const CountdownDisplay = ({ mobile = false }) => {
    const { countdown, isAlarmRinging } = useTimer();

    if (!countdown && !isAlarmRinging) return null;

    if (mobile) {
        return (
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] px-3.5 py-3 rounded-2xl border transition-all duration-300
        ${countdown === 0 ? "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10" : "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/10"}
      `}>
                <Clock size={14} strokeWidth={3} className={countdown === 0 ? "text-amber-500 animate-pulse" : "text-cyan-500 flex-shrink-0"} />
                <span className="drop-shadow-sm whitespace-nowrap">
                    {countdown === 0 ? "Check-in Now!" : `Next Check-in: ${formatCountdown(countdown)}`}
                </span>
            </div>
        );
    }

    return (
        <div className="mb-3 flex items-center gap-3 text-sm font-black text-cyan-400 uppercase tracking-[0.15em] bg-cyan-500/10 p-3.5 rounded-2xl border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur-md transition-all">
            <Clock size={16} strokeWidth={3} className="text-cyan-500" />
            <span className="drop-shadow-sm whitespace-nowrap">Next Check-in: {formatCountdown(countdown)}</span>
        </div>
    );
};

export default React.memo(CountdownDisplay);
