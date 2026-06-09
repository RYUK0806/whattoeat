import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatToEat",
  description: "Pick your mood, budget, and preference — get 3 food suggestions instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
