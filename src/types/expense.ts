import { z } from "zod";

// العملة الأساسية للتطبيق
export const DEFAULT_CURRENCY = "YER";
export const CURRENCY_SYMBOL = "﷼";

// طرق الدفع الافتراضية
export const PAYMENT_METHODS = [
  "نقدًا",
  "تحويل بنكي",
  "محفظة إلكترونية",
  "بطاقة",
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

// حالة المزامنة
export type SyncStatus = "synced" | "pending" | "failed" | "conflict";

// التصنيف
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

// التصنيفات الافتراضية المحددة في الوثيقة
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "طعام", icon: "🍳", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", isDefault: true },
  { id: "cat-2", name: "مواصلات", icon: "🚗", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", isDefault: true },
  { id: "cat-3", name: "تسوق", icon: "🛍️", color: "bg-pink-500/10 text-pink-400 border-pink-500/20", isDefault: true },
  { id: "cat-4", name: "منزل", icon: "🏠", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", isDefault: true },
  { id: "cat-5", name: "صحة", icon: "💊", color: "bg-teal-500/10 text-teal-400 border-teal-500/20", isDefault: true },
  { id: "cat-6", name: "تعليم", icon: "📚", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", isDefault: true },
  { id: "cat-7", name: "ترفيه", icon: "🎬", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", isDefault: true },
  { id: "cat-8", name: "فواتير", icon: "🧾", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", isDefault: true },
  { id: "cat-9", name: "أخرى", icon: "📦", color: "bg-slate-500/10 text-slate-400 border-slate-500/20", isDefault: true },
];

// عنصر المصروف المحفوظ
export interface Expense {
  id: string;
  userId?: string;
  title: string;
  items?: string[];
  amount: number;
  currency: string;
  category: string;
  paymentMethod: PaymentMethod;
  location?: string | null;
  notes?: string | null;
  date: string; // YYYY-MM-DD
  syncStatus: SyncStatus;
  syncVersion?: number;
  createdAt: number;
  updatedAt: number;
}

// عنصر المصروف المفرد المستخرج من النص
export const ParsedExpenseItemSchema = z.object({
  item: z.string().min(1, "اسم المصروف مطلوب"),
  items: z.array(z.string()).optional(),
  amount: z.number().positive("يجب أن يكون المبلغ أكبر من صفر"),
  currency: z.string().default(DEFAULT_CURRENCY),
  category: z.string().default("طعام"),
  payment_method: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  date: z.string().default(() => new Date().toISOString().split("T")[0]),
});

export type ParsedExpenseItem = z.infer<typeof ParsedExpenseItemSchema>;

// المخرج القياسي للتحليل الهجين (Local Parser و AI API)
export const ParsingResultSchema = z.object({
  expenses: z.array(ParsedExpenseItemSchema),
  confidence: z.number().min(0).max(1),
  needs_clarification: z.boolean(),
  clarification_question: z.string().nullable().optional(),
  raw_text: z.string().optional(),
  source: z.enum(["local", "ai"]).default("local"),
});

export type ParsingResult = z.infer<typeof ParsingResultSchema>;
