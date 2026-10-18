// lib/db/indexed-db.ts
// قاعدة بيانات محلية عالية الموثوقية للعمل بدون إنترنت (Offline-First via IndexedDB)

import { Expense, Category, DEFAULT_CATEGORIES } from "@/types/expense";

const DB_NAME = "SmartExpenseDB";
const DB_VERSION = 1;
const STORE_EXPENSES = "expenses";
const STORE_CATEGORIES = "categories";

class OfflineDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("IndexedDB is only available in browser"));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // متجر المصروفات
          if (!db.objectStoreNames.contains(STORE_EXPENSES)) {
            const expStore = db.createObjectStore(STORE_EXPENSES, { keyPath: "id" });
            expStore.createIndex("date", "date", { unique: false });
            expStore.createIndex("syncStatus", "syncStatus", { unique: false });
          }

          // متجر التصنيفات
          if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
            db.createObjectStore(STORE_CATEGORIES, { keyPath: "id" });
          }
        };

        request.onsuccess = async (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // تهيئة التصنيفات الافتراضية إذا كانت فارغة
          try {
            const tx = db.transaction(STORE_CATEGORIES, "readwrite");
            const catStore = tx.objectStore(STORE_CATEGORIES);
            const countReq = catStore.count();
            countReq.onsuccess = () => {
              if (countReq.result === 0) {
                DEFAULT_CATEGORIES.forEach((cat) => catStore.put(cat));
              }
            };
          } catch (e) {
            console.warn("Failed to seed default categories:", e);
          }

          resolve(db);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  // === المصروفات (Expenses CRUD) ===

  public async getAllExpenses(): Promise<Expense[]> {
    if (typeof window === "undefined") return [];
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EXPENSES, "readonly");
      const store = tx.objectStore(STORE_EXPENSES);
      const req = store.getAll();

      req.onsuccess = () => {
        // ترتيب المصروفات من الأحدث إلى الأقدم
        const list = (req.result as Expense[]) || [];
        list.sort((a, b) => b.createdAt - a.createdAt);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async saveExpense(expense: Expense): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EXPENSES, "readwrite");
      const store = tx.objectStore(STORE_EXPENSES);
      const req = store.put(expense);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async updateExpense(expense: Expense): Promise<void> {
    return this.saveExpense(expense);
  }

  public async deleteExpense(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EXPENSES, "readwrite");
      const store = tx.objectStore(STORE_EXPENSES);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // === المزامنة (Sync Engine Support) ===

  public async getPendingExpenses(): Promise<Expense[]> {
    if (typeof window === "undefined") return [];
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EXPENSES, "readonly");
      const store = tx.objectStore(STORE_EXPENSES);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result as Expense[]) || [];
        const pending = list.filter((e) => e.syncStatus === "pending");
        resolve(pending);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async getPendingCount(): Promise<number> {
    const pending = await this.getPendingExpenses();
    return pending.length;
  }

  public async markAllSynced(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EXPENSES, "readwrite");
      const store = tx.objectStore(STORE_EXPENSES);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result as Expense[]) || [];
        list.forEach((item) => {
          if (item.syncStatus === "pending") {
            item.syncStatus = "synced";
            store.put(item);
          }
        });
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async mergeServerExpenses(serverExpenses: Expense[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EXPENSES, "readwrite");
      const store = tx.objectStore(STORE_EXPENSES);

      serverExpenses.forEach((exp) => {
        store.put({
          ...exp,
          syncStatus: "synced",
        });
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // === التصنيفات (Categories CRUD) ===

  public async getCategories(): Promise<Category[]> {
    if (typeof window === "undefined") return DEFAULT_CATEGORIES;
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CATEGORIES, "readonly");
      const store = tx.objectStore(STORE_CATEGORIES);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result as Category[]) || [];
        resolve(list.length > 0 ? list : DEFAULT_CATEGORIES);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async saveCategory(category: Category): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CATEGORIES, "readwrite");
      const store = tx.objectStore(STORE_CATEGORIES);
      const req = store.put(category);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteCategory(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CATEGORIES, "readwrite");
      const store = tx.objectStore(STORE_CATEGORIES);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const offlineDB = new OfflineDatabase();
