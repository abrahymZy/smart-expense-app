"use client";

import React, { useState, useEffect } from "react";
import { Expense, Category, PAYMENT_METHODS, PaymentMethod } from "@/types/expense";
import { X, Check } from "lucide-react";

interface ExpenseEditModalProps {
  isOpen: boolean;
  expenseToEdit: Expense | null;
  categories: Category[];
  onClose: () => void;
  onSave: (expenseData: {
    id?: string;
    title: string;
    amount: number;
    category: string;
    paymentMethod: PaymentMethod;
    location: string;
    notes: string;
    date: string;
  }) => void;
}

export function ExpenseEditModal({
  isOpen,
  expenseToEdit,
  categories,
  onClose,
  onSave,
}: ExpenseEditModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("طعام");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("نقدًا");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmount(expenseToEdit.amount.toString());
      setCategory(expenseToEdit.category);
      setPaymentMethod(expenseToEdit.paymentMethod);
      setLocation(expenseToEdit.location || "");
      setNotes(expenseToEdit.notes || "");
      setDate(expenseToEdit.date);
    } else {
      setTitle("");
      setAmount("");
      setCategory("طعام");
      setPaymentMethod("نقدًا");
      setLocation("");
      setNotes("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSave({
      id: expenseToEdit?.id,
      title: title.trim(),
      amount: parsedAmount,
      category,
      paymentMethod,
      location: location.trim(),
      notes: notes.trim(),
      date,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-bold text-white text-lg mb-4">
          {expenseToEdit ? "تعديل المصروف" : "إضافة مصروف يدوي"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">اسم المصروف</label>
            <input
              type="text"
              required
              placeholder="مثلاً: وجبة غداء، فاتورة كهرباء..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">المبلغ (﷼ يمني)</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">التاريخ</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">التصنيف</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">طريقة الدفع</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">الموقع (اختياري)</label>
            <input
              type="text"
              placeholder="مثلاً: مطعم الحاج، سوبرماركت الهدى..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">ملاحظات (اختياري)</label>
            <textarea
              rows={2}
              placeholder="أضف أي تفاصيل إضافية..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Check className="w-4 h-4" />
              <span>{expenseToEdit ? "حفظ التعديلات" : "إضافة المصروف"}</span>
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
