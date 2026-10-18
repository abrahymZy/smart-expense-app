"use client";

import React, { useState } from "react";
import { Category } from "@/types/expense";
import { X, Plus, Trash2, Tag } from "lucide-react";

interface CategoriesModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const EMOJI_OPTIONS = ["🍔", "🚕", "🛒", "🏡", "💊", "🎓", "🎮", "⚡", "🎁", "☕", "✈️", "🏋️"];

export function CategoriesModal({
  isOpen,
  categories,
  onClose,
  onAddCategory,
  onDeleteCategory,
}: CategoriesModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCategory: Category = {
      id: "cat-" + Date.now(),
      name: name.trim(),
      icon,
      color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      isDefault: false,
    };

    onAddCategory(newCategory);
    setName("");
    setIcon("🏷️");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">إدارة التصنيفات</h3>
            <p className="text-xs text-slate-400">تخصيص وإضافة تصنيفات جديدة للمصروفات</p>
          </div>
        </div>

        {/* Existing categories list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{cat.icon}</span>
                <span className="font-medium text-white text-xs sm:text-sm">{cat.name}</span>
                {cat.isDefault && (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
                    افتراضي
                  </span>
                )}
              </div>

              {!cat.isDefault && (
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="حذف التصنيف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new category form */}
        <form onSubmit={handleAdd} className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 text-base focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {EMOJI_OPTIONS.map((em, i) => (
                  <option key={i} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              required
              placeholder="اسم التصنيف الجديد..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
