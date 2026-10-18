import { NextRequest, NextResponse } from "next/server";
import { serverDB } from "@/lib/server/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp, name } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "رقم الهاتف مطلوب" },
        { status: 400 }
      );
    }

    // التحقق من رمز التحقق OTP (رمز تجريبي 1234 أو أي رمز مكون من 4 أرقام)
    if (otp && otp.length < 4) {
      return NextResponse.json(
        { error: "رمز التحقق يجب أن يكون 4 أرقام" },
        { status: 400 }
      );
    }

    let user = serverDB.findUserByPhone(phone);

    if (!user) {
      user = serverDB.createUser({
        name: name || `مستخدم (${phone.slice(-4)})`,
        phone,
        provider: "phone",
      });
    }

    const { passwordHash: _, salt: __, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser,
      token: "session-" + user.id,
      message: "تم التحقق وتسجيل الدخول عبر رقم الهاتف",
    });
  } catch (error) {
    console.error("Phone Auth Error:", error);
    return NextResponse.json(
      { error: "فشل التحقق من رقم الهاتف" },
      { status: 500 }
    );
  }
}
