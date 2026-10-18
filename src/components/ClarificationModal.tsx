"use client";

import React from "react";
import { HelpCircle, X, Check } from "lucide-react";

interface ClarificationModalProps {
  data: {
    question: string;
    rawText: string;
    pendingAmount?: number;
  } | null;
  answer: string;
  setAnswer: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ClarificationModal({
  data,
  answer,
  setAnswer,
  onClose,
  onSubmit,
}: ClarificationModalProps) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">توضيح مطلوب</h3>
            <p className="text-xs text-slate-400">النص يحتاج إلى تفصيل إضافي قبل الحفظ</p>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 mb-4 text-sm text-slate-200">
          <span className="text-amber-400 font-medium ml-1">السؤال:</span>
          {data.question}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              إجابتك (مثال: قهوة، غداء، بنزين...)
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="اكتب التوضيح هنا..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Check className="w-4 h-4" />
              <span>متابعة وحفظ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
