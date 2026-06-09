import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { message } = (await req.json()) as { message: string };
    await sql`UPDATE app_settings SET maintenance_message = ${message}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/settings]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
