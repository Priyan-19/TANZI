# TANZI: The Future of Time Management 🚀

TANZI is a high-performance productivity and time management ecosystem designed for high achievers who want to dominate their schedule. It combines elite task tracking, deep focus tools, and advanced analytics into a seamless, cross-platform experience.

---

## 📌 Project Overview

- **Project Name**: TANZI (Performance Systems)
- **Purpose**: To provide a unified platform for orchestration of tasks, focus sessions, and productivity insights.
- **Problem it Solves**:
    - Fragmented productivity tools (timer in one app, tasks in another).
    - Lack of data-driven insights into where time is spent.
    - Difficulty maintaining consistency (streaks) and focus.
    - Notification fatigue (solved through smart, context-aware reminders and sleep routines).
- **Target Users**: Professional software engineers, students, high-performance teams, and anyone looking to optimize their daily output.

---


## 🛠️ Tech Stack Explanation

### **Core Frontend**
- **React 18 (Vite)**: Selected for its lightning-fast development cycle and component-based architecture.
- **Tailwind CSS**: Custom utility-first styling for a premium, high-fidelity UI (Bento-grid layouts, glassmorphism, micro-animations).

### **Backend & Services**
- **Firebase Auth**: Secure, multi-method authentication (Email/Password & Native Google Auth).
- **Firestore**: Real-time NoSQL database used for live task syncing, user profiles, and analytics reports. Uses `persistentLocalCache` for offline support.
- **Firebase Cloud Functions (TypeScript)**: Serverless backend for scheduled notification jobs, streak updates, and data aggregation (runs every 15 minutes via Pub/Sub).

### **Mobile & Cross-Platform**
- **Capacitor v8**: Turns the web application into a high-performance native app for Android and iOS.
- **Capacitor Plugins**:
    - `@capacitor/local-notifications`: For OS-level reminders that work even when the app is fully closed (killed by OS).
    - `@capacitor/push-notifications`: For FCM-based cloud messaging.
    - `@codetrix-studio/capacitor-google-auth`: For native "One-Tap" Google sign-in.

### **Background Execution (Web)**
- **Service Worker** (`firebase-messaging-sw.js`): Handles FCM background messages AND sleep boundary scheduling via `postMessage` API. Sends a `SLEEP_ENDED` event to app clients when the sleep window ends. Uses robust 12h/24h parsing for consistency.
- **Web Notification API**: Browser-native alerts for check-in reminders. Supports 12-hour format display.

### **Utilities & Visualization**
- **Recharts**: For high-quality, interactive data visualization (Line charts, Bar charts).
- **Date-fns**: Robust date manipulation for analytics and sleep scheduling.
- **React Hot Toast**: For smooth, non-intrusive UI feedback.
- **Vitest**: Unit and integration testing for mission-critical services.

---

## 📂 Project Structure

```text
d:\TANZI
├── web/                      # Core Web Application
│   ├── src/
│   │   ├── components/       # Reusable UI elements (PomodoroTimer, TaskModal, CountdownDisplay)
│   │   ├── context/          # Global State (Auth, Tasks, Timer, Theme)
│   │   │   └── sleepSchedule.js   # Sleep window math & 24h normalization utility
│   │   ├── firebase/         # SDK Configuration
│   │   ├── layouts/          # Main UI shell (Sidebar, Mobile Bottom Bar, 12h Sleep Settings)
│   │   ├── pages/            # View-level components (Dashboard, Tasks, Analytics, Landing)
│   │   └── services/         # Business Logic (Notifications, Analytics Engine)
│   ├── functions/            # Backend Cloud Functions (Node.js/TypeScript)
│   ├── android/              # Native Android wrapper (Capacitor)
│   ├── ios/                  # Native iOS wrapper (Capacitor)
│   ├── public/
│   │   └── firebase-messaging-sw.js   # Service Worker for background tasks
│   ├── capacitor.config.json # Cross-platform native settings
│   └── vite.config.js        # Build & Plugin configuration
```

---

## 📄 File-by-File Breakdown (Core `src`)

### **Contexts (State Management)**

| File | Purpose |
|---|---|
| `AuthContext.jsx` | Login/logout, Google auth (web + native), Firestore profile sync |
| `TaskContext.jsx` | Real-time Firestore tasks, CRUD, "Task Recycling" (rolls over uncompleted tasks daily) |
| `TimerContext.jsx` | Countdown engine, sleep mode state machine, auto-resume on sleep-end, boundary notifications |
| `ThemeContext.jsx` | Light/dark mode preference (currently locked to light) |
| `sleepSchedule.js` | Pure math library: `parseClockTime`, `normalizeTimeString`, `getSleepWindowStatus`, `formatClockTime` (12h) |

### **Services (Business Logic)**

| File | Purpose |
|---|---|
| `notificationService.jsx` | Unified FCM + Browser + native Local Notification dispatch; Smart Reminders; sleep start/end notifications |
| `analyticsService.js` | Daily/weekly/monthly report generation and aggregation engine |

### **Layouts & Pages**

| File | Purpose |
|---|---|
| `Layout.jsx` | App shell with nav, sleep settings modal, SW message handler (SLEEP_ENDED listener), SW alarm registration |
| `Dashboard.jsx` | Today's task overview, stats, Pomodoro launcher |
| `Tasks.jsx` | Full CRUD with time-range filter (Today / Week / Month) |
| `Analytics.jsx` | Visual performance data (Recharts) |
| `Landing.jsx` | High-conversion marketing page with bento cards |

### **Backend (Cloud Functions)**

