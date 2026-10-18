"use client";

import React from "react";
import { CheckCircle2, X, Sparkles, Check, Edit3 } from "lucide-react";
import { ParsingResult } from "@/types/expense";
import { formatCurrency } from "@/lib/currency";

interface ReviewModalProps {
  result: ParsingResult | null;
  onClose: () => void;
  onConfirm: () => void;
  onEditManual: () => void;
}

export function ReviewModal({
  result,
  onClose,
  onConfirm,
  onEditManual,
}: ReviewModalProps) {
  if (!result || !result.expenses || result.expenses.length === 0) return null;

  const totalAmount = result.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

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
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">مراجعة المصروف قبل الحفظ</h3>
            <p className="text-xs text-slate-400">
              تم التحليل بنجاح عبر {result.source === "ai" ? "الذكاء الاصطناعي (AI)" : "المحلل الذكي المحلي"}
            </p>
          </div>
        </div>

        {/* Extracted Expenses List */}
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
          {result.expenses.map((exp, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🏷️</span>
                <div>
                  <div className="font-medium text-white">{exp.item}</div>
                  <div className="text-[11px] text-slate-400">
                    التصنيف: {exp.category || "عام"}
                    {exp.location ? ` • ${exp.location}` : ""}
                  </div>
                </div>
              </div>
              <div className="font-bold text-emerald-400" dir="ltr">
                {formatCurrency(exp.amount)}
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm mb-5">
          <span className="text-slate-300 font-medium">الإجمالي المستخرج:</span>
          <span className="font-bold text-indigo-400 text-base" dir="ltr">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Check className="w-4 h-4" />
            <span>تأكيد وحفظ الآن</span>
          </button>
          <button
            onClick={onEditManual}
            className="py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-all flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            <span>تعديل</span>
          </button>
        </div>
      </div>
    </div>
  );
}
