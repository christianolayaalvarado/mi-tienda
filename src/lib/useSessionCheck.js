"use client";
// src/lib/useSessionCheck.js
import { isLogoutInProgress, isRecentLogout } from "@/utils/authFlags";

export async function fetchSession() {
  try {
    if (typeof window !== "undefined") {
      if (isRecentLogout() || isLogoutInProgress()) {
        return null;
      }
    }

    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ?? null;
  } catch (err) {
    console.warn("fetchSession error", err);
    return null;
  }
}
