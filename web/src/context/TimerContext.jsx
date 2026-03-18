import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useTask } from "./TaskContext";
import {
    startTaskReminders,
    stopTaskReminders,
    parseFreq,
    scheduleCheckInBatch,
    showBrowserNotification,
    showInAppNotification,
    dismissNotifications
} from "../services/notificationService";
import { Capacitor } from '@capacitor/core';
import { getSleepWindowStatus, normalizeTimeString } from "./sleepSchedule";

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

// ─── Sleep Boundary Notifications ───────────────────────────────────────────

async function notifySleepStart() {
    const isGranted = Capacitor.isNativePlatform()
        ? true
        : (typeof window !== "undefined" && window.Notification?.permission === "granted");

    if (!isGranted) return;

    await showBrowserNotification(
        "🌙 Sleep Mode Active",
        "Check-in reminders are now silenced. Rest well — TANZI will resume automatically when your routine ends.",
        { tag: "tanzi-sleep-start", requireInteraction: false }
    );

    // Also show in-app toast if visible - REMOVED AS PER USER REQUEST (PREFERS SYSTEM NOTIFS)
    // showInAppNotification("🌙 Sleep Mode On", "Check-ins silenced until morning. Good night!");
}

async function notifySleepEnd(freq) {
    const isGranted = Capacitor.isNativePlatform()
        ? true
        : (typeof window !== "undefined" && window.Notification?.permission === "granted");

    if (!isGranted) return;

    const freqLabel = freq && freq !== "off" ? `(every ${freq})` : "";
    await showBrowserNotification(
        "☀️ Good Morning — TANZI Active!",
        `Your sleep routine has ended. TANZI is back online!`,
        { tag: "tanzi-sleep-end", requireInteraction: false }
    );

    // Updated: Only system notification shown now
    // showInAppNotification("☀️ Wake-up Routine Started", `Routine resumed ${freqLabel}. Let's go!`);
}

async function notifyTimerStarted(freq) {
    const isGranted = Capacitor.isNativePlatform()
        ? true
        : (typeof window !== "undefined" && window.Notification?.permission === "granted");

    if (!isGranted) return;

    await showBrowserNotification(
        "🚀 Check-in Timer Started",
        `TANZI is now tracking your focus. Next check-in in ${freq}.`,
        { tag: "tanzi-timer-start", requireInteraction: false }
    );

    // Updated: Only system notification shown now
    // showInAppNotification("🚀 Timer Started", `Next check-in in ${freq}.`);
}

// ─── Context Provider ────────────────────────────────────────────────────────

