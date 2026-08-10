"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const SiteThemeContext = createContext({});

const DEFAULT_SETTINGS = {
  featuredBannerBg: "linear-gradient(90deg, #eff6ff, #ffffff, #eef2ff)",
  featuredBannerIconBg: "#2563eb",
  featuredBannerBorderColor: "#dbeafe",
  mascotBannerGrad1: "#10b981",
  mascotBannerGrad2: "#14b8a6",
  mascotBannerGrad3: "#06b6d4",
  latestBannerGrad1: "#0f172a",
  latestBannerGrad2: "#1e3a5f",
  latestBannerGrad3: "#312e81",
  navbarBg: "#ffffff",
  navbarTextColor: "#1f2937",
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

function buildCSS(s) {
  return `
    :root {
      --st-featured-bg: ${s.featuredBannerBg};
      --st-featured-icon: ${s.featuredBannerIconBg};
      --st-featured-border: ${s.featuredBannerBorderColor};
      --st-mascot-grad1: ${s.mascotBannerGrad1};
      --st-mascot-grad2: ${s.mascotBannerGrad2};
      --st-mascot-grad3: ${s.mascotBannerGrad3};
      --st-latest-grad1: ${s.latestBannerGrad1};
      --st-latest-grad2: ${s.latestBannerGrad2};
      --st-latest-grad3: ${s.latestBannerGrad3};
      --st-navbar-bg: ${s.navbarBg};
      --st-navbar-text: ${s.navbarTextColor};
      --st-catbar-bg: ${s.categoryBarBg};
      --st-catbar-active: ${s.categoryBarActiveColor};
      --st-card-bg: ${s.cardBg};
      --st-card-border: ${s.cardBorderColor};
      --st-card-shadow: ${s.cardShadowColor};
      --st-product-bg: ${s.productCardBg};
      --st-price: ${s.priceColor};
      --st-sale-price: ${s.salePriceColor};
      --st-btn-primary-bg: ${s.primaryBtnBg};
      --st-btn-primary-hover: ${s.primaryBtnHover};
      --st-btn-primary-text: ${s.primaryBtnText};
      --st-footer-bg: ${s.footerBg};
      --st-footer-text: ${s.footerTextColor};
      --st-footer-link: ${s.footerLinkColor};
      --st-body-bg: ${s.bodyBg};
      --st-body-text: ${s.bodyTextColor};
      --st-accent: ${s.accentColor};
      --st-accent-text: ${s.accentTextColor};
    }

    /* Navbar */
    .navbar-theme { background: var(--st-navbar-bg) !important; color: var(--st-navbar-text) !important; }

    /* Body */
    body { background: var(--st-body-bg) !important; color: var(--st-body-text) !important; }

    /* Green buttons */
    .bg-green-600 { background-color: var(--st-btn-primary-bg) !important; }
    .bg-green-600:hover { background-color: var(--st-btn-primary-hover) !important; }

    /* Prices */
    .text-green-600 { color: var(--st-price) !important; }

    /* Sale prices */
    .text-red-600 { color: var(--st-sale-price) !important; }

    /* Footer */
    footer { background: var(--st-footer-bg) !important; color: var(--st-footer-text) !important; }

    /* Featured Carousel banner */
    [data-banner="featured"] {
      background: var(--st-featured-bg) !important;
      border-color: var(--st-featured-border) !important;
    }
    [data-banner="featured"] .featured-icon {
      background: var(--st-featured-icon) !important;
    }

    /* Mascot promo banner */
    [data-banner="mascot"] {
      background: linear-gradient(135deg, var(--st-mascot-grad1), var(--st-mascot-grad2), var(--st-mascot-grad3)) !important;
    }

    /* Latest products banner */
    [data-banner="latest"] {
      background: linear-gradient(135deg, var(--st-latest-grad1), var(--st-latest-grad2), var(--st-latest-grad3)) !important;
    }
  `;
}

function applyThemeToCSS(settings) {
  if (typeof document === "undefined") return;
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const root = document.documentElement;
  Object.entries(s).forEach(([k, v]) => root.style.setProperty(`--st-${k}`, v));

  let tag = document.getElementById("site-theme-style");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "site-theme-style";
    document.head.appendChild(tag);
  }
  tag.textContent = buildCSS(s);
}

export function SiteThemeProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    fetch("/api/site-theme", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.settings) { setSettings(d.settings); applyThemeToCSS(d.settings); } })
      .catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/site-theme", { cache: "no-store" });
      const data = await res.json();
      if (data.settings) { setSettings(data.settings); applyThemeToCSS(data.settings); }
    } catch {}
  }, []);

  return (
    <SiteThemeContext.Provider value={{ settings, refresh }}>
      {children}
    </SiteThemeContext.Provider>
  );
}

export function useSiteTheme() {
  return useContext(SiteThemeContext);
}
