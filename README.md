<div align="center">

# ⚡ TANZI
### High-Performance Productivity & Time Management Platform 🚀

<p align="center">
  <img src="web/assets/icon.png" 
    width="15%" 
    height="15%"
    border-radius=" 15%">
</p>

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor_8-119EFF?style=for-the-badge&logo=ionic&logoColor=white)](https://capacitorjs.com/)

**TANZI** is a state-of-the-art productivity ecosystem built for high achievers. It combines elite task management, deep focus tools, and intelligent analytics into a seamless, cross-platform experience.

[Project Repository](https://github.com/Priyan-19/TANZI) · [Firebase Console](https://console.firebase.google.com) · [Report Issues](https://github.com/Priyan-19/TANZI/issues)

</div>

---

## 📖 Project Overview

TANZI is a modern productivity platform designed to optimize focus, track performance, and automate daily routines.

### Core Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Mobile Support**: Capacitor v8 (Android / iOS)
- **Backend**: Firebase (Authentication, Firestore, Cloud Messaging)
- **Analytics**: Recharts (real-time visual insights)
- **Automation**: Smart reminders, sleep tracking, and background check-ins

### Core Value Proposition
- **⚡ High Performance**: Blazing fast UI powered by Vite
- **🧠 Intelligent Tracking**: Streaks, productivity score, and behavioral insights
- **🔄 Real-Time Sync**: Instant updates across devices
- **📊 Visual Analytics**: Clean dashboards with actionable data
- **🔔 Smart Notifications**: Context-aware reminders with FREE/BUSY logic

---

## 🏗️ System Architecture

TANZI follows a scalable, cloud-native architecture:

### ⚛️ Frontend: React + Vite
- Component-driven architecture
- Context API for global state (Auth, Tasks, Theme)
- TailwindCSS for responsive UI
- Recharts for analytics dashboards

### 🔥 Backend: Firebase Ecosystem
- **Authentication**: Email/Password + Google Sign-In
- **Firestore**: Real-time NoSQL database
- **Cloud Messaging (FCM)**: Push notifications
- **Cloud Functions (Optional)**: Scheduled automation

### 📱 Mobile Layer: Capacitor
- Converts web app into native Android/iOS apps
- Access to native APIs and notifications

---

## 📂 Documentation

| Document | Description |
| :--- | :--- |
| 📄 **PROJECT_DOCUMENTATION.md** | Full architecture, feature breakdown, and setup |
| 📊 **SKILLS.md** | Technical skills required |
| 🧪 **test.md** | Evaluation & testing suite |
| 🌐 **web/README.md** | Web-specific instructions |

---

## 📁 Project Structure

```text
tanzi/
├── src/                          # React Web App (Vite)
│   ├── components/
│   │   ├── TaskModal.jsx
│   │   └── PomodoroTimer.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── TaskContext.jsx
│   │   └── ThemeContext.jsx
│   ├── firebase/
│   │   └── config.js
│   ├── layouts/
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Tasks.jsx
│   │   └── Analytics.jsx
│   └── services/
│       ├── analyticsService.js
│       └── notificationService.js
├── functions/
│   └── src/index.ts
├── public/
│   └── firebase-messaging-sw.js
├── firestore.rules
├── firebase.json
├── vite.config.js
├── tailwind.config.js
├── package.json
└── .env.example
```

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Priyan-19/TANZI.git
cd TANZI/web
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Explore
Open:
```
http://localhost:5173
```

---

## 🔧 Firebase Setup

### 1. Create Project
1. Go to Firebase Console
2. Create a new project
3. Enable:
   - Authentication (Email/Password + Google)
   - Firestore (Production mode)
   - Cloud Messaging

### 2. Get Config
- Project Settings → General → Your Apps → Web App
- Copy `firebaseConfig`

---

## 🔐 Environment Configuration

Create `.env.local` and add:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

---

## 🚀 Deployment

### Deploy Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init
npm run build
firebase deploy
```

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

---

## ⚙️ Client-Side Automation

To support Firebase Free Tier:

- **Streak System** → Updated on task completion
- **Daily Reports** → Generated dynamically
- **Busy Response** → Updated via service worker

---

## 🔔 Web Push Notifications (FCM)

1. Firebase Console → Cloud Messaging
2. Generate VAPID key
3. Add to `.env.local`
4. Update:
```
public/firebase-messaging-sw.js
```

⚠️ Replace placeholders:
```
__VITE_FIREBASE_*__
```

---

## 🗄️ Firestore Schema

```text
users/{userId}
  - name
  - email
  - createdAt
  - fcmToken
  - streakCount
  - lastActiveDate
  - busyUntil

tasks/{taskId}
  - userId
  - title
  - description
  - date
  - status
  - createdAt
  - completedAt

dailyReports/{userId_YYYY-MM-DD}
  - userId
  - date
  - totalTasks
  - completedTasks
  - pendingTasks
  - completionRate
  - updatedAt
```

---

## 🌟 Features

| Feature | Status |
|--------|--------|
| Authentication (Email/Google) | ✅ |
| Task CRUD | ✅ |
| Real-time Sync | ✅ |
| Notifications (FCM) | ✅ |
| Analytics Dashboard | ✅ |
| Charts (Line/Bar/Pie) | ✅ |
| Dark/Light Mode | ✅ |
| Pomodoro Timer | ✅ |
| Streak System | ✅ |
| Productivity Score | ✅ |
| Offline Support | ✅ |
| Sidebar Navigation | ✅ |

---

## 🔒 Security

- Firestore rules enforce user ownership
- Authentication required for all operations
- Secure environment variables
- FCM token validation and cleanup

---

## 📦 Dependencies

- React + React Router
- Firebase v10 SDK
- Recharts
- TailwindCSS
- Lucide Icons
- React Hot Toast
- date-fns

---

## 🛠️ Customization

### Notification Schedule
```ts
.schedule("0 9-21 * * *")
.timeZone("Asia/Kolkata")
```

### Add Task Fields
1. Update Firestore rules
2. Modify TaskModal.jsx
3. Update TaskContext.jsx

### Add Charts
1. Create component
2. Import into Analytics.jsx
3. Update analyticsService.js

---

## 🎯 Final Note

TANZI is designed as a **complete productivity ecosystem**, combining task management, behavioral analytics, and intelligent automation into one unified platform.

<div align="center">
  <p>Built with ⚡ for Peak Productivity</p>
  <p>Developed by <strong>Priyan</strong></p>
  <p>© 2026 TANZI Platform. All Rights Reserved.</p>
</div>
