"use client";

import React, { useState, useMemo } from "react";
import { Expense, Category } from "@/types/expense";
import { formatCurrency } from "@/lib/currency";
import { BarChart3, PieChart, Calendar, TrendingUp } from "lucide-react";

interface ReportsViewProps {
  expenses: Expense[];
  categories: Category[];
}

export function ReportsView({ expenses, categories }: ReportsViewProps) {
  const [period, setPeriod] = useState<"week" | "month">("month");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Filter expenses by selected period
  const periodExpenses = useMemo(() => {
    if (period === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const sevenDaysAgo = d.toISOString().split("T")[0];
      return expenses.filter((e) => e.date >= sevenDaysAgo);
    } else {
      const currentMonthPrefix = todayStr.substring(0, 7);
      return expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
    }
  }, [expenses, period, todayStr]);

  const totalPeriodAmount = useMemo(
    () => periodExpenses.reduce((sum, e) => sum + e.amount, 0),
    [periodExpenses]
  );

  // Daily average
  const dailyAverage = useMemo(() => {
    const days = period === "week" ? 7 : 30;
    return Math.round(totalPeriodAmount / days);
  }, [totalPeriodAmount, period]);

  // Daily breakdown for the bar chart
  const dailyChartData = useMemo(() => {
    const map = new Map<string, number>();
    const count = period === "week" ? 7 : 14;

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      map.set(key, 0);
    }

    periodExpenses.forEach((e) => {
      if (map.has(e.date)) {
        map.set(e.date, (map.get(e.date) || 0) + e.amount);
      }
    });

    const maxVal = Math.max(...Array.from(map.values()), 1);

    return Array.from(map.entries()).map(([date, amount]) => {
      const dayLabel = new Date(date).toLocaleDateString("ar-YE", { weekday: "short" });
      const percent = Math.round((amount / maxVal) * 100);
      return { date, dayLabel, amount, percent };
    });
  }, [periodExpenses, period]);

  // Categories distribution in period
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    periodExpenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });

    const total = totalPeriodAmount || 1;

    return Array.from(map.entries())
      .map(([name, amount]) => {
        const cat = categories.find((c) => c.name === name);
        return {
          name,
          amount,
          percentage: Math.round((amount / total) * 100),
          icon: cat?.icon || "🏷️",
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [periodExpenses, categories, totalPeriodAmount]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Period Switcher */}
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl max-w-xs mx-auto text-xs font-medium">
        <button
          onClick={() => setPeriod("week")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            period === "week"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          تقرير الأسبوع
        </button>
        <button
          onClick={() => setPeriod("month")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            period === "month"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          تقرير الشهر
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>إجمالي إنفاق {period === "week" ? "الأسبوع" : "الشهر"}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white" dir="ltr">
            {formatCurrency(totalPeriodAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {periodExpenses.length} عملية مسجلة
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>متوسط الإنفاق اليومي</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400" dir="ltr">
            {formatCurrency(dailyAverage)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">معدل الصرف اليومي المتوقع</div>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            رسم بياني للمصروفات اليومية
          </h3>
          <span className="text-xs text-slate-400">الريال اليمني</span>
        </div>

        <div className="flex items-end justify-between gap-1 sm:gap-2 h-44 pt-6 px-1 border-b border-slate-800">
          {dailyChartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div
                className="w-full max-w-[28px] bg-slate-800 group-hover:bg-indigo-500 rounded-t-lg transition-all relative flex items-center justify-center"
                style={{ height: `${Math.max(d.percent, 8)}%` }}
              >
                {d.amount > 0 && (
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-950 border border-slate-700 text-white text-[10px] py-1 px-1.5 rounded shadow pointer-events-none whitespace-nowrap z-20">
                    {formatCurrency(d.amount)}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-[32px]">
                {d.dayLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            توزيع المصروفات حسب التصنيف
          </h3>
          <span className="text-xs text-slate-400">الإجمالي: {periodExpenses.length}</span>
        </div>

        {categoryStats.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            لا توجد مصروفات في هذه الفترة
          </div>
        ) : (
          <div className="space-y-3">
            {categoryStats.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="font-medium text-slate-200">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white" dir="ltr">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-slate-500">({cat.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
