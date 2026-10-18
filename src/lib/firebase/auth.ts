// src/lib/firebase/auth.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./config";
import { User } from "@/types/auth";

export const googleProvider = new GoogleAuthProvider();

export function mapFirebaseUser(user: FirebaseUser): User {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "مستخدم",
    email: user.email || undefined,
    phone: user.phoneNumber || undefined,
    avatar: user.photoURL || undefined,
    provider: user.providerData?.[0]?.providerId === "google.com" ? "google" : "email",
    createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now(),
  };
}

export async function firebaseRegisterEmail(name: string, email: string, pass: string): Promise<User> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase غير مهيأ بعد. يرجى إدخال مفاتيح .env.local");
  }
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (name.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }
  return mapFirebaseUser(credential.user);
}

export async function firebaseLoginEmail(email: string, pass: string): Promise<User> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase غير مهيأ بعد. يرجى إدخال مفاتيح .env.local");
  }
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return mapFirebaseUser(credential.user);
}

export async function firebaseLoginGoogle(): Promise<User> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase غير مهيأ بعد. يرجى إدخال مفاتيح .env.local");
  }
  const credential = await signInWithPopup(auth, googleProvider);
  return mapFirebaseUser(credential.user);
}

export async function firebaseLogout(): Promise<void> {
  if (isFirebaseConfigured() && auth) {
    await signOut(auth);
  }
}
