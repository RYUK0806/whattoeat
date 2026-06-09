import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RestaurantData {
  placeId:    string;
  name:       string;
  rating:     number | null;
  address:    string;
  priceLevel: number | null;
  isOpenNow:  boolean;
}

interface RawSuggestion {
  mealName:       string;
  mealIncludes:   string;
  restaurantName: string;
  estimatedPrice: string;
  emoji:          string;
  oneLiner:       string;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildSystemPrompt(city: string, country: string): string {
  const location = [city, country].filter(Boolean).join(", ") || "the user's location";
  return `You are a hyper-local food expert in ${location}. You know every restaurant, their best dishes, how they price their combos, and what suits different moods. You give real, specific, practical recommendations — not generic advice.`;
}

function buildUserPrompt(
  mood:           string,
  taste:          string,
  cuisine:        string,
  budget:         string,
  foodPref:       string,
  city:           string,
  country:        string,
  currencyCode:   string,
  currencySymbol: string,
  restaurants:    RestaurantData[]
): string {
  const location     = [city, country].filter(Boolean).join(", ") || "an unknown location";
  const budgetLabel  =
    budget === "pocket-friendly" ? "cheap/budget eats"
    : budget === "treat-yourself" ? "mid-range comfortable dining"
    : "premium/fine dining";
  const cuisineLabel =
    cuisine === "local"               ? "local/regional"
    : cuisine === "chinese-asian"     ? "Chinese/Asian"
    : cuisine === "italian-continental" ? "Italian/Continental"
    : cuisine === "street-food"       ? "street food"
    : "any cuisine (surprise me)";
  const exPrice = `~${currencySymbol}350`;

  const restaurantSection = restaurants.length > 0
    ? `Here are REAL open restaurants near them:\n${
        restaurants.map(r => {
          const parts = [`"${r.name}"`];
          if (r.rating)     parts.push(`★${r.rating}`);
          if (r.priceLevel !== null) parts.push(`price level ${r.priceLevel}/4`);
          if (r.address)    parts.push(r.address);
          return `  - ${parts.join(", ")}`;
        }).join("\n")
      }\n\nMatch EACH meal to one of these REAL restaurants (use exact name).`
    : `No specific restaurant data is available — suggest realistic local restaurant types for ${location}.`;

  return `The user is in ${location}.
- Mood: ${mood}
- Taste preference: ${taste}
- Cuisine wanted: ${cuisineLabel}
- Budget: ${budgetLabel}
- Dietary: ${foodPref}
- The user's local currency is [${currencyCode}]. Show ALL prices using [${currencySymbol}] only. Never use any other currency.

${restaurantSection}

Suggest exactly 5 complete meal combos from 5 different restaurants — full balanced meals people would actually order for delivery or dine-in (not single dishes). Each combo should have a starter or side + main + drink.

For each suggestion return:
- mealName: short catchy combo name
- mealIncludes: exactly what's in the combo (e.g. "Garlic Naan × 2 + Dal Makhani + Jeera Rice + Raita")
- restaurantName: exact name from the list above (or restaurant type if no list)
- estimatedPrice: realistic total in local currency, e.g. "${exPrice}"
- emoji: one fitting emoji
- oneLiner: punchy one-liner (max 10 words) explaining why this hits the spot

Reply ONLY with this JSON — no markdown, no extra text:
{
  "suggestions": [
    {
      "mealName": "...",
      "mealIncludes": "...",
      "restaurantName": "...",
      "estimatedPrice": "${exPrice}",
      "emoji": "🍛",
      "oneLiner": "..."
    },
    { ... },
    { ... },
    { ... },
    { ... }
  ]
}`;
}

// ─── Restaurant name fuzzy matcher ────────────────────────────────────────────

function matchRestaurant(
  aiName:      string,
  restaurants: RestaurantData[]
): RestaurantData | null {
  if (!restaurants.length) return null;
  const t = aiName.toLowerCase().trim();
  return (
    restaurants.find((r) => r.name.toLowerCase().trim() === t) ??
    restaurants.find((r) => {
      const n = r.name.toLowerCase();
      return n.includes(t) || t.includes(n);
    }) ??
    null
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GROQ_API_KEY is not set" }, { status: 500 });
  }

  let body: {
    mood:           string;
    taste:          string;
    cuisine:        string;
    budget:         string;
    foodPref:       string;
    city:           string;
    country:        string;
    currencyCode:   string;
    currencySymbol: string;
    restaurants:    RestaurantData[];
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    mood, taste, cuisine, budget, foodPref,
    city = "", country = "",
    currencyCode   = "USD",
    currencySymbol = "$",
    restaurants = [],
  } = body;

  if (!mood || !budget || !foodPref) {
    return Response.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const systemPrompt = buildSystemPrompt(city, country);
  const userPrompt   = buildUserPrompt(
    mood, taste, cuisine, budget, foodPref,
    city, country, currencyCode, currencySymbol, restaurants
  );

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:           GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt   },
        ],
        max_tokens:      1800,
        temperature:     0.85,
        response_format: { type: "json_object" },
      }),
    });
  } catch {
    return Response.json(
      { error: "Could not reach AI service" },
      { status: 502 }
    );
  }

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message ?? groqRes.statusText;
    if (groqRes.status === 401) return Response.json({ error: "Invalid API key"            }, { status: 401 });
    if (groqRes.status === 429) return Response.json({ error: "Rate limited — try again"   }, { status: 429 });
    return Response.json({ error: `AI error: ${msg}` }, { status: 502 });
  }

  try {
    const groqData = (await groqRes.json()) as {
      choices: { message: { content: string } }[];
    };
    const raw = groqData.choices?.[0]?.message?.content ?? "";

    let parsed: unknown = JSON.parse(raw.trim());
    let rawList: RawSuggestion[];

    if (Array.isArray(parsed)) {
      rawList = parsed as RawSuggestion[];
    } else {
      const firstArr = Object.values(
        parsed as Record<string, unknown>
      ).find(Array.isArray) as RawSuggestion[] | undefined;
      if (!firstArr?.length)
        throw new SyntaxError("No suggestions array in AI response");
      rawList = firstArr;
    }

    const suggestions = rawList.slice(0, 5).map((s) => {
      const match = matchRestaurant(s.restaurantName, restaurants);
      return {
        mealName:       s.mealName,
        mealIncludes:   s.mealIncludes,
        restaurantName: s.restaurantName,
        estimatedPrice: s.estimatedPrice,
        emoji:          s.emoji,
        oneLiner:       s.oneLiner,
        placeId:        match?.placeId   ?? null,
        rating:         match?.rating    ?? null,
        isOpenNow:      match?.isOpenNow ?? null,
        address:        match?.address   ?? null,
      };
    });

    // Track Groq call + search — fire-and-forget, never blocks response
    sql`INSERT INTO api_calls (service, endpoint) VALUES ('groq', 'chat/completions')`.catch(() => {});
    sql`
      INSERT INTO searches
        (city, country, mood, taste_level, cuisine, budget, preference, restaurants_shown)
      VALUES (
        ${city}, ${country}, ${mood}, ${taste}, ${cuisine}, ${budget},
        ${foodPref}, ${String(restaurants.length)}
      )
    `.catch(() => {});

    return Response.json({ suggestions });
  } catch (err) {
    console.error("Suggest parse error:", err);
    if (err instanceof SyntaxError)
      return Response.json({ error: "Failed to parse AI response — please try again" }, { status: 500 });
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
