"use client";

import { useState, useEffect, createContext, useContext } from "react";

const ThemeContext = createContext({ theme: "default", setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("default");

  useEffect(() => {
    fetch("/api/user/preferences", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.theme) {
          setThemeState(d.theme);
          applyTheme(d.theme);
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = (t) => {
    setThemeState(t);
    applyTheme(t);
    fetch("/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ theme: t }),
    }).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(theme) {
  const root = document.documentElement;
  
  // Remover todos los data-color-theme anteriores
  root.removeAttribute("data-color-theme");
  root.removeAttribute("data-theme");

  if (theme && theme !== "default") {
    root.setAttribute("data-color-theme", theme);
  }

  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  }
}
