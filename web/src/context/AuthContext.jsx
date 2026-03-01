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
      try {
        if (firebaseUser) {
          console.log("Firebase Auth State: Logged In", firebaseUser.uid);
          // Fetch extra user data from Firestore
          let userData = {};
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            userData = userDoc.exists() ? userDoc.data() : {};
          } catch (docErr) {
            console.warn("Firestore user doc fetch failed:", docErr.message);
          }

          // Merge only serializable fields to avoid prototype/getter issues with Firebase User object
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userData.name || "User",
            photoURL: firebaseUser.photoURL,
            ...userData
          });
        } else {
          console.log("Firebase Auth State: Logged Out");
          setUser(null);
        }
      } catch (err) {
        console.error("Error in onAuthStateChanged:", err);
        toast.error("Error loading user profile");
        setUser(firebaseUser || null);
      } finally {
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
    toast.success("Welcome back!");
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
    toast.success("Account created!");
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
        toast.success("Signed in with Google!");
      }
      return result;
    } catch (error) {
      console.error("Google Web/Native Sign-In Error Details:", error);

      let errorMsg = "Google Sign-In failed.";
      if (error.message.includes("idToken")) errorMsg = "Connection error: No valid token from Google.";
      if (error.code === "auth/unauthorized-domain") errorMsg = "This domain isn't authorized for sign-in.";

      toast.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    toast.success("Logged out successfully");
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
