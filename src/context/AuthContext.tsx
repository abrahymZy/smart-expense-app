// src/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types/auth";
import { isFirebaseConfigured, auth } from "@/lib/firebase/config";
import {
  firebaseLoginEmail,
  firebaseRegisterEmail,
  firebaseLoginGoogle,
  firebaseLogout,
  mapFirebaseUser,
} from "@/lib/firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirebaseActive: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = "smart_expense_user";
const STORAGE_KEY_TOKEN = "smart_expense_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isFirebaseActive = isFirebaseConfigured();

  useEffect(() => {
    // 1. إذا كان Firebase مفعلاً، نستمع لتغير حالة المصادقة السحابية
    if (isFirebaseActive && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const mapped = mapFirebaseUser(fbUser);
          setUser(mapped);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mapped));
        } else {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY_USER);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      // 2. إذا لم يكن Firebase مفعلاً بعد، نستعيد الجلسة المحلية المخزنة
      try {
        const savedUser = localStorage.getItem(STORAGE_KEY_USER);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.warn("Failed to read user from localStorage", e);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isFirebaseActive]);

  const saveLocalSession = (userData: User, token?: string) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      if (isFirebaseActive && auth) {
        const fbUser = await firebaseLoginEmail(email, password);
        setUser(fbUser);
        return { success: true };
      }

      // Fallback المحلي السريع
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "فشل تسجيل الدخول" };
      }
      saveLocalSession(data.user, data.token);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "فشل تسجيل الدخول";
      return { success: false, error: msg };
    }
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    try {
      if (isFirebaseActive && auth) {
        const fbUser = await firebaseRegisterEmail(name, email, password);
        setUser(fbUser);
        return { success: true };
      }

      // Fallback المحلي السريع
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "فشل إنشاء الحساب" };
      }
      return await loginWithEmail(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "فشل إنشاء الحساب";
      return { success: false, error: msg };
    }
  };

  const loginWithGoogle = async () => {
    try {
      if (isFirebaseActive && auth) {
        const fbUser = await firebaseLoginGoogle();
        setUser(fbUser);
        return { success: true };
      }

      // Fallback المحلي
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "مستخدم Google",
          email: "user@gmail.com",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "فشل تسجيل الدخول عبر Google" };
      }
      saveLocalSession(data.user, data.token);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر تسجيل الدخول عبر Google";
      return { success: false, error: msg };
    }
  };

  const loginWithPhone = async (phone: string, otp: string) => {
    try {
      const res = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "رمز التحقق غير صحيح" };
      }
      saveLocalSession(data.user, data.token);
      return { success: true };
    } catch {
      return { success: false, error: "تعذر الاتصال بالخادم" };
    }
  };

  const logout = async () => {
    if (isFirebaseActive) {
      await firebaseLogout();
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isFirebaseActive,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithPhone,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
