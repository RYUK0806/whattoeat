"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchRow {
  timestamp:   string;
  city:        string;
  mood:        string;
  taste_level: string;
  cuisine:     string;
  budget:      string;
  preference:  string;
}

interface Stats {
  totalVisits:     number;
  todayVisits:     number;
  todaySearches:   number;
  uniqueCities:    number;
  topMoods:        { mood: string;    count: number }[];
  topCuisines:     { cuisine: string; count: number }[];
  deviceBreakdown: { device: string;  count: number }[];
  topCities:       { city: string;    count: number }[];
  googleCalls:     number;
  groqCalls:       number;
  recentSearches:  SearchRow[];
  settings: {
    app_enabled:         boolean;
    maintenance_message: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOOGLE_LIMIT     = 10_000;
const WARN_THRESHOLD   =  8_000;
const DANGER_THRESHOLD =  9_000;

const CHART_COLORS  = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];
const TOOLTIP_STYLE = {
  background:   "#1c1c1c",
  border:       "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  color:        "#fff",
  fontSize:     "12px",
};
const AXIS_TICK = { fill: "#71717a", fontSize: 11 };

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, accent = false,
}: {
  label: string; value: string | number; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-orange-500/20 bg-orange-500/5" : "border-white/8 bg-white/4"}`}>
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ? "text-orange-400" : "text-white"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
      <h3 className="font-semibold text-white mb-4 text-sm">{title}</h3>
      {children}
    </div>
  );
}

