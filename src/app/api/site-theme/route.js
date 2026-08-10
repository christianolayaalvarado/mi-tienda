import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    const theme = await prisma.siteTheme.findUnique({ where: { key: "default" } });
    return NextResponse.json({ settings: theme?.settings || DEFAULT_SETTINGS });
  } catch {
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }
}
