import { NextRequest, NextResponse } from "next/server";
import { serverDB } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer session-")) {
      return NextResponse.json(
        { user: null, isAuthenticated: false },
        { status: 200 }
      );
    }

    const userId = authHeader.replace("Bearer session-", "");
    const user = serverDB.findUserById(userId);

    if (!user) {
      return NextResponse.json(
        { user: null, isAuthenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      user,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ user: null, isAuthenticated: false }, { status: 500 });
  }
}
