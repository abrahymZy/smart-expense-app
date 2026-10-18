"use client";

import React, { useState, useMemo } from "react";
import { Expense, Category, PAYMENT_METHODS } from "@/types/expense";
import { formatCurrency } from "@/lib/currency";
import { Search, Filter, Edit3, Trash2, Plus, Calendar, CreditCard, MapPin, CheckCircle2, Clock } from "lucide-react";

interface TransactionsViewProps {
  expenses: Expense[];
  categories: Category[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onOpenAddModal: () => void;
}

export function TransactionsView({
  expenses,
  categories,
  onEditExpense,
  onDeleteExpense,
  onOpenAddModal,
}: TransactionsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = exp.title.toLowerCase().includes(q);
        const matchesLocation = exp.location?.toLowerCase().includes(q);
        const matchesNotes = exp.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocation && !matchesNotes) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && exp.category !== selectedCategory) {
        return false;
      }

      // Payment filter
      if (selectedPayment !== "all" && exp.paymentMethod !== selectedPayment) {
        return false;
      }

      // Date filter
      if (dateFilter === "today") {
        return exp.date === todayStr;
      } else if (dateFilter === "week") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const sevenDaysAgo = d.toISOString().split("T")[0];
        return exp.date >= sevenDaysAgo;
      } else if (dateFilter === "month") {
        const monthPrefix = todayStr.substring(0, 7);
        return exp.date.startsWith(monthPrefix);
      }

      return true;
    });
  }, [expenses, searchQuery, selectedCategory, selectedPayment, dateFilter, todayStr]);

  const totalFilteredAmount = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Action & Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="ابحث في المصروفات، الأماكن، أو الملاحظات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pr-10 pl-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة يدوي</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">كل الأوقات</option>
          <option value="today">اليوم</option>
          <option value="week">هذا الأسبوع</option>
          <option value="month">هذا الشهر</option>
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">جميع التصنيفات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        {/* Payment Filter */}
        <select
          value={selectedPayment}
          onChange={(e) => setSelectedPayment(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">جميع طرق الدفع</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>

        {/* Clear Filters if active */}
        {(searchQuery || selectedCategory !== "all" || selectedPayment !== "all" || dateFilter !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedPayment("all");
              setDateFilter("all");
            }}
            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 shrink-0"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* Filter summary bar */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span>
          عدد المصروفات: <strong className="text-white">{filteredExpenses.length}</strong>
        </span>
        <span>
          المجموع: <strong className="text-emerald-400 font-bold" dir="ltr">{formatCurrency(totalFilteredAmount)}</strong>
        </span>
      </div>

      {/* Expenses Cards List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500 text-xs">
          لا توجد نتائج مطابقة لبحثك أو الفلاتر المحددة.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map((exp) => {
            const cat = categories.find((c) => c.name === exp.category);
            return (
              <div
                key={exp.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg shrink-0 border border-slate-700/50 mt-0.5">
                      {cat?.icon || "🏷️"}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base leading-snug">
                        {exp.title}
                      </h4>

                      {/* Items details if bundled */}
                      {exp.items && exp.items.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {exp.items.map((it, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded-md"
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {exp.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {exp.paymentMethod}
                        </span>
                        {exp.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3 h-3 text-rose-400" />
                              {exp.location}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        {/* Sync status badge */}
                        <span
                          className={`flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full border ${
                            exp.syncStatus === "synced"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {exp.syncStatus === "synced" ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5" /> متزامن
                            </>
                          ) : (
                            <>
                              <Clock className="w-2.5 h-2.5" /> معلق
                            </>
                          )}
                        </span>
                      </div>

                      {exp.notes && (
                        <p className="text-xs text-slate-400 mt-2 italic bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40">
                          {exp.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="text-left shrink-0">
                    <div className="text-base sm:text-lg font-bold text-emerald-400" dir="ltr">
                      {formatCurrency(exp.amount)}
                    </div>

                    <div className="flex items-center gap-1 mt-2.5 justify-end">
                      <button
                        onClick={() => onEditExpense(exp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="تعديل المصروف"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="حذف المصروف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