function NotifyEmails() {
  const [emails, setEmails] = useState<{ email: string; timestamp: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/emails")
      .then((r) => r.json())
      .then((d) => setEmails((d as { emails: { email: string; timestamp: string }[] }).emails ?? []));
  }, []);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-white text-sm">Notification Subscribers</h3>
        <span className="text-xs bg-orange-500/15 text-orange-400 border border-orange-500/20 rounded-full px-2 py-0.5">
          {emails.length}
        </span>
      </div>
      <p className="text-zinc-600 text-xs mb-4">Users who signed up during maintenance</p>
      {emails.length === 0 ? (
        <p className="text-zinc-700 text-sm">No subscribers yet</p>
      ) : (
        <div className="flex flex-col divide-y divide-white/4 max-h-64 overflow-y-auto">
          {emails.map((e, i) => (
            <div key={i} className="flex justify-between items-center py-2.5">
              <span className="text-zinc-300 text-sm">{e.email}</span>
              <span className="text-zinc-600 text-xs">
                {new Date(e.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(false);
  const [msg,      setMsg]      = useState("");
  const [savingMsg,setSavingMsg]= useState(false);
  const [sortCol,  setSortCol]  = useState("timestamp");
  const [sortDir,  setSortDir]  = useState<"asc" | "desc">("desc");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = (await res.json()) as Stats;
      setStats(data);
      setMsg(data.settings.maintenance_message);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleToggle = async () => {
    if (!stats) return;
    const next = !stats.settings.app_enabled;
    const ok   = confirm(next ? "Bring the app back LIVE?" : "PAUSE the app for all users?");
    if (!ok) return;
    setToggling(true);
    await fetch("/api/admin/toggle", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ enabled: next }),
    });
    await fetchStats();
    setToggling(false);
  };

  const handleSaveMsg = async () => {
    setSavingMsg(true);
    await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: msg }),
    });
    setSavingMsg(false);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-600">
          <span className="inline-block w-4 h-4 border border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
          Loading dashboard…
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-red-400 text-sm">Failed to load stats — check DB connection</div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const isLive      = stats.settings.app_enabled;
  const googlePct   = Math.min((stats.googleCalls / GOOGLE_LIMIT) * 100, 100);
  const isWarn      = stats.googleCalls >= WARN_THRESHOLD;
  const isDanger    = stats.googleCalls >= DANGER_THRESHOLD;

  const sortedSearches = [...stats.recentSearches].sort((a, b) => {
    const av = String((a as unknown as Record<string, unknown>)[sortCol] ?? "");
    const bv = String((b as unknown as Record<string, unknown>)[sortCol] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const moodData    = stats.topMoods.map((m)    => ({ name: m.mood,    value: Number(m.count)    }));
  const cuisineData = stats.topCuisines.map((c) => ({ name: c.cuisine, value: Number(c.count)   }));
  const deviceData  = stats.deviceBreakdown.map((d) => ({ name: d.device, value: Number(d.count) }));
  const cityData    = stats.topCities.map((c)   => ({ name: c.city,    value: Number(c.count)    }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍽️</span>
            <div>
              <h1 className="text-lg font-bold text-white">WhatToEat Admin</h1>
              <p className="text-zinc-600 text-xs">Analytics &amp; Controls</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="text-xs text-zinc-500 hover:text-white px-3 py-1.5 rounded-lg border border-white/8 hover:border-white/15 transition-all cursor-pointer disabled:opacity-40"
            >
              {loading ? "…" : "↻ Refresh"}
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-500 hover:text-red-400 px-3 py-1.5 rounded-lg border border-white/8 hover:border-red-500/30 transition-all cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* ── Kill switch ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="font-semibold text-white mb-0.5">App Status</h2>
              <p className="text-zinc-500 text-sm">Toggle to pause or resume for all users.</p>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`flex items-center justify-center gap-2 h-12 w-48 rounded-2xl font-bold text-sm transition-all cursor-pointer disabled:opacity-60 shrink-0 ${
                isLive
                  ? "bg-green-500/12 border border-green-500/30 text-green-400 hover:bg-green-500/20"
                  : "bg-red-500/12 border border-red-500/30 text-red-400 hover:bg-red-500/20"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${isLive ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              {toggling ? "Updating…" : isLive ? "APP LIVE" : "APP PAUSED"}
            </button>
          </div>

          {/* Maintenance message */}
          <div className="mt-4 flex gap-2">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Maintenance message shown to users…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/60 transition-all"
            />
            <button
              onClick={handleSaveMsg}
              disabled={savingMsg}
              className="px-4 py-2.5 rounded-xl bg-orange-500/12 border border-orange-500/25 text-orange-400 text-sm font-semibold hover:bg-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {savingMsg ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* ── Stat cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Visits"    value={stats.totalVisits}   />
          <StatCard label="Visits Today"    value={stats.todayVisits}   />
          <StatCard label="Searches Today"  value={stats.todaySearches} accent />
          <StatCard label="Unique Cities"   value={stats.uniqueCities}  />
        </div>

        {/* ── Charts row 1: Moods + Cuisines ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Top 5 Moods">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={moodData} barCategoryGap="35%">
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK}                 axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" name="Searches" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 5 Cuisines">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cuisineData} barCategoryGap="35%">
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK}                 axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" name="Searches" fill="#fb923c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Charts row 2: Device + Cities ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Mobile vs Desktop">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={40}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) =>
                    `${String(name)} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {deviceData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 10 Cities">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={cityData}>
                <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" name="Visits" fill="#a78bfa" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── API Usage ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <h3 className="font-semibold text-white text-sm mb-4">API Usage — This Month</h3>
          <div className="space-y-5">

            {/* Google Places */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium flex items-center gap-1.5 ${isDanger ? "text-red-400" : isWarn ? "text-yellow-400" : "text-white"}`}>
                  Google Places
                  {isDanger && <span className="text-xs bg-red-500/15 border border-red-500/25 text-red-400 rounded-full px-2 py-0.5">⚠ Auto-paused at 9,000</span>}
                  {isWarn && !isDanger && <span className="text-xs bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 rounded-full px-2 py-0.5">⚠ Approaching limit</span>}
                </span>
                <span className="text-zinc-500 text-xs tabular-nums">
                  {stats.googleCalls.toLocaleString()} / {GOOGLE_LIMIT.toLocaleString()}
                </span>
              </div>
              <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isDanger ? "bg-red-500" : isWarn ? "bg-yellow-500" : "bg-orange-500"}`}
                  style={{ width: `${googlePct}%` }}
                />
              </div>
              <p className="text-zinc-700 text-xs mt-1">
                App auto-pauses at 9,000 · Hard limit 10,000
              </p>
            </div>

            {/* Groq */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white">Groq LLM</span>
                <span className="text-zinc-500 text-xs tabular-nums">
                  {stats.groqCalls.toLocaleString()} calls
                </span>
              </div>
              <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${Math.min((stats.groqCalls / 1000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent searches ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <h3 className="font-semibold text-white text-sm mb-4">
            Recent Searches
            <span className="ml-2 text-zinc-600 font-normal">— last 50</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/8">
                  {(
                    [
                      ["timestamp",   "Time"],
                      ["city",        "City"],
                      ["mood",        "Mood"],
                      ["taste_level", "Taste"],
                      ["cuisine",     "Cuisine"],
                      ["budget",      "Budget"],
                      ["preference",  "Diet"],
                    ] as [string, string][]
                  ).map(([col, label]) => (
                    <th
                      key={col}
                      onClick={() => toggleSort(col)}
                      className="text-left text-zinc-500 font-medium pb-3 pr-4 whitespace-nowrap cursor-pointer hover:text-zinc-300 select-none"
                    >
                      {label}
                      {sortCol === col && (
                        <span className="ml-1 text-orange-500">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedSearches.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/4 hover:bg-white/3 transition-colors"
                  >
                    <td className="py-2.5 pr-4 text-zinc-500 whitespace-nowrap text-xs">
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-300">{row.city        || "—"}</td>
                    <td className="py-2.5 pr-4 text-zinc-300">{row.mood        || "—"}</td>
                    <td className="py-2.5 pr-4 text-zinc-300">{row.taste_level || "—"}</td>
                    <td className="py-2.5 pr-4 text-zinc-300">{row.cuisine     || "—"}</td>
                    <td className="py-2.5 pr-4 text-zinc-300">{row.budget      || "—"}</td>
                    <td className="py-2.5 pr-4 text-zinc-300">{row.preference  || "—"}</td>
                  </tr>
                ))}
                {sortedSearches.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-700">
                      No searches recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Notification emails ───────────────────────────────────────── */}
        <NotifyEmails />

      </div>
    </div>
  );
}
