import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * A premium circular 12-hour time picker component.
 * Features a single outer ring (1-12) as requested.
 */
export default function TimePicker({ initialTime, onSave, onClose }) {
  // initialTime is "HH:MM" 24h format
  const [hours, setHours] = useState(() => {
    const h = parseInt(initialTime.split(":")[0]);
    let displayH = h % 12;
    return displayH === 0 ? 12 : displayH;
  });
  const [minutes, setMinutes] = useState(parseInt(initialTime.split(":")[1]));
  const [meridiem, setMeridiem] = useState(parseInt(initialTime.split(":")[0]) >= 12 ? "PM" : "AM");
  const [mode, setMode] = useState("hours"); // "hours" or "minutes"

  const handleSave = () => {
    let finalHours = hours % 12;
    if (meridiem === "PM") finalHours += 12;
    const timeString = `${String(finalHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    onSave(timeString);
  };

  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const renderClockFace = () => {
    const isHours = mode === "hours";
    const values = isHours ? hourNumbers : minuteNumbers;
    const currentVal = isHours ? hours : minutes;

    return (
      <div className="relative w-64 h-64 bg-slate-100 rounded-full mx-auto my-8 shadow-inner border border-slate-200/50">
        {/* Center pivot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary-600 rounded-full z-20" />
        
        {/* Hand indicator */}
        <div 
          className="absolute top-1/2 left-1/2 origin-bottom w-1 bg-primary-600/30 transition-all duration-300 rounded-full z-10"
          style={{ 
            height: '90px', 
            transform: `translate(-50%, -100%) rotate(${((values.indexOf(currentVal)) * 30)}deg)` 
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary-600/30">
             {isHours ? currentVal : String(currentVal).padStart(2, "0")}
          </div>
        </div>

        {/* Numbers */}
        {values.map((val, i) => {
          const angle = (i * 30) - 90; // Start at top
          const radius = 100; // px
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          const isSelected = currentVal === val;

          return (
            <button
              key={val}
              onClick={() => {
                if (isHours) {
                  setHours(val);
                  setTimeout(() => setMode("minutes"), 300);
                } else {
                  setMinutes(val);
                }
              }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all
                ${isSelected ? "text-transparent" : "text-slate-500 hover:text-primary-600 hover:bg-white"}
              `}
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
            >
              {isHours ? val : String(val).padStart(2, "0")}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-scale-in border border-slate-200">
        {/* Darker Header section */}
        <div className="bg-primary-600 p-8 text-white flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Set Time</span>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-baseline gap-2">
            <button 
              onClick={() => setMode("hours")}
              className={`text-5xl font-black transition-opacity ${mode === "hours" ? "opacity-100" : "opacity-40"}`}
            >
              {hours}
            </button>
            <span className="text-5xl font-black opacity-40">:</span>
            <button 
              onClick={() => setMode("minutes")}
              className={`text-5xl font-black transition-opacity ${mode === "minutes" ? "opacity-100" : "opacity-40"}`}
            >
              {String(minutes).padStart(2, "0")}
            </button>
            
            <div className="flex flex-col ml-4 gap-1">
              <button 
                onClick={() => setMeridiem("AM")}
                className={`text-xs font-black px-3 py-1.5 rounded-lg border transition-all ${meridiem === "AM" ? "bg-white text-primary-600 border-white" : "border-white/20 text-white opacity-50"}`}
              >
                AM
              </button>
              <button 
                onClick={() => setMeridiem("PM")}
                className={`text-xs font-black px-3 py-1.5 rounded-lg border transition-all ${meridiem === "PM" ? "bg-white text-primary-600 border-white" : "border-white/20 text-white opacity-50"}`}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        {/* Dial Section */}
        <div className="p-4 bg-white">
          <div className="flex justify-center gap-12 mt-4">
             <button 
              onClick={() => setMode("hours")}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${mode === "hours" ? "border-primary-600 text-primary-600" : "border-transparent text-slate-400"}`}
             >
                Hours
             </button>
             <button 
              onClick={() => setMode("minutes")}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${mode === "minutes" ? "border-primary-600 text-primary-600" : "border-transparent text-slate-400"}`}
             >
                Minutes
             </button>
          </div>

          {renderClockFace()}

          <div className="flex gap-3 px-4 pb-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-4 bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
            >
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
