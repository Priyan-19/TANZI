# Technical Evaluation Test: TANZI Project

**Candidate Evaluation for Senior Full-Stack Developer (React/Firebase/Capacitor)**

---

### Section A: Theory Questions (Conceptual Understanding)

1. **Context vs. State**: Why does the project use multiple specialized contexts (Auth, Task, Timer) instead of one singular global state manager like Redux?
2. **Firebase Auth Lifecycle**: Explain how the `onAuthStateChanged` listener in `AuthContext.jsx` ensures a secure user experience during initial app hydration. Why is `loading` state needed?
3. **Capacitor Bridge**: What is the architectural role of Capacitor when deploying the project to Android? How does it differ from React Native at a fundamental level?
4. **NoSQL Schema**: In `TaskContext.jsx`, tasks are stored in Firestore. How would you structure a Firestore query to fetch all completed tasks for a specific user within the last 7 days?
5. **React Optimization**: What is the purpose of `React.memo` as used in `Dashboard.jsx`'s `StatCard`? When would it actually *hurt* performance?
6. **Security Rules**: How do Firestore Security Rules protect a user's task data from being read by another authenticated user?
7. **Service Layer**: Why are complex calculations (like `generateDailyReport`) placed in `services/` instead of directly inside the `Analytics.jsx` component?
8. **Asynchronous Logic**: Explain how you would handle a scenario where a user goes offline while marking a task as "Complete." How does `persistentLocalCache` help?
9. **Environment Management**: How does Vite handle different Firebase configurations for `.env.local` vs production environments?
10. **Native Plugins**: How does the `@codetrix-studio/capacitor-google-auth` plugin differ in implementation between the web browser and a physical Android device?
11. **DevOps & SEO**: What is the purpose of including a `sitemap.xml` and `robots.txt` in a PWA? How does version control via Git assist in collaborative development for a project like TANZI?

---

### Section B: Sleep Routine & Background Execution (Domain-Specific)

1. **Midnight Normalization Bug**: A user sets their sleep routine to "12:00 AM – 07:00 AM". The app incorrectly triggers sleep mode at noon. Explain the root cause in `sleepSchedule.js` and how `normalizeTimeString()` fixes it using explicit AM/PM awareness.
2. **12h vs 24h Display Strategy**: How does the project achieve a user-friendly 12-hour display while maintaining a standard 24-hour internal format for computation? Which utilities are involved?
3. **OS-Level Pre-scheduling**: In `notificationService.jsx`, how are future check-ins and sleep boundary notifications pre-scheduled for when the app is completely closed? What role does the `START_ID` and `dayHash` play in avoiding ID collisions?
4. **Immediate Wake-up Check-in**: To ensure check-in notifications "begin immediately after wake time," how does `scheduleCheckInBatch` handle the first minute of the wake window?
5. **State Machine Transition**: In `TimerContext.jsx`, a `prevSleepModeRef` is used to detect sleep mode transitions. Why is a `ref` used instead of simply comparing values inside the `isSleepMode` effect? What race condition does this avoid?

---

### Section C: Practical Tasks (Hands-on Engineering)

1. **Task Categorization**: Modify `TaskModal.jsx` and `TaskContext.jsx` to allow users to assign a category (e.g., "Work", "Personal", "Health") to a task and filter by it.
2. **Pomodoro Enhancement**: Add a "Reset Session" button to the `PomodoroTimer` component that clears the current countdown and reverts to the default 25-minute work interval.
3. **Analytics Visualization**: Create a new Bar Chart in `Analytics.jsx` using `recharts` that displays total focus hours per day for the current week.
4. **Notification Logic**: Implement a local notification that triggers automatically when the Pomodoro timer reaches 00:00, even if the app is in the background on a native device.
5. **Sleep Schedule Persistence**: Modify `updateSleepSchedule()` in `TimerContext.jsx` so the schedule is also saved to the user's Firestore document (not just `localStorage`), ensuring it syncs across multiple devices.

---

### Section D: Debugging Scenarios (Real-world Problem Solving)

