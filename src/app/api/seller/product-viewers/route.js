import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

// GET /api/seller/product-viewers?productId=xxx — views for a specific product
// GET /api/seller/product-viewers — all views for seller's products
export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const days = parseInt(searchParams.get("days") || "30", 10);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get seller's stores and products
    const stores = await prisma.store.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const storeIds = stores.map((s) => s.id);

    const products = await prisma.product.findMany({
      where: { storeId: { in: storeIds } },
      select: { id: true, title: true },
    });
    const productIds = products.map((p) => p.id);

    const where = {
      productId: { in: productIds },
      createdAt: { gte: since },
    };

    if (productId && productIds.includes(productId)) {
      where.productId = productId;
    }

    // Get views
    const views = await prisma.productView.findMany({
      where,
      select: {
        productId: true,
        ip: true,
        country: true,
        region: true,
        city: true,
        lat: true,
        lon: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    // Enrich with product titles
    const productMap = {};
    products.forEach((p) => { productMap[p.id] = p.title; });

    // Aggregate by location
    const locationMap = {};
    views.forEach((v) => {
      const key = [v.city, v.region, v.country].filter(Boolean).join(", ") || "Desconocida";
      if (!locationMap[key]) {
        locationMap[key] = { city: v.city, region: v.region, country: v.country, lat: v.lat, lon: v.lon, count: 0, products: new Set() };
      }
      locationMap[key].count++;
      locationMap[key].products.add(productMap[v.productId] || v.productId);
    });

    const locations = Object.values(locationMap).map((l) => ({
      ...l,
      products: Array.from(l.products),
    })).sort((a, b) => b.count - a.count);

    // Aggregate by product
    const productViews = {};
    views.forEach((v) => {
      const title = productMap[v.productId] || v.productId;
      if (!productViews[title]) productViews[title] = 0;
      productViews[title]++;
    });

    // Daily views
    const daily = {};
    views.forEach((v) => {
      const day = v.createdAt.toISOString().slice(0, 10);
      if (!daily[day]) daily[day] = 0;
      daily[day]++;
    });

    return NextResponse.json({
      total: views.length,
      locations,
      productViews: Object.entries(productViews).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      daily: Object.entries(daily).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (err) {
    console.error("GET seller product-viewers error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
