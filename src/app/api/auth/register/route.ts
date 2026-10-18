import { NextRequest, NextResponse } from "next/server";
import { serverDB } from "@/lib/server/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const existingUser = serverDB.findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مسجل مسبقاً" },
        { status: 409 }
      );
    }

    const user = serverDB.createUser({
      name,
      email,
      password,
      provider: "email",
    });

    return NextResponse.json({
      success: true,
      user,
      message: "تم إنشاء الحساب بنجاح",
    });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 }
    );
  }
}