export function TimerProvider({ children }) {
    const { user } = useAuth();
    const { tasks } = useTask();
    const [countdown, setCountdown] = useState(0);
    const [isAlarmRinging, setIsAlarmRinging] = useState(false);
    const [sleepSchedule, setSleepSchedule] = useState(() => {
        const saved = localStorage.getItem("sleep_schedule");
        const base = saved ? JSON.parse(saved) : { start: "22:00", end: "07:00" };
        return {
            start: normalizeTimeString(base.start),
            end: normalizeTimeString(base.end)
        };
    });
    const [isSleepMode, setIsSleepMode] = useState(() => {
        const saved = localStorage.getItem("sleep_schedule");
        const base = saved ? JSON.parse(saved) : { start: "22:00", end: "07:00" };
        const schedule = {
            start: normalizeTimeString(base.start),
            end: normalizeTimeString(base.end)
        };
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

    // Track the PREVIOUS sleep mode value to detect transitions
    const prevSleepModeRef = useRef(isSleepMode);

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

    // ─── Detect sleep mode TRANSITIONS and auto-resume timer ──────────────────
    useEffect(() => {
        const wasSleeping = prevSleepModeRef.current;
        const isNowSleeping = isSleepMode;
        prevSleepModeRef.current = isSleepMode;

        const savedEnabled = localStorage.getItem("notifs_enabled") !== "false";
        const savedFreq = localStorage.getItem("notif_frequency") || "1h";

        // Transition: Just ENTERED sleep mode
        if (!wasSleeping && isNowSleeping) {
            console.log("[TimerContext] Sleep mode STARTED — silencing notifications.");
            stopTaskReminders();
            if (Capacitor.isNativePlatform()) {
                dismissNotifications();
            }
            if (savedEnabled && savedFreq !== "off") {
                notifySleepStart();
            }
            return;
        }

        // Transition: Just EXITED sleep mode → auto-resume check-in timer
        if (wasSleeping && !isNowSleeping) {
            console.log("[TimerContext] Sleep mode ENDED — auto-resuming check-in timer.");

            if (!user || !savedEnabled || savedFreq === "off") {
                console.log("[TimerContext] Notifications disabled or no user. Skipping resume.");
                return;
            }

            const freqSeconds = parseFreq(savedFreq);
            if (freqSeconds <= 0) return;

            // Reset the timer to start fresh from wake-up time
            const nextTarget = Date.now() + (freqSeconds * 1000);
            localStorage.setItem("next_checkin_at", nextTarget.toString());
            setCountdown(freqSeconds);

            // Schedule OS-level notifications immediately, including the sleep schedule
            // This ensures future check-ins skip the NEXT night too.
            scheduleCheckInBatch(nextTarget, freqSeconds, sleepSchedule).then(() => {
                console.log("[TimerContext] OS check-in batch re-scheduled after sleep end.");
            });

            // For web, restart the in-browser task reminder loop
            if (!Capacitor.isNativePlatform()) {
                startTaskReminders(
                    () => tasksRef.current,
                    freqSeconds * 1000,
                    () => userRef.current
                );
            }

            // In-app wake-up notification
            notifySleepEnd(savedFreq);
            notifyTimerStarted(savedFreq);
        }
    }, [isSleepMode, user, sleepSchedule]);

    // ─── Handle high-level timer orchestration and Native Notification Sync ──
    useEffect(() => {
        const syncNotifications = async () => {
            const savedEnabled = localStorage.getItem("notifs_enabled") !== "false";
            const savedFreq = localStorage.getItem("notif_frequency") || "1h";

            if (!user || !savedEnabled || savedFreq === "off") {
                stopTaskReminders();
                setCountdown(0);
                if (Capacitor.isNativePlatform()) await dismissNotifications(true);
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
                // We pass the sleepSchedule so the OS-level batch knows when to be silent.
                // WE NOW DO THIS EVEN IN SLEEP MODE to ensure wake-up boundaries are set.
                await scheduleCheckInBatch(targetTime, freqSeconds, sleepSchedule);

                if (isSleepMode) {
                    // If in sleep mode locally, we still set the countdown but don't start the browser interval
                    const initialRemaining = Math.max(0, Math.floor((targetTime - now) / 1000));
                    setCountdown(initialRemaining);
                    stopTaskReminders();
                    return;
                }

                const initialRemaining = Math.max(0, Math.floor((targetTime - now) / 1000));
                setCountdown(initialRemaining);

                if (!Capacitor.isNativePlatform()) {
                    startTaskReminders(() => tasksRef.current, freqSeconds * 1000, () => userRef.current);
                }
            }
        };

        syncNotifications();
        return () => stopTaskReminders();
    }, [user, isSleepMode, sleepSchedule]);

    const resetTimer = useCallback((freq) => {
        const freqSeconds = parseFreq(freq);
        if (freqSeconds > 0) {
            const nextTarget = Date.now() + (freqSeconds * 1000);
            localStorage.setItem("next_checkin_at", nextTarget.toString());
            setCountdown(freqSeconds);

            // Only schedule with OS if NOT in sleep mode
            if (!isSleepMode) {
                scheduleCheckInBatch(nextTarget, freqSeconds, sleepSchedule);
            }
        } else {
            setCountdown(0);
            localStorage.removeItem("next_checkin_at");
            if (Capacitor.isNativePlatform()) dismissNotifications(true);
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
                        const savedFreq = localStorage.getItem("notif_frequency") || "1h";
                        resetTimer(savedFreq);
                        return;
                    }

                    if (!Capacitor.isNativePlatform()) {
                        showBrowserNotification("Are You Free..?", "Your check-in timer has finished. Time to review your tasks!");

                        // Only trigger full-screen alarm on desktop
                        if (window.innerWidth >= 768) {
                            setIsAlarmRinging(true);
                        } else {
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
