import { NextRequest, NextResponse } from "next/server";
import { createToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json()) as {
    username?: string;
    password?: string;
  };

  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;

  console.log("ALL ADMIN ENV VARS:", Object.keys(process.env).filter(k => k.includes("ADMIN")));

  console.log("DEBUG AUTH:", {
    envUsernameExists: !!process.env.ADMIN_USERNAME,
    envPasswordExists: !!process.env.ADMIN_PASSWORD,
    envUsername: process.env.ADMIN_USERNAME,
    inputUsername: username,
    usernameMatch: username?.trim() === process.env.ADMIN_USERNAME?.trim(),
    passwordMatch: password?.trim() === process.env.ADMIN_PASSWORD?.trim()
  });

  if (!validUser || !validPass) {
    return NextResponse.json(
      { error: "Admin credentials not configured" },
      { status: 500 }
    );
  }

  if (username !== validUser || password !== validPass) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createToken();
  const res   = NextResponse.json({ ok: true });

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   7 * 24 * 60 * 60, // 7 days in seconds
    path:     "/",
  });

  return res;
}
