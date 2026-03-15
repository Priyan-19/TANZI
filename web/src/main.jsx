import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initNativeNotifications } from './services/notificationService'
import { Capacitor } from '@capacitor/core'

if (Capacitor.isNativePlatform()) {
    initNativeNotifications();
} else if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/firebase-messaging-sw.js")
            .catch((error) => console.error("Service worker registration failed:", error));
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
