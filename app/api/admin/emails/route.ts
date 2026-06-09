import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const emails = await sql`
      SELECT email, timestamp FROM notify_emails ORDER BY timestamp DESC
    `;
    return NextResponse.json({ emails });
  } catch (err) {
    console.error("[admin/emails]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
