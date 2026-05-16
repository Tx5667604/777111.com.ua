// src/lib/auth-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { initFirebase } from "./firebase";

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  phone?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<string>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => "",
  registerWithEmail: async () => "",
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      const { db } = initFirebase();
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }, []);

  const saveProfile = useCallback(async (firebaseUser: User) => {
    try {
      const { db } = initFirebase();
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      // Пробуємо отримати телефон з Google аккаунту
      const googlePhone = firebaseUser.phoneNumber || "";

      const profileData: Partial<UserProfile> = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "Користувач",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL,
        lastLogin: new Date(),
      };

      if (!docSnap.exists()) {
        profileData.createdAt = new Date();
        profileData.phone = googlePhone || "";
      } else {
        // Якщо телефон пустий в профілі, а в Google є — додаємо
        const existing = docSnap.data() as UserProfile;
        if (!existing.phone && googlePhone) {
          profileData.phone = googlePhone;
        }
      }

      await setDoc(docRef, profileData, { merge: true });
      setProfile(profileData as UserProfile);
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  }, []);

  useEffect(() => {
    const { auth } = initFirebase();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loadProfile]);

  const loginWithGoogle = async () => {
    try {
      const { auth } = initFirebase();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      await saveProfile(result.user);
      window.location.href = `${window.location.pathname.replace(/\/+$/, '')}/account`;
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        console.error("Google login error:", err);
        throw err;
      }
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<string> => {
    try {
      const { auth } = initFirebase();
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveProfile(result.user);
      return "";
    } catch (err: any) {
      return getFirebaseErrorMessage(err.code);
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string): Promise<string> => {
    try {
      const { auth } = initFirebase();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      const updatedUser = { ...result.user, displayName: name } as User;
      await saveProfile(updatedUser);
      return "";
    } catch (err: any) {
      return getFirebaseErrorMessage(err.code);
    }
  };

  const logout = async () => {
    const { auth } = initFirebase();
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/user-not-found": "Користувача з таким email не знайдено",
    "auth/wrong-password": "Невірний пароль",
    "auth/invalid-credential": "Невірний email або пароль",
    "auth/email-already-in-use": "Цей email вже зареєстровано",
    "auth/weak-password": "Пароль має бути не менше 6 символів",
    "auth/invalid-email": "Невірний формат email",
    "auth/too-many-requests": "Забагато спроб. Спробуйте пізніше",
    "auth/network-request-failed": "Помилка мережі. Перевірте з'єднання",
  };
  return messages[code] || "Помилка. Спробуйте ще раз";
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
