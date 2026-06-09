import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
