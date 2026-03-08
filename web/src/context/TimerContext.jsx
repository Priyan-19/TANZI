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

    // --- Enhanced Auto-toggle logic with manual override support ---
    const lastAutoStateRef = useRef(null);

    useEffect(() => {
        const checkSchedule = () => {
            const now = new Date();
            const currentTime = format(now, "HH:mm");
            const { start, end } = sleepSchedule;

            const isCurrentInSleepRange = () => {
                if (start <= end) {
                    return currentTime >= start && currentTime < end;
                } else {
                    return currentTime >= start || currentTime < end;
                }
            };

            const shouldBeSleep = isCurrentInSleepRange();

            // Only auto-trigger when we transition into or out of the sleep window
            if (lastAutoStateRef.current !== null && lastAutoStateRef.current !== shouldBeSleep) {
                setIsSleepMode(shouldBeSleep);
                localStorage.removeItem("manual_sleep"); // Reset manual override on transitions
            } else if (lastAutoStateRef.current === null) {
                // Initial load: set state if no manual override exists
                if (localStorage.getItem("manual_sleep") !== "true") {
                    setIsSleepMode(shouldBeSleep);
                }
            }

            lastAutoStateRef.current = shouldBeSleep;
        };

        const interval = setInterval(checkSchedule, 10000); // Check more frequently for better responsiveness
        checkSchedule();
        return () => clearInterval(interval);
    }, [sleepSchedule]); // Removed isSleepMode from deps to prevent re-triggering auto-eval on manual toggle

    // Handle high-level timer orchestration and Native Notification Sync
    useEffect(() => {
        const syncNotifications = async () => {
            const savedEnabled = localStorage.getItem("notifs_enabled") !== "false";
            const savedFreq = localStorage.getItem("notif_frequency") || "1h";

            if (!user || !savedEnabled || savedFreq === "off") {
                stopTaskReminders();
                setCountdown(0);
                if (Capacitor.isNativePlatform()) await dismissNotifications();
                return;
            }

            if (isSleepMode) {
                // Important: On mobile, we MUST cancel pending OS notifications when entering sleep mode
                if (Capacitor.isNativePlatform()) await dismissNotifications();
                // We keep the internal countdown running but won't beep
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

                // If target is invalid or expired, set a new one
                if (!targetTime || targetTime < now || targetTime > now + (freqSeconds * 1000)) {
                    targetTime = now + (freqSeconds * 1000);
                    localStorage.setItem("next_checkin_at", targetTime.toString());
                }

                // Schedule with OS - this will clear old ones and add new ones
                await scheduleCheckInBatch(targetTime, freqSeconds);

                const initialRemaining = Math.max(0, Math.floor((targetTime - now) / 1000));
                setCountdown(initialRemaining);

                if (!Capacitor.isNativePlatform()) {
                    startTaskReminders(() => tasksRef.current, freqSeconds * 1000, () => userRef.current);
                }
            }
        };

        syncNotifications();
        return () => stopTaskReminders();
    }, [user, isSleepMode]); // Added isSleepMode to sync notifications when it toggles

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

                        // User doesn't want the intrusive pop on mobile web. 
                        // Only trigger full-screen alarm on desktop screens.
                        if (window.innerWidth >= 768) {
                            setIsAlarmRinging(true);
                        } else {
                            // On mobile web, just reset for next interval
                            const savedFreq = localStorage.getItem("notif_frequency") || "1h";
                            resetTimer(savedFreq);
                        }
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
            setCountdown(freqSeconds);

            // Only schedule with OS if NOT in sleep mode
            if (!isSleepMode) {
                scheduleCheckInBatch(nextTarget, freqSeconds);
            }
        } else {
            setCountdown(0);
            localStorage.removeItem("next_checkin_at");
            if (Capacitor.isNativePlatform()) dismissNotifications();
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
