import type { Metadata } from "next";
import "./globals.css";
import KillSwitchGate from "@/components/KillSwitchGate";
import VisitTracker   from "@/components/VisitTracker";
import AdminShortcut  from "@/components/AdminShortcut";

export const metadata: Metadata = {
  title: "WhatToEat",
  description: "Pick your mood, budget, and preference — get meal suggestions instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <KillSwitchGate>
          {children}
        </KillSwitchGate>
        {/* Silent tracking — no UX impact */}
        <VisitTracker />
        {/* Ctrl+Shift+A → /admin/login */}
        <AdminShortcut />
      </body>
    </html>
  );
}
