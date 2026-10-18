import { NextRequest, NextResponse } from "next/server";
import { serverDB } from "@/lib/server/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    const user = serverDB.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    const isValid = serverDB.verifyPassword(user, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      );
    }

    const { passwordHash: _, salt: __, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser,
      token: "session-" + user.id,
      message: "تم تسجيل الدخول بنجاح",
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    );
  }
}
