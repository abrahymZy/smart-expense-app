// src/lib/firebase/firestore.ts
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  writeBatch,
  query,
  orderBy,
  Firestore,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";
import { Expense, Category } from "@/types/expense";

/**
 * مزامنة المصروفات مع Cloud Firestore
 * يتم تخزين كل مصروف في مسار آمن معزول للمستخدم:
 * users/{userId}/expenses/{expenseId}
 */
export async function syncExpenseToFirestore(
  userId: string,
  operation: "create" | "update" | "delete",
  expense: Expense
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    const expenseDocRef = doc(db, "users", userId, "expenses", expense.id);

    if (operation === "delete") {
      await deleteDoc(expenseDocRef);
    } else {
      await setDoc(
        expenseDocRef,
        {
          ...expense,
          userId,
          syncStatus: "synced",
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }
    return true;
  } catch (error) {
    console.error("Firestore single expense sync error:", error);
    return false;
  }
}

/**
 * مزامنة دفعة من المصروفات المعلقة (Batch Sync)
 */
export async function syncBatchExpensesToFirestore(
  userId: string,
  operations: Array<{
    id: string;
    operation: "create" | "update" | "delete";
    expense: Expense;
  }>
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db || operations.length === 0) return false;

  try {
    const batch = writeBatch(db);

    for (const op of operations) {
      const docRef = doc(db, "users", userId, "expenses", op.id);
      if (op.operation === "delete") {
        batch.delete(docRef);
      } else {
        batch.set(
          docRef,
          {
            ...op.expense,
            userId,
            syncStatus: "synced",
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Firestore batch sync error:", error);
    return false;
  }
}

/**
 * جلب جميع مصروفات المستخدم من Firestore (عند تسجيل الدخول في جهاز جديد مثلاً)
 */
export async function getExpensesFromFirestore(userId: string): Promise<Expense[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const expensesCol = collection(db, "users", userId, "expenses");
    const q = query(expensesCol, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId,
        title: data.title || "",
        items: data.items || [],
        amount: Number(data.amount) || 0,
        currency: data.currency || "YER",
        category: data.category || "طعام",
        paymentMethod: data.paymentMethod || "نقدًا",
        location: data.location || null,
        notes: data.notes || null,
        date: data.date || new Date().toISOString().split("T")[0],
        syncStatus: "synced",
        syncVersion: data.syncVersion || 1,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      } as Expense;
    });
  } catch (error) {
    console.error("Firestore fetch expenses error:", error);
    return [];
  }
}

/**
 * مزامنة التصنيفات المخصصة مع Firestore
 * users/{userId}/categories/{categoryId}
 */
export async function syncCategoriesToFirestore(
  userId: string,
  categories: Category[]
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  try {
    const batch = writeBatch(db);
    for (const cat of categories) {
      const catDoc = doc(db, "users", userId, "categories", cat.id);
      batch.set(catDoc, cat, { merge: true });
    }
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Firestore sync categories error:", error);
    return false;
  }
}

/**
 * استرجاع التصنيفات المخصصة من Firestore
 */
export async function getCategoriesFromFirestore(userId: string): Promise<Category[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const catsCol = collection(db, "users", userId, "categories");
    const snapshot = await getDocs(catsCol);
    return snapshot.docs.map((d) => d.data() as Category);
  } catch (error) {
    console.error("Firestore fetch categories error:", error);
    return [];
  }
}
