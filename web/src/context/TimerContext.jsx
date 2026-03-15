import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
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
import { getSleepWindowStatus } from "./sleepSchedule";

const TimerContext = createContext();
const SLEEP_OVERRIDE_KEY = "sleep_override";

function readSleepOverride() {
    try {
        const saved = localStorage.getItem(SLEEP_OVERRIDE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        localStorage.removeItem(SLEEP_OVERRIDE_KEY);
        return null;
    }
}

export function TimerProvider({ children }) {
    const { user } = useAuth();
    const { tasks } = useTask();
    const [countdown, setCountdown] = useState(0);
    const [isAlarmRinging, setIsAlarmRinging] = useState(false);
    const [sleepSchedule, setSleepSchedule] = useState(() => {
        const saved = localStorage.getItem("sleep_schedule");
        return saved ? JSON.parse(saved) : { start: "22:00", end: "07:00" };
    });
    const [isSleepMode, setIsSleepMode] = useState(() => {
        const schedule = (() => {
            const saved = localStorage.getItem("sleep_schedule");
            return saved ? JSON.parse(saved) : { start: "22:00", end: "07:00" };
        })();
        const override = readSleepOverride();
        const status = getSleepWindowStatus(schedule, new Date());

        if (override?.expiresAt && Date.now() < override.expiresAt) {
            return Boolean(override.enabled);
        }

        return status.isInSleepWindow;
    });

    const tasksRef = useRef(tasks);
    const userRef = useRef(user);
    const sleepBoundaryTimeoutRef = useRef(null);

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

    const clearSleepBoundaryTimeout = useCallback(() => {
        if (sleepBoundaryTimeoutRef.current) {
            clearTimeout(sleepBoundaryTimeoutRef.current);
            sleepBoundaryTimeoutRef.current = null;
        }
    }, []);

    const evaluateSleepMode = useCallback(() => {
        const now = new Date();
        const status = getSleepWindowStatus(sleepSchedule, now);
        const override = readSleepOverride();

        let nextSleepMode = status.isInSleepWindow;

        if (override?.expiresAt && now.getTime() < override.expiresAt) {
            nextSleepMode = override.enabled;
        } else if (override) {
            localStorage.removeItem(SLEEP_OVERRIDE_KEY);
        }

        setIsSleepMode((current) => (current === nextSleepMode ? current : nextSleepMode));
        return status;
    }, [sleepSchedule]);

    const scheduleSleepBoundarySync = useCallback((status) => {
        clearSleepBoundaryTimeout();

        if (!status?.nextBoundaryAt) {
            return;
        }

        const delay = status.nextBoundaryAt.getTime() - Date.now();

        if (delay <= 0) {
            sleepBoundaryTimeoutRef.current = setTimeout(() => {
                evaluateSleepMode();
            }, 0);
            return;
        }

        sleepBoundaryTimeoutRef.current = setTimeout(() => {
            evaluateSleepMode();
        }, delay + 250);
    }, [clearSleepBoundaryTimeout, evaluateSleepMode]);

    useEffect(() => {
        const syncSleepMode = () => {
            const status = evaluateSleepMode();
            scheduleSleepBoundarySync(status);
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                syncSleepMode();
            }
        };

        const interval = setInterval(syncSleepMode, 10000);
        syncSleepMode();
        window.addEventListener("focus", syncSleepMode);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(interval);
            clearSleepBoundaryTimeout();
            window.removeEventListener("focus", syncSleepMode);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [clearSleepBoundaryTimeout, evaluateSleepMode, scheduleSleepBoundarySync]);

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

    const resetTimer = useCallback((freq) => {
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
    }, [isSleepMode]);

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
    }, [isAlarmRinging, isSleepMode, resetTimer]);

    const dismissAlarm = (freq) => {
        setIsAlarmRinging(false);
        dismissNotifications();
        resetTimer(freq);
    };

    const toggleSleepMode = (manual = true) => {
        setIsSleepMode((prev) => {
            const newVal = !prev;

            if (manual) {
                const { nextBoundaryAt } = getSleepWindowStatus(sleepSchedule, new Date());
                if (nextBoundaryAt) {
                    localStorage.setItem(SLEEP_OVERRIDE_KEY, JSON.stringify({
                        enabled: newVal,
                        expiresAt: nextBoundaryAt.getTime(),
                    }));
                } else {
                    localStorage.removeItem(SLEEP_OVERRIDE_KEY);
                }
            }

            return newVal;
        });
    };

    const updateSleepSchedule = (start, end) => {
        localStorage.removeItem(SLEEP_OVERRIDE_KEY);
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
