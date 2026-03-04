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

const TimerContext = createContext();

export function TimerProvider({ children }) {
    const { user } = useAuth();
    const { tasks } = useTask();
    const [countdown, setCountdown] = useState(0);
    const [isAlarmRinging, setIsAlarmRinging] = useState(false);

    const tasksRef = useRef(tasks);
    const userRef = useRef(user);

    useEffect(() => {
        tasksRef.current = tasks;
        userRef.current = user;
    }, [tasks, user]);

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
    }, [isAlarmRinging]);

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

    return (
        <TimerContext.Provider value={{
            countdown,
            isAlarmRinging,
            setIsAlarmRinging,
            resetTimer,
            dismissAlarm
        }}>
            {children}
        </TimerContext.Provider>
    );
}

export const useTimer = () => useContext(TimerContext);
