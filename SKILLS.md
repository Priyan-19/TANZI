# Technical Skills Profile: TANZI Project

This document outlines the professional skills and competencies required to maintain, develop, and scale the TANZI productivity platform.

## 📊 Skill Level Summary: Intermediate → Advanced
*The project requires a solid understanding of asynchronous state management, BaaS integration, hybrid mobile deployment, and background execution patterns (Service Workers, Capacitor native APIs).*

---

## 🛠️ 1. Frontend Development (Core)
| Skill | Category | Proficiency | Description |
| :--- | :--- | :--- | :--- |
| **React 18** | Framework | Advanced | Mastering functional components, Hooks (`useEffect`, `useMemo`, `useCallback`, `useRef`), Context API, and state machine patterns with `useRef` for transition detection. |
| **Vite** | Build Tool | Intermediate | Managing rapid development cycles, environment variables (`import.meta.env`), and optimized production bundling. |
| **Tailwind CSS** | Styling | Advanced | Implementing a utility-first design system with custom brand tokens, responsive breakpoints, and complex micro-animations. |
| **React Router v6** | Navigation | Intermediate | Declarative routing, protected routes, lazy loading with `React.Suspense`, and nested layouts via `<Outlet>`. |

## ☁️ 2. Backend & Cloud Infrastructure
| Skill | Category | Proficiency | Description |
| :--- | :--- | :--- | :--- |
| **Firebase Auth** | Security | Intermediate | Implementing multi-channel authentication (email/password & Google), managing user sessions, and handling native Capacitor Google Auth flow. |
| **Firestore** | Database | Advanced | Designing NoSQL schemas, real-time `onSnapshot` listeners, complex queries with `where`/`orderBy`, and persistent offline caching. |
| **Firebase Functions** | Serverless | Intermediate | Writing TypeScript background triggers (Pub/Sub, Firestore events, HTTPS callables) for notifications and data aggregation. |
| **Security Rules** | DevOps | Intermediate | Authoring Firestore Security Rules to enforce per-user data access. |
| **FCM (Firebase Cloud Messaging)** | Notifications | Intermediate | Understanding VAPID keys, service worker registration, and FCM token management across web and native platforms. |

## 📱 3. Mobile & Hybrid Development
| Skill | Category | Proficiency | Description |
| :--- | :--- | :--- | :--- |
| **Capacitor v8** | Bridge | Intermediate | Bridging web code to native platforms, managing `capacitor.config.json`, and syncing native projects. |
| **Android Studio** | IDE | Beginner | Managing Gradle builds, signing APKs, debugging native Android performance issues. |
| **Capacitor Local Notifications** | Hardware | Intermediate | Scheduling batch OS-level notifications (`LocalNotifications.schedule`) with action types (FREE/BUSY) that survive app kills. |
| **Capacitor Push Notifications** | Hardware | Intermediate | Registering for push, handling `registration` events, and storing FCM tokens to Firestore. |

## 🔔 4. Background Execution & Notifications
| Skill | Category | Proficiency | Description |
| :--- | :--- | :--- | :--- |
| **Service Workers** | Web API | Advanced | Registering and communicating with SW via `postMessage`, handling `notificationclick`, and scheduling background actions using SW-side `setTimeout`. |
| **SW Messaging Protocol** | Architecture | Intermediate | Designing a bi-directional `postMessage` channel between the app thread and SW (`SCHEDULE_SLEEP_END_WAKEUP`, `SLEEP_ENDED`, `CANCEL_SLEEP_END_WAKEUP`). |
| **Web Notification API** | Browser API | Intermediate | Using `serviceWorker.registration.showNotification` with actions, `requireInteraction`, and `tag` options. |
| **Sleep Scheduling Logic** | Algorithm | Advanced | Implementing a cross-midnight sleep window state machine with AM/PM ↔ 24h bidirectional normalization, and boundary-triggered side effects. |

## 🧪 5. Engineering & DevOps Practices
| Skill | Category | Proficiency | Description |
| :--- | :--- | :--- | :--- |
| **Git / GitHub** | Version Control | Advanced | Managing branch strategies, resolving merge conflicts, and maintaining a production-ready codebase with meaningful commits. |
| **SEO Optimization** | Performance | Intermediate | Implementing `robots.txt`, `sitemap.xml`, and metadata for search engine indexing and PWA discoverability. |
| **Vitest** | Testing | Intermediate | Writing unit tests for pure functions (`sleepSchedule.js`, `analyticsService.js`), including regression tests for critical bugs. |
| **Clean Architecture** | Pattern | Advanced | Separation of concerns: `pages` (UI), `context` (state), `services` (business logic), `sleepSchedule` (pure math utilities). |
| **State Machine Pattern** | Pattern | Advanced | Using `useRef` to track previous state values to detect transitions and trigger side effects (e.g., sleep-start vs. sleep-end notifications). |
| **Performance Optimization** | UX | Intermediate | Using `React.memo`, `useMemo`, `useCallback` to prevent unnecessary re-renders on mobile. |

## 📦 6. Core Concepts Required
- **Reactive State Management**: Managing complex, interdependent states (Timer ↔ Auth ↔ Tasks ↔ SleepMode).
- **Asynchronous Patterns**: Race conditions, promise chaining in Firestore writes, and `async/await` in effect hooks.
- **24-Hour Time Arithmetic**: Handling cross-midnight intervals (e.g., sleep 22:00 → 07:00) without off-by-one errors.
- **Bidirectional Time Normalization**: Converting between user-friendly 12h display formats (AM/PM) and machine-friendly 24h internal storage (HH:MM).
- **Advanced Notification Scheduling**: Pre-scheduling a precise sequence of OS-level notifications (Sleep-start, Wake-up, Resume-timer) that trigger even when the app is fully terminated.
- **BaaS Integration**: Full-stack applications without a dedicated custom backend.
- **Service Worker Lifecycle**: Understanding install, activate, fetch events, and SW-controlled scopes.
