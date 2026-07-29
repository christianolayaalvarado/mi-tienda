// src/components/RootLayoutClientInit.jsx
"use client";

import { useEffect } from "react";
import { isLogoutInProgress, isRecentLogout } from "@/utils/authFlags";

export default function RootLayoutClientInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLogoutInProgress() || isRecentLogout()) return;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return;
    } catch {
      return;
    }

    if (window.__auth_refresh_in_progress) return;
    window.__auth_refresh_in_progress = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        });

        if (res?.ok && !isRecentLogout()) {
          try {
            window.dispatchEvent(new Event("auth:refresh"));
          } catch {}
        }
      } catch (err) {
        console.warn("RootLayoutClientInit refresh failed", err);
      } finally {
        window.__auth_refresh_in_progress = false;
      }
    })();
  }, []);

  return null;
}
