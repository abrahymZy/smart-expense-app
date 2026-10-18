import { NextRequest, NextResponse } from "next/server";
import { serverDB } from "@/lib/server/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, avatar } = body;

    const userEmail = email || "google_user@gmail.com";
    const userName = name || "مستخدم Google";

    let user = serverDB.findUserByEmail(userEmail);

    if (!user) {
      user = serverDB.createUser({
        name: userName,
        email: userEmail,
        provider: "google",
      });
    }

    const { passwordHash: _, salt: __, ...safeUser } = user;
    if (avatar) {
      safeUser.avatar = avatar;
    }

    return NextResponse.json({
      success: true,
      user: safeUser,
      token: "session-" + user.id,
      message: "تم تسجيل الدخول عبر Google بنجاح",
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.json(
      { error: "فشل تسجيل الدخول عبر Google" },
      { status: 500 }
    );
  }
}
