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
            <div className={`flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-[0.12em] px-3.5 py-3 rounded-2xl border transition-all duration-300
        ${countdown === 0 ? "text-white bg-accent-500 border-accent-500 shadow-accent-500/20" : "text-accent-500 bg-accent-500/5 border-accent-500/10 shadow-accent-500/5"}
      `}>
                <Clock size={14} strokeWidth={3} className={countdown === 0 ? "text-white animate-pulse" : "text-accent-500 flex-shrink-0"} />
                <span className="whitespace-nowrap">
                    {countdown === 0 ? "Check-in Now!" : `Next Check-in: ${formatCountdown(countdown)}`}
                </span>
            </div>
        );
    }

    return (
        <div className="mb-3 flex items-center gap-3 text-sm font-black text-primary-600 uppercase tracking-[0.15em] bg-primary-600/5 p-3.5 rounded-2xl border border-primary-600/10 shadow-lg shadow-primary-600/5 transition-all">
            <Clock size={16} strokeWidth={3} className="text-primary-600" />
            <span className="whitespace-nowrap">Next Check-in: {formatCountdown(countdown)}</span>
        </div>
    );
};

export default React.memo(CountdownDisplay);
