"use client";

import React from "react";
import { LayoutDashboard, ListFilter, BarChart3, Plus } from "lucide-react";

interface BottomNavProps {
  activeTab: "dashboard" | "transactions" | "reports";
  setActiveTab: (tab: "dashboard" | "transactions" | "reports") => void;
  onOpenAddModal: () => void;
}

export function BottomNav({ activeTab, setActiveTab, onOpenAddModal }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-lg px-4 py-2 sm:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === "dashboard" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">الرئيسية</span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === "transactions" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <ListFilter className="w-5 h-5" />
          <span className="text-[10px]">العمليات</span>
        </button>

        {/* Center Floating Action Button (FAB) */}
        <button
          onClick={onOpenAddModal}
          className="relative -top-4 w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all"
          title="إضافة مصروف يدوي"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === "reports" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-white"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">التقارير</span>
        </button>
      </div>
    </nav>
  );
}
