"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const SiteThemeContext = createContext({});

const DEFAULT_SETTINGS = {
  bannerBg: "#16a34a",
  bannerTextColor: "#ffffff",
  bannerAccentColor: "#fbbf24",
  navbarBg: "#ffffff",
  navbarTextColor: "#1f2937",
  heroBg: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
  heroTextColor: "#ffffff",
  categoryBarBg: "#f9fafb",
  categoryBarActiveColor: "#16a34a",
  cardBg: "#ffffff",
  cardBorderColor: "#e5e7eb",
  cardShadowColor: "rgba(0,0,0,0.08)",
  productCardBg: "#ffffff",
  productCardHoverShadow: "rgba(22,163,74,0.15)",
  priceColor: "#16a34a",
  salePriceColor: "#dc2626",
  primaryBtnBg: "#16a34a",
  primaryBtnHover: "#15803d",
  primaryBtnText: "#ffffff",
  secondaryBtnBg: "#f3f4f6",
  secondaryBtnHover: "#e5e7eb",
  secondaryBtnText: "#374151",
  footerBg: "#1f2937",
  footerTextColor: "#d1d5db",
  footerLinkColor: "#9ca3af",
  bodyBg: "#f9fafb",
  bodyTextColor: "#1f2937",
  accentColor: "#f59e0b",
  accentTextColor: "#ffffff",
  borderRadius: "8px",
  borderRadiusLg: "12px",
};

function applyThemeToCSS(settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const s = { ...DEFAULT_SETTINGS, ...settings };

  root.style.setProperty("--st-banner-bg", s.bannerBg);
  root.style.setProperty("--st-banner-text", s.bannerTextColor);
  root.style.setProperty("--st-banner-accent", s.bannerAccentColor);
  root.style.setProperty("--st-navbar-bg", s.navbarBg);
  root.style.setProperty("--st-navbar-text", s.navbarTextColor);
  root.style.setProperty("--st-hero-bg", s.heroBg);
  root.style.setProperty("--st-hero-text", s.heroTextColor);
  root.style.setProperty("--st-catbar-bg", s.categoryBarBg);
  root.style.setProperty("--st-catbar-active", s.categoryBarActiveColor);
  root.style.setProperty("--st-card-bg", s.cardBg);
  root.style.setProperty("--st-card-border", s.cardBorderColor);
  root.style.setProperty("--st-card-shadow", s.cardShadowColor);
  root.style.setProperty("--st-product-bg", s.productCardBg);
  root.style.setProperty("--st-product-hover", s.productCardHoverShadow);
  root.style.setProperty("--st-price", s.priceColor);
  root.style.setProperty("--st-sale-price", s.salePriceColor);
  root.style.setProperty("--st-btn-primary-bg", s.primaryBtnBg);
  root.style.setProperty("--st-btn-primary-hover", s.primaryBtnHover);
  root.style.setProperty("--st-btn-primary-text", s.primaryBtnText);
  root.style.setProperty("--st-btn-secondary-bg", s.secondaryBtnBg);
  root.style.setProperty("--st-btn-secondary-hover", s.secondaryBtnHover);
  root.style.setProperty("--st-btn-secondary-text", s.secondaryBtnText);
  root.style.setProperty("--st-footer-bg", s.footerBg);
  root.style.setProperty("--st-footer-text", s.footerTextColor);
  root.style.setProperty("--st-footer-link", s.footerLinkColor);
  root.style.setProperty("--st-body-bg", s.bodyBg);
  root.style.setProperty("--st-body-text", s.bodyTextColor);
  root.style.setProperty("--st-accent", s.accentColor);
  root.style.setProperty("--st-accent-text", s.accentTextColor);
  root.style.setProperty("--st-radius", s.borderRadius);
  root.style.setProperty("--st-radius-lg", s.borderRadiusLg);
}

export function SiteThemeProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/site-theme", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings(d.settings);
          applyThemeToCSS(d.settings);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/site-theme", { cache: "no-store" });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        applyThemeToCSS(data.settings);
      }
    } catch {}
  }, []);

  return (
    <SiteThemeContext.Provider value={{ settings, loaded, refresh }}>
      {children}
    </SiteThemeContext.Provider>
  );
}

export function useSiteTheme() {
  return useContext(SiteThemeContext);
}
