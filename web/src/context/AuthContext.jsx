// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithCredential,
  GoogleAuthProvider
} from "firebase/auth";
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase/config";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic init, Capacitor plugin reads from capacitor.config.json
    GoogleAuth.initialize().catch(err => console.warn("GoogleAuth init error:", err));

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. Resolve basic info immediately so app can mount
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || "User",
          photoURL: firebaseUser.photoURL,
        });
        setLoading(false);

        // 2. Fetch extra profile data in background
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser(prev => ({
              ...prev,
              ...userData,
              displayName: prev.displayName === "User" ? (userData.name || prev.displayName) : prev.displayName
            }));
          }
        } catch (docErr) {
          console.warn("Background user doc fetch failed:", docErr.message);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Create or update user document in Firestore
  const createUserDoc = async (firebaseUser, name) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: name || firebaseUser.displayName || "User",
          email: firebaseUser.email,
          createdAt: serverTimestamp(),
          fcmToken: null,
          streakCount: 0,
          lastActiveDate: null,
        });
      }
    } catch (err) {
      console.error("Firestore createUserDoc Error:", err);
    }
  };

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const cleanUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName || "User",
      photoURL: result.user.photoURL
    };
    setUser(cleanUser); // Immediate clean state update
    return result;
  };

  const register = async (email, password, name) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await createUserDoc(result.user, name);
    const cleanUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: name || result.user.displayName || "User",
      photoURL: result.user.photoURL
    };
    setUser(cleanUser); // Immediate clean state update
    return result;
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      let result;
      if (Capacitor.isNativePlatform()) {
        console.log("Starting Native Google Sign-In...");
        const googleUser = await GoogleAuth.signIn();
        console.log("Native Google Sign-In Success:", googleUser.email);

        if (!googleUser.authentication.idToken) {
          throw new Error("No ID Token returned from Google. Check your Client ID and SHA-1 configuration.");
        }

        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        result = await signInWithCredential(auth, credential);
        console.log("Firebase Native Sign-In Success:", result.user.uid);
      } else {
        console.log("Starting Web Google Sign-In...");
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        result = await signInWithPopup(auth, provider);
        console.log("Firebase Web Sign-In Success:", result.user.uid);
      }

      if (result && result.user) {
        // Manually set user state with a clean object immediately
        const cleanUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || "Google User",
          photoURL: result.user.photoURL
        };
        setUser(cleanUser);
        await createUserDoc(result.user);
      }
      return result;
    } catch (error) {
      console.error("Google Web/Native Sign-In Error Details:", error);

      // Error logged previously
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
