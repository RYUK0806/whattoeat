"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Ctrl+Shift+A anywhere → /admin/login (invisible to regular users) */
export default function AdminShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        router.push("/admin/login");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return null;
}
