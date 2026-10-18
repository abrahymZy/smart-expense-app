"use client";

import React, { useMemo } from "react";
import { Expense, Category } from "@/types/expense";
import { formatCurrency } from "@/lib/currency";
import { ArrowUpRight, TrendingUp, Calendar, Clock, CreditCard } from "lucide-react";

interface DashboardViewProps {
  expenses: Expense[];
  categories: Category[];
  onOpenTransactions: () => void;
  onOpenAddModal: () => void;
}

export function DashboardView({
  expenses,
  categories,
  onOpenTransactions,
  onOpenAddModal,
}: DashboardViewProps) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Today stats
  const todayExpenses = useMemo(
    () => expenses.filter((e) => e.date === todayStr),
    [expenses, todayStr]
  );
  const todayTotal = useMemo(
    () => todayExpenses.reduce((sum, e) => sum + e.amount, 0),
    [todayExpenses]
  );

  // Week stats (last 7 days)
  const weekTotal = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const sevenDaysAgo = d.toISOString().split("T")[0];
    return expenses
      .filter((e) => e.date >= sevenDaysAgo)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Month stats (current month)
  const monthTotal = useMemo(() => {
    const currentYearMonth = todayStr.substring(0, 7);
    return expenses
      .filter((e) => e.date.startsWith(currentYearMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  // Category breakdown for current month
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const current = map.get(e.category) || 0;
      map.set(e.category, current + e.amount);
    });

    const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;

    return Array.from(map.entries())
      .map(([name, amount]) => {
        const cat = categories.find((c) => c.name === name);
        return {
          name,
          amount,
          percentage: Math.round((amount / total) * 100),
          icon: cat?.icon || "🏷️",
          color: cat?.color || "bg-indigo-500",
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [expenses, categories]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero Card: Today Expenses */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/60 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            مصروفات اليوم
          </span>
          <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
            {todayExpenses.length} عملية
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight my-2" dir="ltr">
          {formatCurrency(todayTotal)}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-800/80">
          <div>
            <div className="text-[11px] text-slate-400">إجمالي الأسبوع</div>
            <div className="text-sm sm:text-base font-bold text-slate-200 mt-0.5" dir="ltr">
              {formatCurrency(weekTotal)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">إجمالي الشهر</div>
            <div className="text-sm sm:text-base font-bold text-slate-200 mt-0.5" dir="ltr">
              {formatCurrency(monthTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Top Categories Distribution */}
      {categoryStats.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              أعلى التصنيفات إنفاقاً
            </h3>
            <span className="text-xs text-slate-400">النسبة المئوية</span>
          </div>

          <div className="space-y-3.5">
            {categoryStats.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cat.icon}</span>
                    <span className="font-medium text-slate-200">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white" dir="ltr">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-slate-500 font-mono">({cat.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions Section */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            آخر المصروفات
          </h3>
          <button
            onClick={onOpenTransactions}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>عرض الكل</span>
            <ArrowUpRight className="w-3.5 h-3.5 rotate-45" />
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            لا توجد مصروفات مسجلة بعد. اكتب أو تحدث لإضافة أول مصروف!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {expenses.slice(0, 5).map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center text-base border border-slate-700/50">
                    {categories.find((c) => c.name === exp.category)?.icon || "🏷️"}
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{exp.title}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{exp.category}</span>
                      <span>•</span>
                      <span>{exp.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-400" dir="ltr">
                  {formatCurrency(exp.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
