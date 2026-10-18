"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Expense, Category, DEFAULT_CATEGORIES, PaymentMethod, ParsingResult } from "@/types/expense";
import { offlineDB } from "@/lib/db/indexed-db";
import { parseExpenseLocally } from "@/lib/parser/local-parser";
import { speechRecognizer } from "@/lib/speech";
import { useAuth } from "@/context/AuthContext";
import { isFirebaseConfigured, auth } from "@/lib/firebase/config";
import {
  syncBatchExpensesToFirestore,
  getExpensesFromFirestore,
  syncExpenseToFirestore,
  syncCategoriesToFirestore,
  getCategoriesFromFirestore,
} from "@/lib/firebase/firestore";

// Modular Components
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { ExpenseInputBar } from "@/components/ExpenseInputBar";
import { ClarificationModal } from "@/components/ClarificationModal";
import { ReviewModal } from "@/components/ReviewModal";
import { DashboardView } from "@/components/DashboardView";
import { TransactionsView } from "@/components/TransactionsView";
import { ReportsView } from "@/components/ReportsView";
import { ExpenseEditModal } from "@/components/ExpenseEditModal";
import { CategoriesModal } from "@/components/CategoriesModal";
import { BottomNav } from "@/components/BottomNav";

export default function SmartExpenseApp() {
  const { user } = useAuth();

  // === State: Data & Storage ===
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // === State: Navigation & Tabs ===
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "reports">("dashboard");

  // === State: Smart NLP & Voice Input ===
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // === State: Modals ===
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [clarificationData, setClarificationData] = useState<{
    question: string;
    rawText: string;
    pendingAmount?: number;
  } | null>(null);
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [reviewResult, setReviewResult] = useState<ParsingResult | null>(null);

  // 1. Initial Load & Connectivity Listeners
  const refreshData = useCallback(async () => {
    try {
      const [cats, exps, pending] = await Promise.all([
        offlineDB.getCategories(),
        offlineDB.getAllExpenses(),
        offlineDB.getPendingCount(),
      ]);
      setCategories(cats);
      setExpenses(exps);
      setPendingSyncCount(pending);
    } catch (err) {
      console.error("Failed to load local data:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshData();

    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshData]);

  // 2. Cloud Sync Engine (Firebase Firestore & Server Fallback)
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const pendingExpenses = await offlineDB.getPendingExpenses();

      // إذا كان Firebase مفعلاً ولدينا مستخدم مسجل فعلياً في Firebase، المزامنة مباشرة مع Cloud Firestore
      if (isFirebaseConfigured() && user?.id && auth?.currentUser) {
        if (pendingExpenses.length > 0) {
          const operations = pendingExpenses.map((e) => ({
            id: e.id,
            operation: "create" as const,
            expense: e,
          }));
          await syncBatchExpensesToFirestore(user.id, operations);
          await offlineDB.markAllSynced();
        }

        // جلب أي مصروفات جديدة من سحابة Firestore لضمان التزامن بين الأجهزة
        const remoteExpenses = await getExpensesFromFirestore(user.id);
        if (remoteExpenses && remoteExpenses.length > 0) {
          await offlineDB.mergeServerExpenses(remoteExpenses);
        }
        // مزامنة التصنيفات المخصصة مع Firestore
        const remoteCats = await getCategoriesFromFirestore(user.id);
        if (remoteCats && remoteCats.length > 0) {
          for (const cat of remoteCats) {
            await offlineDB.saveCategory(cat);
          }
        } else {
          const localCats = await offlineDB.getCategories();
          if (localCats.length > 0) {
            await syncCategoriesToFirestore(user.id, localCats);
          }
        }

        await refreshData();
      } else {
        // Fallback عبر API Server المحلي
        const operations = pendingExpenses.map((e) => ({
          id: "sync-" + e.id,
          operation: "create" as const,
          expense: e,
        }));

        const res = await fetch("/api/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: user ? `Bearer session-${user.id}` : "",
          },
          body: JSON.stringify({ operations, userId: user?.id || "guest-user" }),
        });

        if (res.ok) {
          const data = await res.json();
          await offlineDB.markAllSynced();
          if (data.serverExpenses && Array.isArray(data.serverExpenses)) {
            await offlineDB.mergeServerExpenses(data.serverExpenses);
          }
          await refreshData();
        }
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, user, refreshData]);

  // مزامنة سحابية تلقائية فور تسجيل دخول المستخدم
  useEffect(() => {
    if (user?.id) {
      triggerSync();
    }
  }, [user?.id, triggerSync]);

  // 3. Voice Input Toggle
  const handleToggleListening = () => {
    setSpeechError(null);
    if (isListening) {
      speechRecognizer.stop();
      setIsListening(false);
    } else {
      if (!speechRecognizer.isSupported()) {
        setSpeechError("المتصفح لا يدعم التعرف على الصوت. يرجى استخدام متصفح حديث مثل Chrome.");
        return;
      }
      setIsListening(true);
      speechRecognizer.start(
        (transcript) => {
          setInputText(transcript);
          setIsListening(false);
          analyzeText(transcript);
        },
        (error) => {
          setSpeechError(error);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  // 4. Smart NLP Analysis (Local + Hybrid Fallback)
  const analyzeText = async (textToParse: string) => {
    const trimmed = textToParse.trim();
    if (!trimmed) return;

    setIsAnalyzing(true);
    try {
      // Step A: Local Fast Parser
      const local = parseExpenseLocally(trimmed);

      if (local.needs_clarification) {
        setClarificationData({
          question: local.clarification_question || "ما الذي دفعت عليه هذا المبلغ؟",
          rawText: trimmed,
          pendingAmount: local.expenses[0]?.amount,
        });
        return;
      }

      if (local.confidence >= 0.85 && local.expenses.length > 0) {
        setReviewResult(local);
        return;
      }

      // Step B: AI Fallback via API Route
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      if (res.ok) {
        const aiResult: ParsingResult = await res.json();
        if (aiResult.needs_clarification) {
          setClarificationData({
            question: aiResult.clarification_question || "يرجى توضيح تفاصيل المصروف",
            rawText: trimmed,
          });
        } else if (aiResult.expenses && aiResult.expenses.length > 0) {
          setReviewResult(aiResult);
        } else {
          // Fallback to local
          setReviewResult(local);
        }
      } else {
        setReviewResult(local);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      const fallback = parseExpenseLocally(trimmed);
      setReviewResult(fallback);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      analyzeText(inputText);
    }
  };

  // 5. Save Confirmed Parsed Expenses
  const handleConfirmReview = async () => {
    if (!reviewResult || !reviewResult.expenses) return;

    for (const item of reviewResult.expenses) {
      const newExp: Expense = {
        id: "exp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        userId: user?.id,
        title: item.item,
        items: item.items,
        amount: item.amount,
        currency: item.currency || "YER",
        category: item.category || "طعام",
        paymentMethod: (item.payment_method as PaymentMethod) || "نقدًا",
        location: item.location || null,
        notes: item.notes || null,
        date: item.date || new Date().toISOString().split("T")[0],
        syncStatus: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await offlineDB.saveExpense(newExp);
    }

    setReviewResult(null);
    setInputText("");
    await refreshData();
    triggerSync();
  };

  // 6. Handle Clarification Response
  const handleClarificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationData || !clarificationAnswer.trim()) return;

    const mergedText = `${clarificationData.rawText} ${clarificationAnswer}`;
    setClarificationData(null);
    setClarificationAnswer("");
    analyzeText(mergedText);
  };

  // 7. Manual Add / Edit
  const handleSaveManualExpense = async (data: {
    id?: string;
    title: string;
    amount: number;
    category: string;
    paymentMethod: PaymentMethod;
    location: string;
    notes: string;
    date: string;
  }) => {
    const expense: Expense = {
      id: data.id || "exp-" + Date.now(),
      userId: user?.id,
      title: data.title,
      amount: data.amount,
      currency: "YER",
      category: data.category,
      paymentMethod: data.paymentMethod,
      location: data.location || null,
      notes: data.notes || null,
      date: data.date,
      syncStatus: "pending",
      createdAt: data.id ? editingExpense?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
    };

    await offlineDB.saveExpense(expense);
    setEditingExpense(null);
    await refreshData();
    triggerSync();
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      const exp = expenses.find((e) => e.id === id);
      await offlineDB.deleteExpense(id);
      await refreshData();
      if (isFirebaseConfigured() && user?.id && auth?.currentUser && exp) {
        await syncExpenseToFirestore(user.id, "delete", exp);
      }
    }
  };

  // 8. Categories Management
  const handleAddCategory = async (cat: Category) => {
    await offlineDB.saveCategory(cat);
    await refreshData();
    if (isFirebaseConfigured() && user?.id && auth?.currentUser) {
      const allCats = await offlineDB.getCategories();
      await syncCategoriesToFirestore(user.id, allCats);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await offlineDB.deleteCategory(id);
    await refreshData();
    if (isFirebaseConfigured() && user?.id && auth?.currentUser) {
      const allCats = await offlineDB.getCategories();
      await syncCategoriesToFirestore(user.id, allCats);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 pb-20 sm:pb-8">
      {/* 1. Header */}
      <Header
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        onSync={triggerSync}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenCategories={() => setIsCatModalOpen(true)}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6 space-y-5">
        {/* Smart Input Section (Always prominent on top) */}
        <section className="bg-slate-900/40 p-4 sm:p-5 rounded-3xl border border-slate-800/80 shadow-xl backdrop-blur-md">
          <ExpenseInputBar
            inputText={inputText}
            setInputText={setInputText}
            isListening={isListening}
            isAnalyzing={isAnalyzing}
            speechError={speechError}
            onToggleListening={handleToggleListening}
            onSubmit={handleInputSubmit}
          />
        </section>

        {/* Desktop Tab Selector */}
        <div className="hidden sm:flex items-center justify-center gap-2 bg-slate-900/60 p-1 rounded-2xl max-w-md mx-auto border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            لوحة التحكم
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "transactions"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            العمليات ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === "reports"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            التقارير والإحصائيات
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === "dashboard" && (
          <DashboardView
            expenses={expenses}
            categories={categories}
            onOpenTransactions={() => setActiveTab("transactions")}
            onOpenAddModal={() => {
              setEditingExpense(null);
              setIsEditModalOpen(true);
            }}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionsView
            expenses={expenses}
            categories={categories}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setIsEditModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
            onOpenAddModal={() => {
              setEditingExpense(null);
              setIsEditModalOpen(true);
            }}
          />
        )}

        {activeTab === "reports" && (
          <ReportsView expenses={expenses} categories={categories} />
        )}
      </main>

      {/* 3. Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingExpense(null);
          setIsEditModalOpen(true);
        }}
      />

      {/* 4. Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => triggerSync()}
      />

      <ClarificationModal
        data={clarificationData}
        answer={clarificationAnswer}
        setAnswer={setClarificationAnswer}
        onClose={() => setClarificationData(null)}
        onSubmit={handleClarificationSubmit}
      />

      <ReviewModal
        result={reviewResult}
        onClose={() => setReviewResult(null)}
        onConfirm={handleConfirmReview}
        onEditManual={() => {
          if (reviewResult?.expenses?.[0]) {
            const first = reviewResult.expenses[0];
            setEditingExpense({
              id: "",
              title: first.item,
              amount: first.amount,
              currency: first.currency || "YER",
              category: first.category || "طعام",
              paymentMethod: (first.payment_method as PaymentMethod) || "نقدًا",
              location: first.location || null,
              notes: first.notes || null,
              date: first.date || new Date().toISOString().split("T")[0],
              syncStatus: "pending",
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            setReviewResult(null);
            setIsEditModalOpen(true);
          }
        }}
      />

      <ExpenseEditModal
        isOpen={isEditModalOpen}
        expenseToEdit={editingExpense}
        categories={categories}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveManualExpense}
      />

      <CategoriesModal
        isOpen={isCatModalOpen}
        categories={categories}
        onClose={() => setIsCatModalOpen(false)}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
}
