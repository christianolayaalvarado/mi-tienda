// src/components/ThemeInitializer.jsx
"use client";
import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem("theme") || "light";
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
    } catch (e) {
      // safe fallback
      document.documentElement.classList.add("light");
    }
  }, []);
  return null;
}
