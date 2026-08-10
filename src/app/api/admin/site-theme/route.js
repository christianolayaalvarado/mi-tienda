import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

const DEFAULT_SETTINGS = {
  featuredGradFrom: "#eff6ff",
  featuredGradTo: "#eef2ff",
  featuredBannerIconBg: "#2563eb",
  featuredBannerBorderColor: "#dbeafe",
  mascotGradFrom: "#10b981",
  mascotGradTo: "#06b6d4",
  latestGradFrom: "#0f172a",
  latestGradTo: "#312e81",
  // Navbar
  navbarBg: "#ffffff",
  navbarTextColor: "#1f2937",
  // Category bar
  categoryBarBg: "#f9fafb",
  categoryBarActiveColor: "#16a34a",
  // Cards
  cardBg: "#ffffff",
  cardBorderColor: "#e5e7eb",
  cardShadowColor: "rgba(0,0,0,0.08)",
  // Product card
  productCardBg: "#ffffff",
  productCardHoverShadow: "rgba(22,163,74,0.15)",
  priceColor: "#16a34a",
  salePriceColor: "#dc2626",
  // Buttons
  primaryBtnBg: "#16a34a",
  primaryBtnHover: "#15803d",
  primaryBtnText: "#ffffff",
  secondaryBtnBg: "#f3f4f6",
  secondaryBtnHover: "#e5e7eb",
  secondaryBtnText: "#374151",
  // Footer
  footerBg: "#1f2937",
  footerTextColor: "#d1d5db",
  footerLinkColor: "#9ca3af",
  // Body
  bodyBg: "#f9fafb",
  bodyTextColor: "#1f2937",
  // Accent / CTA
  accentColor: "#f59e0b",
  accentTextColor: "#ffffff",
  // Border radius
  borderRadius: "8px",
  borderRadiusLg: "12px",
};

export async function GET() {
  try {
    let theme = await prisma.siteTheme.findUnique({ where: { key: "default" } });
    if (!theme) {
      theme = await prisma.siteTheme.create({ data: { key: "default", settings: DEFAULT_SETTINGS } });
    }
    return NextResponse.json({ settings: theme.settings });
  } catch (err) {
    console.error("GET site-theme error:", err);
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }
}

export async function PUT(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { settings } = body;
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    }

    const theme = await prisma.siteTheme.upsert({
      where: { key: "default" },
      update: { settings },
      create: { key: "default", settings },
    });

    return NextResponse.json({ settings: theme.settings });
  } catch (err) {
    console.error("PUT site-theme error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
