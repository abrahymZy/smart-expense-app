"use client";

import React from "react";
import { Wifi, WifiOff, RefreshCw, User as UserIcon, LogIn, Cloud, CloudOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  onSync: () => void;
  onOpenAuth: () => void;
  onOpenCategories: () => void;
}

export function Header({
  isOnline,
  pendingSyncCount,
  isSyncing,
  onSync,
  onOpenAuth,
  onOpenCategories,
}: HeaderProps) {
  const { user, isAuthenticated, isFirebaseActive } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-500/30 shadow-lg shadow-indigo-500/25 flex items-center justify-center bg-slate-900 flex-shrink-0">
            <img src="/app-logo.png" alt="شعار حساب الصرفية" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
              حساب الصرفية
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                الذكي
              </span>
            </h1>
            <p className="text-xs text-slate-400">إدارة المصروفات اليومية الذكية</p>
          </div>
        </div>

        {/* Status, Sync & User Auth */}
        <div className="flex items-center gap-2">
          {/* Online/Offline status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? "متصل" : "بدون إنترنت"}</span>
          </div>

          {/* Firebase Cloud Status Badge */}
          {isFirebaseActive ? (
            <div
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20"
              title="سحابة Firebase Firestore متصلة وجاهزة للمزامنة السحابية"
            >
              <Cloud className="w-3 h-3 text-sky-400" />
              <span>Firebase مفعّل</span>
            </div>
          ) : (
            <div
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/50"
              title="يعمل بالوضع المحلي (IndexedDB). أدخل مفاتيح Firebase في .env.local للتفعيل السحابي"
            >
              <CloudOff className="w-3 h-3 text-slate-500" />
              <span>وضع محلي</span>
            </div>
          )}

          {/* Sync Button */}
          {pendingSyncCount > 0 && (
            <button
              onClick={onSync}
              disabled={isSyncing || !isOnline}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
              title="مزامنة التغييرات المحلية مع السحابة"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{pendingSyncCount} معلقة</span>
            </button>
          )}

          {/* Manage Categories Trigger */}
          <button
            onClick={onOpenCategories}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            title="إدارة التصنيفات"
          >
            <span className="text-sm">🏷️</span>
          </button>

          {/* User Auth Profile Trigger */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-indigo-500/40 transition-all text-xs text-slate-200"
          >
            {isAuthenticated && user ? (
              <>
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <span className="hidden sm:inline font-medium max-w-[100px] truncate">{user.name}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline font-medium">تسجيل الدخول</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
