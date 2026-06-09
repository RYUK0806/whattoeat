import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

const PLACES_URL =
  "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

const CUISINE_KEYWORDS: Record<string, string> = {
  "local":               "local traditional regional cuisine restaurant",
  "chinese-asian":       "chinese asian thai japanese korean restaurant",
  "italian-continental": "italian pizza pasta continental european restaurant",
  "street-food":         "street food snacks chaat",
  "surprise":            "popular restaurant",
};

const FOOD_PREF_KEYWORDS: Record<string, string> = {
  veg:       "vegetarian",
  vegan:     "vegan vegetarian",
  "non-veg": "",
};

const BUDGET_PRICE_LEVELS: Record<string, number[]> = {
  "pocket-friendly": [0, 1],
  "treat-yourself":  [2],
  "go-all-out":      [3, 4],
};

interface PlacesResult {
  place_id: string;
  name: string;
  rating?: number;
  vicinity: string;
  price_level?: number;
  opening_hours?: { open_now?: boolean };
}

interface PlacesResponse {
  status: string;
  results: PlacesResult[];
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_PLACES_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: {
    lat: number;
    lng: number;
    cuisine: string;
    foodPref: string;
    budget: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lat, lng, cuisine, foodPref, budget } = body;

  if (!lat || !lng) {
    return Response.json(
      { error: "lat and lng are required" },
      { status: 400 }
    );
  }

  const keyword = [
    CUISINE_KEYWORDS[cuisine]      ?? "restaurant",
    FOOD_PREF_KEYWORDS[foodPref]   ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const url = new URL(PLACES_URL);
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", "5000");
  url.searchParams.set("type", "restaurant");
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("opennow", "true");   // only open right now
  url.searchParams.set("key", apiKey);

  let placesRes: Response;
  try {
    placesRes = await fetch(url.toString());
  } catch {
    return Response.json(
      { error: "Could not reach Google Places API" },
      { status: 502 }
    );
  }

  if (!placesRes.ok) {
    return Response.json(
      { error: `Google Places HTTP ${placesRes.status}` },
      { status: 502 }
    );
  }

  const data = (await placesRes.json()) as PlacesResponse;

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    const hint =
      data.status === "REQUEST_DENIED"
        ? " Check your API key has Places API enabled."
        : "";
    return Response.json(
      { error: `Google Places: ${data.status}.${hint}` },
      { status: 502 }
    );
  }

  const priceLevels = BUDGET_PRICE_LEVELS[budget] ?? [0, 1, 2, 3, 4];

  const restaurants = (data.results ?? [])
    // Keep restaurants whose price_level matches budget, or has no price_level set
    .filter(
      (r) =>
        r.price_level === undefined ||
        priceLevels.includes(r.price_level)
    )
    // Double-check open status (opennow param may not be 100% reliable)
    .filter((r) => r.opening_hours?.open_now !== false)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 12)
    .map((r) => ({
      placeId:    r.place_id,
      name:       r.name,
      rating:     r.rating ?? null,
      address:    r.vicinity,
      priceLevel: r.price_level ?? null,
      isOpenNow:  r.opening_hours?.open_now ?? true, // passed opennow filter → open
    }));

  // Track Google Places call — fire-and-forget, never blocks response
  sql`INSERT INTO api_calls (service, endpoint) VALUES ('google', 'places/nearbysearch')`.catch(() => {});

  // Auto-pause if monthly quota is critically high
  sql`
    UPDATE app_settings SET app_enabled = FALSE
    WHERE app_enabled = TRUE
    AND (
      SELECT COUNT(*) FROM api_calls
      WHERE service = 'google'
      AND timestamp >= DATE_TRUNC('month', NOW())
    ) >= 9000
  `.catch(() => {});

  return Response.json({ restaurants });
}
