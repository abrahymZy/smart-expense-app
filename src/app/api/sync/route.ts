import { NextRequest, NextResponse } from "next/server";
import { serverDB } from "@/lib/server/db";
import { Expense } from "@/types/expense";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const operations: Array<{
      id: string;
      operation: "create" | "update" | "delete";
      expense: Expense;
    }> = body?.operations || [];

    // استخراج معرف المستخدم من الـ Header أو من جسم الطلب
    let userId = "guest-user";
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer session-")) {
      userId = authHeader.replace("Bearer session-", "");
    } else if (body?.userId) {
      userId = body.userId;
    }

    // تطبيق العمليات على قاعدة البيانات السحابية المركزية مع عزل تام للمستخدم
    const updatedServerExpenses = serverDB.syncUserExpenses(userId, operations);

    return NextResponse.json({
      success: true,
      userId,
      syncedCount: operations.length,
      serverExpenses: updatedServerExpenses,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Cloud Sync API error:", error);
    return NextResponse.json(
      { error: "فشلت عملية المزامنة السحابية" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    let userId = "guest-user";
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer session-")) {
      userId = authHeader.replace("Bearer session-", "");
    }

    const expenses = serverDB.getUserExpenses(userId);
    return NextResponse.json({
      success: true,
      userId,
      expenses,
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    return NextResponse.json(
      { error: "فشل استرداد المصروفات السحابية" },
      { status: 500 }
    );
  }
}
