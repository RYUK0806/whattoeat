"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mood      = "starving" | "lazy" | "comfort" | "adventurous" | "late-night" | "quick-bite" | "healthy" | "treating";
type Taste     = "mild" | "medium" | "spicy" | "extra-spicy";
type Cuisine   = "local" | "chinese-asian" | "italian-continental" | "street-food" | "surprise";
type Budget    = "pocket-friendly" | "treat-yourself" | "go-all-out";
type FoodPref  = "veg" | "non-veg" | "vegan";
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6; // 6 = results

interface Suggestion {
  mealName:       string;
  mealIncludes:   string;
  restaurantName: string;
  estimatedPrice: string;
  emoji:          string;
  oneLiner:       string;
  placeId:        string | null;
  rating:         number | null;
  isOpenNow:      boolean | null;
  address:        string | null;
}

interface RestaurantData {
  placeId:    string;
  name:       string;
  rating:     number | null;
  address:    string;
  priceLevel: number | null;
  isOpenNow:  boolean;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const MOODS: { value: Mood; label: string; emoji: string; desc: string; color: string }[] = [
  { value: "starving",    label: "Starving",          emoji: "😤", desc: "Need food NOW",        color: "#f97316" },
  { value: "lazy",        label: "Lazy",              emoji: "😴", desc: "Minimum effort",       color: "#a78bfa" },
  { value: "comfort",     label: "Comfort Food",      emoji: "🤗", desc: "Feeling low, need warmth", color: "#fb923c" },
  { value: "adventurous", label: "Adventurous",       emoji: "🌍", desc: "Try something new",    color: "#34d399" },
  { value: "late-night",  label: "Late Night",        emoji: "🌙", desc: "Midnight hunger",      color: "#818cf8" },
  { value: "quick-bite",  label: "Quick Bite",        emoji: "⚡", desc: "Not too hungry",       color: "#facc15" },
  { value: "healthy",     label: "Healthy Day",       emoji: "🥦", desc: "Eating clean",         color: "#22c55e" },
  { value: "treating",    label: "Treating Myself",   emoji: "🎉", desc: "Celebration vibes",    color: "#f472b6" },
];

const TASTES: { value: Taste; label: string; emoji: string; desc: string; color: string }[] = [
  { value: "mild",        label: "Mild",         emoji: "😌", desc: "Keep it simple",    color: "#60a5fa" },
  { value: "medium",      label: "Medium",       emoji: "😏", desc: "Little kick",       color: "#fb923c" },
  { value: "spicy",       label: "Spicy",        emoji: "🌶️", desc: "Bring the heat",   color: "#ef4444" },
  { value: "extra-spicy", label: "Extra Spicy",  emoji: "🔥", desc: "Fire mode",         color: "#dc2626" },
];

const CUISINES: { value: Cuisine; label: string; emoji: string; desc: string }[] = [
  { value: "local",               label: "Local / Regional",      emoji: "🏠", desc: "Homestyle & traditional"    },
  { value: "chinese-asian",       label: "Chinese / Asian",       emoji: "🍜", desc: "Noodles, dim sum & more"    },
  { value: "italian-continental", label: "Italian / Continental", emoji: "🍕", desc: "Pizza, pasta & European"    },
  { value: "street-food",         label: "Street Food",           emoji: "🛺", desc: "Chaat, rolls & snacks"      },
  { value: "surprise",            label: "Surprise Me!",          emoji: "🎲", desc: "Whatever's best near me"   },
];

const BUDGETS: { value: Budget; label: string; emoji: string; desc: string; color: string }[] = [
  { value: "pocket-friendly", label: "Pocket Friendly", emoji: "💸", desc: "Cheap eats, max value",    color: "#34d399" },
  { value: "treat-yourself",  label: "Treat Yourself",  emoji: "🍽️", desc: "Mid-range comfort",       color: "#f97316" },
  { value: "go-all-out",      label: "Go All Out",      emoji: "💎", desc: "Premium experience",       color: "#a78bfa" },
];

const FOOD_PREFS: { value: FoodPref; label: string; emoji: string; color: string }[] = [
  { value: "veg",     label: "Veg",     emoji: "🥕", color: "#22c55e" },
  { value: "non-veg", label: "Non-Veg", emoji: "🍗", color: "#f97316" },
  { value: "vegan",   label: "Vegan",   emoji: "🌱", color: "#34d399" },
];

const STEP_QUESTIONS: Record<WizardStep, string> = {
  1: "What's your mood today?",
  2: "How spicy do you want it?",
  3: "What kind of cuisine?",
  4: "What's your budget?",
  5: "Any food preference?",
  6: "",
};

// ─── Currency helpers (no hardcoded maps) ────────────────────────────────────

/**
 * Use the browser's Intl API to format a known currency code into its
 * display symbol for the user's locale.
 * e.g. getIntlSymbol("INR") → "₹"  (when locale is en-IN)
 *      getIntlSymbol("USD") → "$"
 */
function getIntlSymbol(code: string): string {
  for (const display of ["narrowSymbol", "symbol"] as const) {
    try {
      const parts = new Intl.NumberFormat(navigator.language, {
        style: "currency",
        currency: code,
        currencyDisplay: display,
      }).formatToParts(1);
      const sym = parts.find((p) => p.type === "currency")?.value;
      if (sym && sym !== code) return sym;
    } catch { /* try next */ }
  }
  return code; // last resort: return the code itself
}

/**
 * Look up the ISO-4217 currency code for a country via the free
 * restcountries.com API, then turn it into a display symbol via Intl.
 * Falls back to USD/$ on any failure.
 */
async function getCurrencyForCountry(
  countryCode: string   // ISO 3166-1 alpha-2, e.g. "in", "us"
): Promise<{ code: string; symbol: string }> {
  try {
    const ac  = new AbortController();
    const tid = setTimeout(() => ac.abort(), 5000);
    const res = await fetch(
      `https://restcountries.com/v3.1/alpha/${countryCode}?fields=currencies`,
      { signal: ac.signal }
    );
    clearTimeout(tid);
    if (!res.ok) throw new Error("restcountries error");
    const data = (await res.json()) as {
      currencies: Record<string, { name: string; symbol: string }>;
    };
    const entries = Object.entries(data.currencies ?? {});
    if (!entries.length) throw new Error("no currencies");
    const [code] = entries[0];
    return { code, symbol: getIntlSymbol(code) };
  } catch {
    return { code: "USD", symbol: "$" };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChoiceCard({
  selected,
  accentColor,
  onClick,
  disabled = false,
  children,
}: {
  selected:     boolean;
  accentColor?: string;
  onClick:      () => void;
  disabled?:    boolean;
  children:     React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={
        selected && accentColor
          ? {
              borderColor: accentColor,
              background:  `${accentColor}1a`,
              boxShadow:   `0 0 0 1px ${accentColor}50, 0 4px 24px ${accentColor}25`,
            }
          : undefined
      }
      className={`w-full cursor-pointer rounded-2xl border p-3.5 text-left transition-all duration-200
        ${selected
          ? "scale-[1.02]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8 hover:scale-[1.01]"
        }
        ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function SummaryBar({
  choices,
  onBack,
}: {
  choices: { step: WizardStep; emoji: string; label: string }[];
  onBack:  (step: WizardStep) => void;
}) {
  if (!choices.length) return null;
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {choices.map((c, i) => (
        <button
          key={c.step}
          onClick={() => onBack(c.step)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/15 text-xs text-zinc-300 hover:bg-white/15 hover:text-white transition-all cursor-pointer"
        >
          <span>{c.emoji}</span>
          <span>{c.label}</span>
          {i < choices.length - 1 && (
            <span className="text-zinc-600 ml-0.5">›</span>
          )}
        </button>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl skeleton shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 rounded-lg skeleton" />
            <div className="h-3 w-52 rounded skeleton"  />
            <div className="h-3 w-40 rounded skeleton"  />
          </div>
        </div>
        <div className="h-7 w-16 rounded-xl skeleton shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-28 rounded skeleton"   />
        <div className="h-5 w-16 rounded-full skeleton" />
      </div>
      <div className="h-3 w-56 rounded skeleton" />
      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-xl skeleton" />
        <div className="h-10 flex-1 rounded-xl skeleton" />
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="text-xs font-medium text-yellow-400">
      {"★".repeat(filled)}{"☆".repeat(5 - filled)}
      <span className="text-zinc-500 ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

function CitySearchInput({
  onFound,
}: {
  onFound: (result: { lat: number; lng: number; city: string; country: string; countryCode: string }) => void;
}) {
  const [value,   setValue]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = (await res.json()) as Array<{
        lat: string; lon: string;
        address?: {
          city?: string; town?: string; village?: string;
          county?: string; country?: string; country_code?: string;
        };
      }>;
      if (!data[0]) { setError("City not found — try a different name"); return; }
      const { lat, lon, address = {} } = data[0];
      onFound({
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        city:        address.city ?? address.town ?? address.village ?? address.county ?? q,
        country:     address.country ?? "",
        countryCode: address.country_code ?? "",
      });
    } catch {
      setError("Could not search — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col items-center gap-1.5">
      <div className="flex gap-2 w-full max-w-xs">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your city…"
          disabled={loading}
          className="flex-1 bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/60 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="px-4 py-2 rounded-xl bg-orange-500 text-black text-sm font-bold disabled:opacity-40 cursor-pointer transition-all hover:bg-orange-400"
        >
          {loading ? "…" : "→"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}

function ResultCard({ item, city, index }: { item: Suggestion; city: string; index: number }) {
  const viewUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${item.restaurantName} ${city}`.trim()
  )}`;
  const directionsUrl = item.placeId
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${item.restaurantName} ${item.address ?? ""}`.trim()
      )}&destination_place_id=${item.placeId}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${item.restaurantName} ${item.address ?? ""}`.trim()
      )}`;

  return (
    <div
      className="result-card rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-3"
      style={{ animationDelay: `${index * 140}ms` }}
    >
      {/* Meal header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-3xl shrink-0 leading-none mt-0.5">{item.emoji}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-white leading-snug">{item.mealName}</h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.mealIncludes}</p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1 whitespace-nowrap">
          {item.estimatedPrice}
        </span>
      </div>

      {/* Restaurant row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-white/90">{item.restaurantName}</span>
        {item.rating !== null && <StarRating rating={item.rating} />}
        <span className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
          ✓ Open Now
        </span>
      </div>

      {/* Why this */}
      <p className="text-sm text-zinc-400 italic leading-relaxed">
        &quot;{item.oneLiner}&quot;
      </p>

      {/* Action buttons */}
      <div className="flex gap-2 mt-1">
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-500 text-black text-sm font-bold hover:bg-orange-400 transition-all"
        >
          🔍 View Restaurant
        </a>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white text-sm font-semibold hover:bg-white/10 hover:border-white/25 transition-all"
        >
          📍 Get Directions
        </a>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  // ── Wizard state ──────────────────────────────────────────────────────────
  const [visibleStep,    setVisibleStep]    = useState<WizardStep>(1);
  const [isExiting,      setIsExiting]      = useState(false);
  const [isTransitioning,setIsTransitioning]= useState(false);

  // ── Choices ───────────────────────────────────────────────────────────────
  const [mood,     setMood]     = useState<Mood     | null>(null);
  const [taste,    setTaste]    = useState<Taste    | null>(null);
  const [cuisine,  setCuisine]  = useState<Cuisine  | null>(null);
  const [budget,   setBudget]   = useState<Budget   | null>(null);
  const [foodPref, setFoodPref] = useState<FoodPref | null>(null);

  // ── Geo / locale ──────────────────────────────────────────────────────────
  const [coords,         setCoords]        = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel,  setLocationLabel] = useState("");   // "Sector 62, Noida 201309, India"
  const [city,           setCity]          = useState("");   // for API calls
  const [country,        setCountry]       = useState("");
  const [currencyCode,   setCurrencyCode]  = useState("USD");
  const [currencySymbol, setCurrencySymbol]= useState("$");
  // "permission" → show modal  |  "detecting" → GPS running
  // "confirmed"  → show wizard |  "city-input" → denied, show search
  const [locationPhase,  setLocationPhase] = useState<"permission" | "detecting" | "confirmed" | "city-input">("permission");

  // ── Results ───────────────────────────────────────────────────────────────
  const [suggestions,  setSuggestions]  = useState<Suggestion[] | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [loadingStage, setLoadingStage] = useState<"restaurants" | "ai" | null>(null);
  const [apiError,     setApiError]     = useState<string | null>(null);

  /** Build a readable location label from a Nominatim address object */
  const buildLabel = (a: {
    suburb?: string; neighbourhood?: string; road?: string;
    city?: string; town?: string; village?: string; county?: string;
    postcode?: string; country?: string;
  }) => {
    const area    = a.suburb ?? a.neighbourhood ?? a.road ?? "";
    const cityStr = a.city ?? a.town ?? a.village ?? a.county ?? "";
    const pin     = a.postcode ?? "";
    const cntry   = a.country ?? "";
    // e.g. "Sector 62, Noida 201309, India"
    const parts: string[] = [];
    if (area)    parts.push(area);
    if (cityStr) parts.push(pin ? `${cityStr} ${pin}` : cityStr);
    if (cntry)   parts.push(cntry);
    return parts.join(", ");
  };

  /** Shared helper: take a resolved country code, fetch currency, update state */
  const applyCurrency = useCallback(async (cc: string) => {
    const { code, symbol } = await getCurrencyForCountry(cc);
    setCurrencyCode(code);
    setCurrencySymbol(symbol);
  }, []);

  /** Fire the browser GPS prompt (called when user clicks "Allow Location") */
  const requestGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationPhase("city-input");
      return;
    }
    setLocationPhase("detecting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json() as {
            address?: {
              suburb?: string; neighbourhood?: string; road?: string;
              city?: string; town?: string; village?: string;
              county?: string; postcode?: string;
              country?: string; country_code?: string;
            };
          };
          const a  = data.address ?? {};
          const cc = (a.country_code ?? "").toLowerCase();
          setCity(a.city ?? a.town ?? a.village ?? a.county ?? "");
          setCountry(a.country ?? "");
          setLocationLabel(buildLabel(a));
          await applyCurrency(cc);
          setLocationPhase("confirmed");
        } catch {
          // GPS worked but reverse-geocode failed — still usable
          setLocationLabel("Near your location");
          setLocationPhase("confirmed");
        }
      },
      () => setLocationPhase("city-input"),   // denied or timed out
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [applyCurrency]);

  /** Called by CitySearchInput when the user manually types a city */
  const handleCityFound = useCallback(
    async (result: { lat: number; lng: number; city: string; country: string; countryCode: string }) => {
      setCoords({ lat: result.lat, lng: result.lng });
      setCity(result.city);
      setCountry(result.country);
      setLocationLabel([result.city, result.country].filter(Boolean).join(", "));
      await applyCurrency(result.countryCode);
      setLocationPhase("confirmed");
    },
    [applyCurrency]
  );

  // ── Navigation ────────────────────────────────────────────────────────────
  const goTo = (step: WizardStep) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsExiting(true);
    setTimeout(() => {
      setVisibleStep(step);
      setIsExiting(false);
      // clear transitioning guard slightly after so enter animation plays fully
      setTimeout(() => setIsTransitioning(false), 320);
    }, 280);
  };

  // ── Go back to a step (from summary pill) ─────────────────────────────────
  const goBackTo = (step: WizardStep) => {
    if (step <= 1) setMood(null);
    if (step <= 2) setTaste(null);
    if (step <= 3) setCuisine(null);
    if (step <= 4) setBudget(null);
    setFoodPref(null);
    setSuggestions(null);
    setApiError(null);
    goTo(step);
  };

  // ── Pick handlers ─────────────────────────────────────────────────────────
  const pickMood = (v: Mood) => { setMood(v);     goTo(2); };
  const pickTaste = (v: Taste) => { setTaste(v);    goTo(3); };
  const pickCuisine = (v: Cuisine) => { setCuisine(v);  goTo(4); };
  const pickBudget = (v: Budget) => { setBudget(v);   goTo(5); };

  const pickFoodPref = async (v: FoodPref) => {
    setFoodPref(v);
    goTo(6);
    await fetchAll(mood!, taste!, cuisine!, budget!, v);
  };

  // ── Two-stage fetch ───────────────────────────────────────────────────────
  const fetchAll = async (
    m: Mood, ta: Taste, cu: Cuisine, bu: Budget, fp: FoodPref
  ) => {
    setLoading(true);
    setApiError(null);
    setSuggestions(null);
    let nearbyRestaurants: RestaurantData[] = [];

    if (coords) {
      setLoadingStage("restaurants");
      try {
        const res  = await fetch("/api/restaurants", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            lat: coords.lat, lng: coords.lng,
            cuisine: cu, foodPref: fp, budget: bu,
          }),
        });
        const data = await res.json() as { restaurants?: RestaurantData[] };
        if (res.ok && data.restaurants) nearbyRestaurants = data.restaurants;
      } catch { /* silently continue */ }
    }

    setLoadingStage("ai");
    try {
      const res  = await fetch("/api/suggest", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          mood: m, taste: ta, cuisine: cu, budget: bu, foodPref: fp,
          city, country,
          currencyCode,
          currencySymbol,
          restaurants: nearbyRestaurants,
        }),
      });
      const data = await res.json() as { suggestions?: Suggestion[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "API error");
      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setLoadingStage(null);
    }
  };

  const handleReset = () => {
    setMood(null); setTaste(null); setCuisine(null);
    setBudget(null); setFoodPref(null);
    setSuggestions(null); setApiError(null);
    setLoading(false); setLoadingStage(null);
    goTo(1);
  };

  const handleShuffle = async () => {
    if (mood && taste && cuisine && budget && foodPref) {
      await fetchAll(mood, taste, cuisine, budget, foodPref);
    }
  };

  // ── Summary pills ─────────────────────────────────────────────────────────
  const summaryChoices: { step: WizardStep; emoji: string; label: string }[] = [];
  if (mood)     summaryChoices.push({ step: 1, emoji: MOODS.find(m => m.value === mood)!.emoji,       label: MOODS.find(m => m.value === mood)!.label        });
  if (taste)    summaryChoices.push({ step: 2, emoji: TASTES.find(t => t.value === taste)!.emoji,     label: TASTES.find(t => t.value === taste)!.label      });
  if (cuisine)  summaryChoices.push({ step: 3, emoji: CUISINES.find(c => c.value === cuisine)!.emoji, label: CUISINES.find(c => c.value === cuisine)!.label  });
  if (budget)   summaryChoices.push({ step: 4, emoji: BUDGETS.find(b => b.value === budget)!.emoji,   label: BUDGETS.find(b => b.value === budget)!.label    });
  if (foodPref) summaryChoices.push({ step: 5, emoji: FOOD_PREFS.find(p => p.value === foodPref)!.emoji, label: FOOD_PREFS.find(p => p.value === foodPref)!.label });

  // ── Step content renderer ─────────────────────────────────────────────────
  const renderStepContent = () => {
    if (visibleStep === 1) return (
      <div>
        <StepLabel step={1} question={STEP_QUESTIONS[1]} />
        <div className="grid grid-cols-2 gap-2.5">
          {MOODS.map((m) => (
            <ChoiceCard key={m.value} selected={mood === m.value} accentColor={m.color} onClick={() => pickMood(m.value)}>
              <div className="text-xl mb-1">{m.emoji}</div>
              <div className="font-semibold text-white text-sm leading-tight">{m.label}</div>
              <div className="text-xs text-zinc-500 mt-0.5 leading-tight">{m.desc}</div>
            </ChoiceCard>
          ))}
        </div>
      </div>
    );

    if (visibleStep === 2) return (
      <div>
        <StepLabel step={2} question={STEP_QUESTIONS[2]} />
        <div className="grid grid-cols-2 gap-3">
          {TASTES.map((t) => (
            <ChoiceCard key={t.value} selected={taste === t.value} accentColor={t.color} onClick={() => pickTaste(t.value)}>
              <div className="text-2xl mb-1.5">{t.emoji}</div>
              <div className="font-semibold text-white text-sm">{t.label}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{t.desc}</div>
            </ChoiceCard>
          ))}
        </div>
      </div>
    );

    if (visibleStep === 3) return (
      <div>
        <StepLabel step={3} question={STEP_QUESTIONS[3]} />
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            {CUISINES.slice(0, 4).map((c) => (
              <ChoiceCard key={c.value} selected={cuisine === c.value} accentColor="#f97316" onClick={() => pickCuisine(c.value)}>
                <div className="text-2xl mb-1.5">{c.emoji}</div>
                <div className="font-semibold text-white text-sm leading-tight">{c.label}</div>
                <div className="text-xs text-zinc-500 mt-0.5 leading-tight">{c.desc}</div>
              </ChoiceCard>
            ))}
          </div>
          {/* Surprise Me — full width */}
          <ChoiceCard selected={cuisine === "surprise"} accentColor="#f97316" onClick={() => pickCuisine("surprise")}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎲</span>
              <div>
                <div className="font-semibold text-white text-sm">Surprise Me!</div>
                <div className="text-xs text-zinc-500">Whatever&apos;s best near me</div>
              </div>
            </div>
          </ChoiceCard>
        </div>
      </div>
    );

    if (visibleStep === 4) return (
      <div>
        <StepLabel step={4} question={STEP_QUESTIONS[4]} />
        <div className="grid grid-cols-1 gap-3">
          {BUDGETS.map((b) => (
            <ChoiceCard key={b.value} selected={budget === b.value} accentColor={b.color} onClick={() => pickBudget(b.value)}>
              <div className="flex items-center gap-4">
                <span className="text-3xl">{b.emoji}</span>
                <div>
                  <div className="font-bold text-white">{b.label}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{b.desc}</div>
                </div>
              </div>
            </ChoiceCard>
          ))}
        </div>
      </div>
    );

    if (visibleStep === 5) return (
      <div>
        <StepLabel step={5} question={STEP_QUESTIONS[5]} />
        <div className="grid grid-cols-3 gap-3">
          {FOOD_PREFS.map((p) => (
            <ChoiceCard key={p.value} selected={foodPref === p.value} accentColor={p.color} onClick={() => pickFoodPref(p.value)}>
              <div className="text-3xl mb-2 text-center">{p.emoji}</div>
              <div className="font-bold text-white text-sm text-center">{p.label}</div>
            </ChoiceCard>
          ))}
        </div>
      </div>
    );

    // Step 6 — Results
    return (
      <div>
        {/* Loading state */}
        {loading && (
          <div>
            <div className="mb-5 text-center">
              <p className="text-xs text-zinc-500 mb-1">
                {loadingStage === "restaurants" ? "Searching within 5 km of you…" : "Matching real restaurants…"}
              </p>
              <h2 className="text-xl font-bold text-white">
                {loadingStage === "restaurants" ? "Finding open restaurants…" : "Crafting your meal combos…"}
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        )}

        {/* Error state */}
        {apiError && !loading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <div className="text-4xl mb-3">😕</div>
            <p className="text-red-400 text-sm mb-5">{apiError}</p>
            <button
              onClick={handleShuffle}
              className="px-6 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {suggestions && !loading && (
          <>
            <div className="mb-5">
              <p className="text-xs text-zinc-500 mb-1">
                {city ? `Open restaurants near ${city}` : "Your picks are ready"}
              </p>
              <h2 className="text-xl font-bold text-white">Here are your picks 🎯</h2>
            </div>
            <div className="flex flex-col gap-4">
              {suggestions.map((item, i) => (
                <ResultCard key={i} item={item} city={city} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Actions (shown after loading) */}
        {!loading && (
          <div className="flex gap-3 mt-6">
            {suggestions && (
              <button
                onClick={handleShuffle}
                className="flex-1 py-3 rounded-2xl border border-white/15 text-white font-semibold text-sm hover:bg-white/8 transition-all cursor-pointer"
              >
                Shuffle Again 🔀
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold text-sm hover:scale-[1.02] transition-all cursor-pointer"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-[#0d0d0d] text-white" style={{ minHeight: "100dvh" }}>

      {/* ── Location gate — blocks the app until we have a location ─────── */}
      {locationPhase !== "confirmed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0d]">
          <div className="w-full max-w-xs px-6 flex flex-col items-center text-center gap-5">
            {/* Brand */}
            <div className="text-5xl">🍽️</div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                WhatToEat
              </h1>
              <p className="text-zinc-500 text-sm mt-1">Find the perfect meal near you</p>
            </div>

            {/* Permission screen */}
            {locationPhase === "permission" && (
              <>
                <div className="rounded-2xl border border-white/8 bg-white/5 px-5 py-4 text-sm text-zinc-400 leading-relaxed">
                  WhatToEat needs your location to find real open restaurants nearby and suggest meal combos that actually exist near you.
                </div>
                <button
                  onClick={requestGpsLocation}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  📍 Allow Location
                </button>
                <button
                  onClick={() => setLocationPhase("city-input")}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                >
                  Type my city instead →
                </button>
              </>
            )}

            {/* Detecting — GPS running */}
            {locationPhase === "detecting" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-xl">📍</div>
                </div>
                <div>
                  <p className="text-white font-semibold">Finding you…</p>
                  <p className="text-zinc-600 text-xs mt-0.5">Using GPS for precise location</p>
                </div>
              </div>
            )}

            {/* City search fallback — shown only when GPS denied */}
            {locationPhase === "city-input" && (
              <>
                <div className="rounded-2xl border border-white/8 bg-white/5 px-5 py-4 text-sm text-zinc-400 leading-relaxed">
                  No problem — type your city and we&apos;ll find restaurants near you.
                </div>
                <div className="w-full">
                  <CitySearchInput onFound={handleCityFound} />
                </div>
                <button
                  onClick={requestGpsLocation}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                >
                  Try GPS again →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── App shell (only visible once location confirmed) ─────────────── */}
      {locationPhase === "confirmed" && (
        <>
          {/* ── Fixed header ──────────────────────────────────────────────── */}
          <header className="px-4 pt-8 pb-3 text-center shrink-0">
            <div className="text-4xl mb-1.5">🍽️</div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              WhatToEat
            </h1>
            <p className="text-zinc-500 text-xs mt-1">Tell us your vibe. We&apos;ll handle the rest.</p>

            {/* Location pill — tappable to change */}
            <button
              onClick={() => setLocationPhase("city-input")}
              className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer group"
            >
              <span>📍</span>
              <span className="underline-offset-2 group-hover:underline">{locationLabel || [city, country].filter(Boolean).join(", ")}</span>
              <span className="text-zinc-700 group-hover:text-zinc-500 ml-0.5">✎</span>
            </button>
          </header>

          {/* ── Progress bar (steps 1-5 only) ─────────────────────────────── */}
          {visibleStep <= 5 && (
            <div className="flex gap-1 px-4 pb-2 shrink-0">
              {([1, 2, 3, 4, 5] as WizardStep[]).map((s) => (
                <div
                  key={s}
                  className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                    s < visibleStep
                      ? "bg-orange-500"
                      : s === visibleStep
                      ? "bg-orange-400/70"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          )}

          {/* ── Summary pills (shown from step 2 onward) ──────────────────── */}
          {summaryChoices.length > 0 && (
            <div className="shrink-0">
              <SummaryBar
                choices={summaryChoices}
                onBack={(step) => goBackTo(step as WizardStep)}
              />
            </div>
          )}

          {/* ── Step content ──────────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-4 pb-8 pt-2">
            <div
              key={visibleStep}
              className={isExiting ? "step-exiting" : "step-entering"}
            >
              {renderStepContent()}
            </div>
          </main>

          {/* Footer */}
          <footer className="shrink-0 py-4 text-center">
            <p className="text-zinc-800 text-xs">Made with ❤️ by WhatToEat</p>
          </footer>
        </>
      )}

      <style>{`
        /* ── Step transitions ───────────────── */
        .step-entering {
          animation: step-in 0.30s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .step-exiting {
          animation: step-out 0.27s cubic-bezier(0.4, 0, 1, 1) forwards;
          pointer-events: none;
        }
        @keyframes step-in {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes step-out {
          from { opacity: 1; transform: translateY(0);    }
          to   { opacity: 0; transform: translateY(-28px); }
        }

        /* ── Result card pop-in ─────────────── */
        .result-card {
          animation: card-pop 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes card-pop {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        /* ── Skeleton shimmer ───────────────── */
        .skeleton {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 25%,
            rgba(255,255,255,0.09) 50%,
            rgba(255,255,255,0.04) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.6s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0;  }
          100% { background-position: -200% 0; }
        }

        /* ── Hover utility ──────────────────── */
        .hover\\:bg-white\\/8:hover  { background-color: rgba(255,255,255,0.08); }
        .hover\\:bg-white\\/10:hover { background-color: rgba(255,255,255,0.10); }
        .hover\\:bg-white\\/15:hover { background-color: rgba(255,255,255,0.15); }
        .bg-white\\/8  { background-color: rgba(255,255,255,0.08); }
        .bg-white\\/15 { background-color: rgba(255,255,255,0.15); }
        .border-white\\/15 { border-color: rgba(255,255,255,0.15); }
        .hover\\:border-white\\/25:hover { border-color: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
}

// ─── StepLabel helper ─────────────────────────────────────────────────────────

function StepLabel({ step, question }: { step: number; question: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-1">
        Step {step} of 5
      </p>
      <h2 className="text-xl font-bold text-white">{question}</h2>
    </div>
  );
}
