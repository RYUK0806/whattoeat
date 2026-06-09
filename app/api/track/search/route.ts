import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      city?: string;
      country?: string;
      mood?: string;
      tasteLevel?: string;
      cuisine?: string;
      budget?: string;
      preference?: string;
      restaurantsShown?: string;
    };
    await sql`
      INSERT INTO searches
        (city, country, mood, taste_level, cuisine, budget, preference, restaurants_shown)
      VALUES (
        ${body.city              ?? null},
        ${body.country           ?? null},
        ${body.mood              ?? null},
        ${body.tasteLevel        ?? null},
        ${body.cuisine           ?? null},
        ${body.budget            ?? null},
        ${body.preference        ?? null},
        ${body.restaurantsShown  ?? null}
      )
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
