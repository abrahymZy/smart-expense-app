"use client";

import React, { useState } from "react";
import { X, Mail, Lock, Phone, User as UserIcon, LogOut, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { user, isAuthenticated, loginWithEmail, registerWithEmail, loginWithGoogle, loginWithPhone, logout } = useAuth();

  const [mode, setMode] = useState<"login" | "register" | "phone">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await loginWithEmail(email, password);
        if (!res.success) {
          setError(res.error || "فشل تسجيل الدخول");
        } else {
          onClose();
          onSuccess?.();
        }
      } else {
        const res = await registerWithEmail(name, email, password);
        if (!res.success) {
          setError(res.error || "فشل إنشاء الحساب");
        } else {
          onClose();
          onSuccess?.();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setError(res.error || "فشل تسجيل الدخول عبر Google");
      } else {
        onClose();
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginWithPhone(phone, otp || "1234");
      if (!res.success) {
        setError(res.error || "فشل التحقق من رقم الهاتف");
      } else {
        onClose();
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {isAuthenticated && user ? (
          /* Profile & Logout View */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{user.email || user.phone || "حساب محلي"}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20 mt-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>حساب موثق ({user.provider})</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-right leading-relaxed">
              🔒 بياناتك ومصروفاتك معزولة ومحمية بالكامل ويتم مزامنتها تلقائياً مع حسابك الشخصي فقط.
            </p>

            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-medium text-sm flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        ) : (
          /* Authentication Form */
          <div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {mode === "login" ? "تسجيل الدخول" : mode === "register" ? "إنشاء حساب جديد" : "الدخول برقم الهاتف"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                احفظ مصروفاتك ومزامنتها بأمان بين جميع أجهزتك
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl mb-5 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === "login" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                دخول
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === "register" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                تسجيل
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("phone");
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === "phone" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                الهاتف
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {mode === "phone" ? (
              /* Phone Form */
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="770000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pr-10 pl-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">رمز التحقق (OTP)</label>
                  <input
                    type="text"
                    required
                    placeholder="1234"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-center tracking-widest text-lg font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 text-center">رمز التحقق التجريبي هو: 1234</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {loading ? "جاري التحقق..." : "تأكيد الدخول بالهاتف"}
                </button>
              </form>
            ) : (
              /* Email / Password Form */
              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">الاسم الكامل</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="محمد أحمد"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pr-10 pl-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pr-10 pl-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pr-10 pl-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {loading
                    ? "جاري المعالجة..."
                    : mode === "login"
                    ? "تسجيل الدخول"
                    : "إنشاء حساب"}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-3 text-slate-500">أو المتابعة السريعة عبر</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSubmit}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>تسجيل الدخول عبر Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