1. **The "Ghost" Task**: A user marks a task as completed, but when they refresh the page it shows as pending. Where in `TaskContext.jsx` or Firestore rules would you look first?
2. **Sleep Mode at Wrong Time**: A user reports that sleep mode starts at 12:00 PM (noon) instead of midnight. How do you debug `sleepSchedule.js` and `normalizeTimeString`? Write a Vitest unit test that would have caught this bug.
3. **Timer Doesn't Resume After Sleep**: The check-in timer is not resuming when sleep mode ends. You notice `prevSleepModeRef` is always equal to `isSleepMode` in the transition effect. What caused this? What is the correct fix?
4. **Mobile Keyboard Overlay**: On the Android version, the keyboard covers the "Add Task" input field in the modal. How do you resolve this using CSS or Capacitor settings?
5. **Auth Redirect Loop**: After logging in with Google, the app keeps redirecting back to the login page even though the user is authenticated in Firebase. Debug the `App.jsx` routing and `ProtectedRoute` logic.
6. **SW Message Not Received**: `SLEEP_ENDED` is being posted by the Service Worker, but the `Layout.jsx` handler never fires. What are the 3 most likely causes?

---

### Section E: System Design (Scaling & Evolution)

1. **Offline Sync**: Design a system to allow TANZI to work fully offline and sync data back to Firestore once a connection is restored. What are the trade-offs of Firestore's `persistentLocalCache`?
2. **Cross-Device Sleep Sync**: The sleep schedule is stored in `localStorage`, meaning it only persists on one device. Design a Firestore-backed sync strategy that handles conflicts (e.g., user updates schedule on mobile while desktop is open).
3. **Shared Objectives**: How would you modify the Firestore data model to allow multiple users to collaborate on the same task board?
4. **Background Execution Limitations**: The current SW-based sleep timer uses a `setTimeout`, which is unreliable if the SW is killed by the browser after inactivity. Describe 3 alternative approaches to guarantee the timer fires, ranked by reliability.

---

### Section F: Multiple Choice Questions

1. **What does `normalizeTimeString("12:00 AM")` return?**
   - A) `"12:00"`
   - B) `"00:00"` ✅
   - C) `"24:00"`
   - D) `"12:00 PM"`

2. **What does `formatClockTime("13:30")` return?**
   - A) `"01:30 AM"`
   - B) `"13:30 PM"`
   - C) `"1:30 PM"` ✅
   - D) `"1:30 AM"`

2. **In `TimerContext`, why is `prevSleepModeRef` needed instead of just using the `isSleepMode` value directly?**
   - A) `useRef` is faster than `useState`
   - B) To detect the *transition* (enter/exit) rather than just the current value ✅
   - C) `useState` can't be read inside a `useEffect`
   - D) To share state across multiple components

3. **Which message type does `Layout.jsx` send to the Service Worker when sleep mode activates?**
   - A) `SLEEP_STARTED`
   - B) `SLEEP_ENDED`
   - C) `SCHEDULE_SLEEP_END_WAKEUP` ✅
   - D) `CANCEL_CHECKIN`

4. **Which hook is best suited for complex state logic involving multiple sub-values?**
   - A) `useState`
   - B) `useReducer` ✅
   - C) `useRef`
   - D) `useMemo`

5. **How does Capacitor ensure native plugins are available in the web code?**
   - A) By compiling JS to C++
   - B) Through a JS-to-Native bridge injected at runtime ✅
   - C) By using standard WebAssembly
   - D) It doesn't — plugins only work on mobile

6. **In Firestore, what is the maximum depth of nested subcollections?**
   - A) 10 levels
   - B) 100 levels ✅
   - C) 50 levels
   - D) Unlimited

---

### Evaluation Guidelines for Assessors

| Level | Signal |
|---|---|
| **Junior** | Understands React components and basic `useState`. Can perform simple UI tweaks. Cannot explain SW messaging. |
| **Intermediate** | Can debug Firestore queries, handle Context API, understand the mobile build process and Capacitor lifecycle. |
| **Senior** | Can architect new services, design the sleep-boundary state machine, write correct SW communication protocols, and explain background execution trade-offs. |
