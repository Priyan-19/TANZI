import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useTask } from "./TaskContext";
import {
    startTaskReminders,
    stopTaskReminders,
    parseFreq,
    scheduleCheckInBatch,
    showBrowserNotification,
    dismissNotifications
} from "../services/notificationService";
import { Capacitor } from '@capacitor/core';
import { format } from "date-fns";

const TimerContext = createContext();

export function TimerProvider({ children }) {
    const { user } = useAuth();
    const { tasks } = useTask();
    const [countdown, setCountdown] = useState(0);
    const [isAlarmRinging, setIsAlarmRinging] = useState(false);

    const [isSleepMode, setIsSleepMode] = useState(() => localStorage.getItem("sleep_mode") === "true");
    const [sleepSchedule, setSleepSchedule] = useState(() => {
        const saved = localStorage.getItem("sleep_schedule");
        return saved ? JSON.parse(saved) : { start: "22:00", end: "07:00" };
    });

    const tasksRef = useRef(tasks);
    const userRef = useRef(user);

    useEffect(() => {
        tasksRef.current = tasks;
        userRef.current = user;
    }, [tasks, user]);

    // Persistence and schedule enforcement
    useEffect(() => {
        localStorage.setItem("sleep_mode", isSleepMode);
    }, [isSleepMode]);

    useEffect(() => {
        localStorage.setItem("sleep_schedule", JSON.stringify(sleepSchedule));
    }, [sleepSchedule]);

    // Auto-toggle sleep mode based on schedule
    useEffect(() => {
        const checkSchedule = () => {
            const now = new Date();
            const currentTime = format(now, "HH:mm");
            const { start, end } = sleepSchedule;

            const isCurrentInSleepRange = () => {
                if (start <= end) {
                    return currentTime >= start && currentTime < end;
                } else {
                    // Overlap midnight (e.g., 22:00 to 07:00)
                    return currentTime >= start || currentTime < end;
                }
            };

            const shouldBeSleep = isCurrentInSleepRange();
            if (shouldBeSleep && !isSleepMode) {
                setIsSleepMode(true);
            } else if (!shouldBeSleep && isSleepMode && localStorage.getItem("manual_sleep") !== "true") {
                // Only auto-off if it wasn't manual
                setIsSleepMode(false);
            }
        };

        const interval = setInterval(checkSchedule, 60000);
        checkSchedule();
        return () => clearInterval(interval);
    }, [sleepSchedule, isSleepMode]);

    // Handle high-level timer orchestration
    useEffect(() => {
        const savedEnabled = localStorage.getItem("notifs_enabled") !== "false";
        const savedFreq = localStorage.getItem("notif_frequency") || "1h"; // Dashboard defaults to 1h usually

        if (!user || !savedEnabled || savedFreq === "off") {
            stopTaskReminders();
            setCountdown(0);
            return;
        }

        const freqSeconds = parseFreq(savedFreq);
        const isGranted = Capacitor.isNativePlatform()
            ? savedEnabled
            : (typeof window !== "undefined" && window.Notification?.permission === "granted");

        if (isGranted && freqSeconds > 0) {
            const savedTarget = localStorage.getItem("next_checkin_at");
            let targetTime = parseInt(savedTarget);
            const now = Date.now();

            if (!targetTime || targetTime < now || targetTime > now + (freqSeconds * 1000)) {
                targetTime = now + (freqSeconds * 1000);
                localStorage.setItem("next_checkin_at", targetTime.toString());
            }

            scheduleCheckInBatch(targetTime, freqSeconds);

            const initialRemaining = Math.max(0, Math.floor((targetTime - now) / 1000));
            setCountdown(initialRemaining);

            if (!Capacitor.isNativePlatform()) {
                startTaskReminders(() => tasksRef.current, freqSeconds * 1000, () => userRef.current);
            }
        }

        return () => stopTaskReminders();
    }, [user]);

    // The actual 1-second ticker
    useEffect(() => {
        const ticker = setInterval(() => {
            if (isAlarmRinging) return;

            const targetTime = parseInt(localStorage.getItem("next_checkin_at") || "0");
            const now = Date.now();

            if (targetTime > 0) {
                const remaining = Math.max(0, Math.floor((targetTime - now) / 1000));

                if (remaining <= 0) {
                    // Suppress alarm if in sleep mode
                    if (isSleepMode) {
                        // Just reset for next interval silently
                        const savedFreq = localStorage.getItem("notif_frequency") || "1h";
                        resetTimer(savedFreq);
                        return;
                    }

                    if (!Capacitor.isNativePlatform()) {
                        showBrowserNotification("Are You Free..?", "Your check-in timer has finished. Time to review your tasks!");
                        setIsAlarmRinging(true);
                    }
                    setCountdown(0);
                } else {
                    setCountdown(remaining);
                }
            }
        }, 1000);

        return () => clearInterval(ticker);
    }, [isAlarmRinging, isSleepMode]);

    const resetTimer = (freq) => {
        const freqSeconds = parseFreq(freq);
        if (freqSeconds > 0) {
            const nextTarget = Date.now() + (freqSeconds * 1000);
            localStorage.setItem("next_checkin_at", nextTarget.toString());
            scheduleCheckInBatch(nextTarget, freqSeconds);
            setCountdown(freqSeconds);
        } else {
            setCountdown(0);
            localStorage.removeItem("next_checkin_at");
        }
    };

    const dismissAlarm = (freq) => {
        setIsAlarmRinging(false);
        dismissNotifications();
        resetTimer(freq);
    };

    const toggleSleepMode = (manual = true) => {
        setIsSleepMode(prev => {
            const newVal = !prev;
            if (manual) {
                if (newVal) localStorage.setItem("manual_sleep", "true");
                else localStorage.removeItem("manual_sleep");
            }
            return newVal;
        });
    };

    const updateSleepSchedule = (start, end) => {
        setSleepSchedule({ start, end });
    };

    return (
        <TimerContext.Provider value={{
            countdown,
            isAlarmRinging,
            setIsAlarmRinging,
            resetTimer,
            dismissAlarm,
            isSleepMode,
            sleepSchedule,
            toggleSleepMode,
            updateSleepSchedule
        }}>
            {children}
        </TimerContext.Provider>
    );
}

export const useTimer = () => useContext(TimerContext);
