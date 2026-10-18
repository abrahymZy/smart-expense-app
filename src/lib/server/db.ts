import fs from "fs";
import path from "path";
import crypto from "crypto";
import { User } from "@/types/auth";
import { Expense } from "@/types/expense";

interface DatabaseSchema {
  users: Array<User & { passwordHash?: string; salt?: string }>;
  expenses: Record<string, Expense[]>; // Keyed by userId for strict isolation
}

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "server_store.json");

// Ensure DB directory and file exist
function initDB(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      users: [
        {
          id: "demo-user-1",
          name: "مستخدم تجريبي",
          email: "demo@expense.ye",
          provider: "email",
          createdAt: Date.now(),
        },
      ],
      expenses: {
        "demo-user-1": [],
      },
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    return { users: [], expenses: {} };
  }
}

function saveDB(data: DatabaseSchema) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export const serverDB = {
  // === Users Operations ===
  findUserByEmail(email: string) {
    const db = initDB();
    return db.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  },

  findUserByPhone(phone: string) {
    const db = initDB();
    return db.users.find((u) => u.phone === phone);
  },

  findUserById(id: string) {
    const db = initDB();
    const user = db.users.find((u) => u.id === id);
    if (!user) return null;
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  },

  createUser(payload: {
    name: string;
    email?: string;
    phone?: string;
    password?: string;
    provider: "email" | "google" | "phone";
  }): User {
    const db = initDB();
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = payload.password ? hashPassword(payload.password, salt) : undefined;

    const newUser = {
      id: "usr-" + crypto.randomUUID().slice(0, 8),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      provider: payload.provider,
      passwordHash,
      salt,
      createdAt: Date.now(),
    };

    db.users.push(newUser);
    if (!db.expenses[newUser.id]) {
      db.expenses[newUser.id] = [];
    }
    saveDB(db);

    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return safeUser;
  },

  verifyPassword(user: User & { passwordHash?: string; salt?: string }, password: string): boolean {
    if (!user.passwordHash || !user.salt) return false;
    const testHash = hashPassword(password, user.salt);
    return testHash === user.passwordHash;
  },

  // === User Expenses Isolation & Sync ===
  getUserExpenses(userId: string): Expense[] {
    const db = initDB();
    return db.expenses[userId] || [];
  },

  syncUserExpenses(userId: string, operations: Array<{ operation: "create" | "update" | "delete"; expense: Expense }>) {
    const db = initDB();
    if (!db.expenses[userId]) {
      db.expenses[userId] = [];
    }

    const currentExpenses = [...db.expenses[userId]];

    for (const op of operations) {
      const idx = currentExpenses.findIndex((e) => e.id === op.expense.id);

      if (op.operation === "delete") {
        if (idx !== -1) {
          currentExpenses.splice(idx, 1);
        }
      } else if (op.operation === "create" || op.operation === "update") {
        const itemToSave: Expense = {
          ...op.expense,
          userId,
          syncStatus: "synced",
          updatedAt: Date.now(),
        };

        if (idx !== -1) {
          currentExpenses[idx] = itemToSave;
        } else {
          currentExpenses.push(itemToSave);
        }
      }
    }

    db.expenses[userId] = currentExpenses;
    saveDB(db);

    return currentExpenses;
  },
};
