// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Firestore with persistent multi-tab cache (modern API, no deprecation warning)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// FCM — lazy initialized, only in supported browsers
let _messaging = null;
export const getMessagingInstance = async () => {
  if (_messaging) return _messaging;
  try {
    const supported = await isSupported();
    if (supported) {
      _messaging = getMessaging(app);
      return _messaging;
    }
  } catch (err) {
    console.warn("Firebase Messaging not supported:", err.message);
  }
  return null;
};

export default app;
