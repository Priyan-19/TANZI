# 🚀 TANZI — Web Task Management System

A web-based task management and productivity tracking app built with React.js and Firebase.

---

## 📁 Project Structure

```
tanzi/
├── src/                          # React Web App (Vite)
│   ├── components/
│   │   ├── TaskModal.jsx          # Add/Edit task modal
│   │   └── PomodoroTimer.jsx      # Pomodoro timer (bonus)
│   ├── context/
│   │   ├── AuthContext.jsx        # Firebase Auth state
│   │   ├── TaskContext.jsx        # Task CRUD + real-time sync
│   │   └── ThemeContext.jsx       # Dark/Light mode
│   ├── firebase/
│   │   └── config.js              # Firebase initialization
│   ├── layouts/
│   │   └── Layout.jsx             # Sidebar navigation layout
│   ├── pages/
│   │   ├── Login.jsx              # Auth page
│   │   ├── Dashboard.jsx          # Main dashboard
│   │   ├── Tasks.jsx              # Task management
│   │   └── Analytics.jsx          # Charts & insights
│   └── services/
│       ├── analyticsService.js    # Report generation & queries
│       └── notificationService.js # FCM token management
├── functions/                     # Firebase Cloud Functions
│   └── src/index.ts               # Scheduled notifications + reports
├── public/
│   └── firebase-messaging-sw.js   # FCM Service Worker
├── firestore.rules                # Security rules
├── firebase.json                  # Firebase hosting config
├── vite.config.js
├── tailwind.config.js
├── package.json
└── .env.example                   # Environment variables template
```

---

## ⚡ Quick Start

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → Create project
2. Enable **Authentication** → Email/Password + Google
3. Enable **Firestore** → Start in production mode
4. Enable **Cloud Messaging** (for notifications)
5. **Free Tier Ready**: No Blaze plan (no Cloud Functions) required!
6. **Get your config**: 
   - In [Firebase Console](https://console.firebase.google.com), click the **Gear Icon (⚙️)** → **Project Settings**.
   - Under the **General** tab, scroll down to **Your apps**.
   - Click the **Web icon (</>)** to register a new web app (e.g., name it "TANZI Web").
   - Firebase will show an `firebaseConfig` object containing the keys you need for the next step.

### 2. Configure Environment Variables

This project uses environment variables to keep your credentials secure.

1. Create a file named `.env.local` in the root directory.
2. Copy the content from `.env.example` into `.env.local`.
3. Fill in the values from your Firebase Console.

| Variable Name | Where to find in Firebase Console |
|---------------|-----------------------------------|
| `VITE_FIREBASE_API_KEY` | `apiKey` in the config object |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_VAPID_KEY` | **Cloud Messaging** tab → **Web configuration** → **Web Push certificates** |

### 3. Web App Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### 4. Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select hosting + firestore)
firebase init

# Build and deploy
npm run deploy
# or manually:
npm run build
firebase deploy
```

### 5. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

### Client-Side Logic
The following features were migrated from Cloud Functions to client-side logic to support the **Firebase Free Tier (Spark Plan)**:
- **Streak System**: Updated automatically when a task is completed in the app.
- **Daily Reports**: Regenerated on the fly when the user opens the dashboard or completes tasks.
- **Busy Response**: Service worker updates Firestore directly when the "BUSY" notification button is clicked.

### Web FCM
1. Firebase Console → Project Settings → Cloud Messaging
2. Generate a Web Push certificate (VAPID key)
3. Add key to `VITE_FIREBASE_VAPID_KEY` in `.env.local`
4. The service worker at `public/firebase-messaging-sw.js` handles background messages.
   - **⚠️ CRITICAL**: You must manually replace the `__VITE_FIREBASE_*__` placeholders in `public/firebase-messaging-sw.js` with your actual Firebase config values.

---

## 🗄️ Firestore Schema

```
users/{userId}
  - name: string
  - email: string
  - createdAt: Timestamp
  - fcmToken: string | null        (web FCM token)
  - streakCount: number
  - lastActiveDate: string         (YYYY-MM-DD)
  - busyUntil: Timestamp | null

tasks/{taskId}
  - userId: string
  - title: string
  - description: string
  - date: string                   (YYYY-MM-DD)
  - status: "pending" | "completed"
  - createdAt: Timestamp
  - completedAt: Timestamp | null

dailyReports/{userId_YYYY-MM-DD}
  - userId: string
  - date: string
  - totalTasks: number
  - completedTasks: number
  - pendingTasks: number
  - completionRate: number          (0-100)
  - updatedAt: Timestamp
```

---

## 🌟 Features

| Feature | Status |
|---------|--------|
| Email/Google Auth | ✅ |
| Task CRUD | ✅ |
| Real-time sync | ✅ |
| FREE/BUSY notifications (FCM) | ✅ |
| Daily/Weekly/Monthly analytics | ✅ |
| Line + Bar + Pie charts (Recharts) | ✅ |
| Dark/Light mode | ✅ |
| Pomodoro timer | ✅ |
| Streak system | ✅ |
| Productivity score | ✅ |
| Offline persistence | ✅ |
| Sidebar navigation | ✅ |

---

## 🔒 Security

- Firestore rules enforce `userId` ownership on all documents
- Authentication required for all operations
- FCM tokens cleared if invalid
- Environment variables never committed (`.env.local` in `.gitignore`)

---

## 📦 Dependencies

- `react` + `react-dom` + `react-router-dom`
- `firebase` (v10 modular SDK)
- `recharts` (charts)
- `lucide-react` (icons)
- `react-hot-toast` (notifications)
- `date-fns` (date utilities)
- `tailwindcss` (styling)

---

## 🛠️ Customization

### Change notification schedule
Edit `functions/src/index.ts`:
```typescript
.schedule("0 9-21 * * *")  // 9 AM to 9 PM every hour
.timeZone("Asia/Kolkata")   // Your timezone
```

### Add new task fields
1. Update `isValidTask()` in `firestore.rules`
2. Add to `TaskModal.jsx` form
3. Update `addTask` in `TaskContext.jsx`

### Add new chart
1. Create chart component in `src/charts/`
2. Import in `Analytics.jsx`
3. Fetch required data in `analyticsService.js`

# TANZI
Remainder Based - Task Management System (Web)