| Function | Trigger | Purpose |
|---|---|---|
| `sendHourlyNotifications` | Pub/Sub (every 15 min, 8 AM–10 PM) | FCM push to users with pending tasks (respects `busyUntil`) |
| `generateDailyReports` | Cron (11:59 PM) | Aggregate daily task stats into `dailyReports` collection |
| `updateStreak` | Firestore `tasks/{taskId}` update | Increment/reset streak on task completion |
| `handleBusyResponse` | HTTPS Callable | Mark user busy for 1 hour |
| `getPendingTasksForUser` | HTTPS Callable | Return today's pending tasks |

---

## 🔄 Application Workflow

1. **Entry Point**: `main.jsx` initializes native listeners and mounts `App.jsx`.
2. **Authentication**: `AuthContext` checks for an existing Firebase session via `onAuthStateChanged`. If none, shows `Landing.jsx` or redirects to `Login.jsx`.
3. **App Load**:
    - `TaskContext` starts a real-time Firestore `onSnapshot` listener.
    - `TimerContext` reads saved settings (`notif_frequency`, `sleep_schedule`) and starts the countdown.
    - `Layout.jsx` registers a SW message listener for `SLEEP_ENDED` events.
4. **Sleep Cycle (Automated)**:
    - At sleep-start boundary: `TimerContext` detects the transition → stops reminders → sends sleep-start notification → posts `SCHEDULE_SLEEP_END_WAKEUP` to Service Worker.
    - Service Worker runs a `setTimeout` to fire at the sleep-end boundary.
    - At sleep-end: SW sends `SLEEP_ENDED` message → `Layout.jsx` receives it → calls `resetTimer()` → check-in notifications resume **without user opening the app**.
5. **Operational Cycle**:
    - User adds tasks in `Tasks.jsx`.
    - User starts focus sessions via `PomodoroTimer.jsx`.
    - Every 15–60 mins (customizable), the app triggers a "Check-in" alarm.
    - On task completion: `completeTask()` → updates Firestore → `updateStreak()` → `generateDailyReport()`.
6. **Synchronization**: Real-time Firestore `onSnapshot` + Context hooks propagate all changes immediately.

---

## ✨ Key Features

- **Smart Check-ins**: Context-aware notifications that ask "Are you Free?" and allow the user to mark themselves as "Busy" for 1 hour.
- **Sleep Routine (Fully Automated)**: Define a sleep window. Sleep mode starts and ends automatically, sending notifications at both transitions even if the app is closed (via OS-level scheduling). Check-in timer resumes automatically after sleep ends.
- **12-Hour Time Support**: UI and notifications now use a user-friendly 12-hour format with AM/PM selection, while maintaining internal 24-hour normalization to prevent the "12:00 AM triggers at noon" bug.
- **Task Recycling**: Never lose track of a task; "General" tasks auto-forward until completed.
- **Productivity Scoring**: Algorithmic evaluation based on 7-day completion rates.
- **Multi-Platform**: Works as a Progressive Web App (PWA) OR a native Android/iOS app via Capacitor.
- **Background Service Worker Alarm**: Even when the web app tab is closed, the SW can detect when sleep ends and notify + resume timer.

---

## 🏛️ Architecture & Design Patterns

- **Provider Pattern**: React Context for shared state (`useAuth`, `useTask`, `useTimer`).
- **Observer Pattern**: Firestore `onSnapshot` for real-time data streams.
- **State Machine (Sleep Mode)**: `TimerContext` tracks `prevSleepModeRef` to detect enter/exit sleep transitions and react with correct side effects.
- **Serverless Architecture**: Heavy computation offloaded to Firebase Cloud Functions.
- **Service Worker Messaging**: `postMessage` bi-directional channel between app and SW for background sleep scheduling.

---

## ⚙️ Setup & Installation Guide

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/Priyan-19/TANZI.git
    cd TANZI/web
    ```
2. **Install Dependencies**:
    ```bash
    npm install
    ```
3. **Environment Variables**:
    Create a `.env.local` based on `.env.example`:
    ```env
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    VITE_FIREBASE_VAPID_KEY=...
    ```
4. **Run Development Server**:
    ```bash
    npm run dev
    ```
5. **Run Tests**:
    ```bash
    npm run test
    ```
6. **Build for Mobile** (Optional):
    ```bash
    npm run build
    npx cap sync android
    npx cap open android
    ```

---

## 🐛 Known Bugs Fixed (v1.1)

| Bug | Root Cause | Fix Applied |
|---|---|---|
| Sleep at 12:00 AM fires at noon | `"12:00"` parsed as 720 min (noon) not 0 min | Added `normalizeTimeString()` with explicit AM/PM awareness & 12h UI |
| Timer doesn't resume after sleep | No transition detection on `isSleepMode` state | Added `prevSleepModeRef` + auto-resume effect in `TimerContext` |
| No sleep start/end notification | Missing notification calls at boundaries | Added `notifySleepStart()` / `notifySleepEnd()` and pre-scheduling |
| Timer needs app open to start | No background execution path | Added SW `SCHEDULE_SLEEP_END_WAKEUP` + OS Local Notifications pre-scheduling |
| Check-in timer delay after wake | Pre-scheduled intervals skipped wake time | Added immediate check-in scheduling at wake-up boundary |

---

## 💡 Suggestions / Improvements

1. **Persistent SW Alarm**: Use the experimental Web Periodic Background Sync API or the Push API with zero-data payloads to keep SW-side timers alive past SW restart.
2. **Capacitor Background Mode Plugin**: For native builds, use `@transistorsoft/capacitor-background-fetch` for rock-solid background execution.
3. **Gamification**: Add XP/badges for daily streaks to increase user retention.
4. **AI Insights**: Integrate an LLM to analyze task patterns and suggest smarter scheduling.
5. **Team Boards**: Shared task boards with team-wide leaderboards.

---

**Generated by Antigravity AI** — *Refining the way humans interact with time.*
