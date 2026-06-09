import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`
      SELECT app_enabled, maintenance_message FROM app_settings LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ enabled: true, message: "" });
    return NextResponse.json({
      enabled: rows[0].app_enabled,
      message:  rows[0].maintenance_message ?? "",
    });
  } catch {
    // If DB is unreachable, keep the app running
    return NextResponse.json({ enabled: true, message: "" });
  }
}
