import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      city?: string;
      country?: string;
      lat?: number;
      lng?: number;
      device?: string;
      browser?: string;
    };
    await sql`
      INSERT INTO visits (city, country, lat, lng, device, browser)
      VALUES (
        ${body.city    ?? null},
        ${body.country ?? null},
        ${body.lat     ?? null},
        ${body.lng     ?? null},
        ${body.device  ?? null},
        ${body.browser ?? null}
      )
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
