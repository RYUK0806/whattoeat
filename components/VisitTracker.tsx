"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track the main app, not admin routes
    if (pathname.startsWith("/admin")) return;

    const ua       = navigator.userAgent;
    const isMobile = /Mobi|Android/i.test(ua);
    const device   = isMobile ? "mobile" : "desktop";

    let browser = "other";
    if      (/Edg/i.test(ua))                           browser = "Edge";
    else if (/Chrome/i.test(ua) && !/Edg/i.test(ua))   browser = "Chrome";
    else if (/Firefox/i.test(ua))                        browser = "Firefox";
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";

    // Fire-and-forget — never blocks anything
    fetch("/api/track/visit", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ device, browser }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
