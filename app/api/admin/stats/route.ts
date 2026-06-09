import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

const GOOGLE_AUTO_PAUSE = 9000;

export async function GET() {
  try {
    const [
      totalVisits,
      todayVisits,
      todaySearches,
      uniqueCities,
      topMoods,
      topCuisines,
      deviceBreakdown,
      topCities,
      googleCalls,
      groqCalls,
      recentSearches,
      settings,
    ] = await Promise.all([
      sql`SELECT COUNT(*) AS count FROM visits`,
      sql`SELECT COUNT(*) AS count FROM visits WHERE timestamp >= CURRENT_DATE`,
      sql`SELECT COUNT(*) AS count FROM searches WHERE timestamp >= CURRENT_DATE`,
      sql`SELECT COUNT(DISTINCT city) AS count FROM visits WHERE city IS NOT NULL AND city <> ''`,
      sql`SELECT mood, COUNT(*) AS count FROM searches WHERE mood IS NOT NULL GROUP BY mood ORDER BY count DESC LIMIT 5`,
      sql`SELECT cuisine, COUNT(*) AS count FROM searches WHERE cuisine IS NOT NULL GROUP BY cuisine ORDER BY count DESC LIMIT 5`,
      sql`SELECT device, COUNT(*) AS count FROM visits WHERE device IS NOT NULL GROUP BY device`,
      sql`SELECT city, COUNT(*) AS count FROM visits WHERE city IS NOT NULL AND city <> '' GROUP BY city ORDER BY count DESC LIMIT 10`,
      sql`SELECT COUNT(*) AS count FROM api_calls WHERE service = 'google' AND timestamp >= DATE_TRUNC('month', NOW())`,
      sql`SELECT COUNT(*) AS count FROM api_calls WHERE service = 'groq'   AND timestamp >= DATE_TRUNC('month', NOW())`,
      sql`SELECT timestamp, city, mood, taste_level, cuisine, budget, preference FROM searches ORDER BY timestamp DESC LIMIT 50`,
      sql`SELECT app_enabled, maintenance_message FROM app_settings LIMIT 1`,
    ]);

    const gCalls = Number(googleCalls[0]?.count ?? 0);

    // Auto-pause if Google quota is critically high
    if (gCalls >= GOOGLE_AUTO_PAUSE) {
      await sql`
        UPDATE app_settings SET app_enabled = FALSE
        WHERE app_enabled = TRUE
      `.catch(() => {});
    }

    return NextResponse.json({
      totalVisits:     Number(totalVisits[0]?.count   ?? 0),
      todayVisits:     Number(todayVisits[0]?.count   ?? 0),
      todaySearches:   Number(todaySearches[0]?.count ?? 0),
      uniqueCities:    Number(uniqueCities[0]?.count  ?? 0),
      topMoods:        topMoods,
      topCuisines:     topCuisines,
      deviceBreakdown: deviceBreakdown,
      topCities:       topCities,
      googleCalls:     gCalls,
      groqCalls:       Number(groqCalls[0]?.count ?? 0),
      recentSearches:  recentSearches,
      settings:        settings[0] ?? { app_enabled: true, maintenance_message: "We are taking a short break" },
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
