"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// ─── Maintenance screen ────────────────────────────────────────────────────────

function MaintenancePage({ message }: { message: string }) {
  const [email,     setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/track/notify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d0d0d]">
      <div className="w-full max-w-sm px-8 flex flex-col items-center text-center gap-6">
        {/* Brand */}
        <div className="text-6xl">🍳</div>

        <div>
          <h1 className="text-2xl font-extrabold text-white mb-2">
            We&apos;re taking a short break
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            {message || "Our chef is working on something exciting. Please check back later."}
          </p>
        </div>

        <div className="w-full border-t border-white/8" />

        {/* Notify me form */}
        {!submitted ? (
          <form onSubmit={handleNotify} className="w-full flex flex-col gap-3">
            <p className="text-xs text-zinc-500">Get notified when we&apos;re back</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/60 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-orange-500 text-black text-sm font-bold disabled:opacity-50 hover:bg-orange-400 transition-all cursor-pointer"
              >
                {loading ? "…" : "Notify me"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-orange-400 font-semibold">
            ✓ We&apos;ll let you know when we&apos;re back!
          </p>
        )}

        <p className="text-zinc-800 text-xs">WhatToEat</p>
      </div>
    </div>
  );
}

// ─── Gate component ────────────────────────────────────────────────────────────

export default function KillSwitchGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<{ enabled: boolean; message: string } | null>(null);

  // Skip the kill switch for admin routes
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) =>
        setStatus({ enabled: d.enabled ?? true, message: d.message ?? "" })
      )
      .catch(() => setStatus({ enabled: true, message: "" }));
  }, [isAdmin]);

  // Admin routes — render immediately, no kill switch
  if (isAdmin) return <>{children}</>;

  // Still checking — render children (avoids flash; the check is fast)
  if (status === null) return <>{children}</>;

  // App paused — show maintenance page instead of children
  if (!status.enabled) return <MaintenancePage message={status.message} />;

  return <>{children}</>;
}
