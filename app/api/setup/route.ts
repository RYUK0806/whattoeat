import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS visits (
        id        SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        city      TEXT,
        country   TEXT,
        lat       FLOAT,
        lng       FLOAT,
        device    TEXT,
        browser   TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS searches (
        id                SERIAL PRIMARY KEY,
        timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        city              TEXT,
        country           TEXT,
        mood              TEXT,
        taste_level       TEXT,
        cuisine           TEXT,
        budget            TEXT,
        preference        TEXT,
        restaurants_shown TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS api_calls (
        id        SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        service   TEXT NOT NULL,
        endpoint  TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        id                  SERIAL PRIMARY KEY,
        app_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
        maintenance_message TEXT    NOT NULL DEFAULT 'We are taking a short break'
      )
    `;

    // Seed one settings row if none exists
    await sql`
      INSERT INTO app_settings (app_enabled, maintenance_message)
      SELECT TRUE, 'We are taking a short break'
      WHERE NOT EXISTS (SELECT 1 FROM app_settings)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notify_emails (
        id        SERIAL PRIMARY KEY,
        email     TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    return NextResponse.json({ ok: true, message: "All tables ready" });
  } catch (err) {
    console.error("[setup]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
