"use client";

import React from "react";
import { Mic, MicOff, Send, Sparkles } from "lucide-react";

interface ExpenseInputBarProps {
  inputText: string;
  setInputText: (val: string) => void;
  isListening: boolean;
  isAnalyzing: boolean;
  speechError: string | null;
  onToggleListening: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ExpenseInputBar({
  inputText,
  setInputText,
  isListening,
  isAnalyzing,
  speechError,
  onToggleListening,
  onSubmit,
}: ExpenseInputBarProps) {
  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="relative group">
        <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300">
          {/* Sparkles Icon */}
          <div className="pr-4 pl-2 text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          {/* Main Input Text */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isAnalyzing}
            placeholder={
              isListening
                ? "🎙️ جاري الاستماع... تحدث الآن (مثلاً: 300 قهوة و500 فطور)"
                : "ماذا صرفت اليوم؟ (مثلاً: 300 قهوة و500 فطور)"
            }
            className={`w-full py-4 text-sm sm:text-base bg-transparent text-white placeholder-slate-500 focus:outline-none ${
              isListening ? "animate-pulse text-indigo-300 placeholder-indigo-400" : ""
            }`}
          />

          {/* Action Buttons: Mic & Submit */}
          <div className="flex items-center gap-1.5 pl-3 pr-2">
            {/* Microphone Button */}
            <button
              type="button"
              onClick={onToggleListening}
              className={`p-2.5 rounded-xl transition-all duration-300 relative ${
                isListening
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
              }`}
              title={isListening ? "إيقاف الاستماع" : "التسجيل الصوتي باللغة العربية"}
            >
              {isListening ? (
                <>
                  <span className="absolute inset-0 rounded-xl bg-rose-500 animate-ping opacity-30"></span>
                  <MicOff className="w-5 h-5 relative z-10" />
                </>
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Send / Analyze Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isAnalyzing}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 transform active:scale-95"
              title="تحليل وإضافة المصروف"
            >
              {isAnalyzing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 rotate-180" />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Speech Error Warning */}
      {speechError && (
        <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl animate-fade-in flex items-center gap-2">
          <span>⚠️ {speechError}</span>
        </div>
      )}
    </div>
  );
}
