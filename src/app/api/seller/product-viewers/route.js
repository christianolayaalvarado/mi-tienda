import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

// Known email provider proxy indicators
const EMAIL_PROVIDER_USERAGENTS = /gmail|outlook|hotmail|yahoomail|apple.mail|protonmail|zoho|aol\.mail/i;
const EMAIL_PROVIDER_REFERERS = /mail\.google|mail\.yahoo|outlook\.live|hotmail\.com|mail\.aol|protonmail/i;

function isEmailProviderTraffic(view) {
  if (view.userAgent && EMAIL_PROVIDER_USERAGENTS.test(view.userAgent)) return true;
  if (view.referer && EMAIL_PROVIDER_REFERERS.test(view.referer)) return true;
  return false;
}

// GET /api/seller/product-viewers?productId=xxx — views for a specific product
// GET /api/seller/product-viewers — all views for seller's products
// GET /api/seller/product-viewers?export=csv — export contacts as CSV
export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const days = parseInt(searchParams.get("days") || "30", 10);
    const exportCsv = searchParams.get("export") === "csv";

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

    if (productIds.length === 0) {
      if (exportCsv) {
        return new NextResponse("Email,Telefono,Ciudad,Pais,Fecha\n", {
          headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="visitantes.csv"' },
        });
      }
      return NextResponse.json({ total: 0, locations: [], productViews: [], daily: [], contacts: [] });
    }

    const where = {
      productId: { in: productIds },
      createdAt: { gte: since },
    };

    if (productId && productIds.includes(productId)) {
      where.productId = productId;
    }

    // Get views — include contact info + user agent/referer for filtering
    const views = await prisma.productView.findMany({
      where,
      select: {
        productId: true,
        ip: true,
        email: true,
        phone: true,
        userId: true,
        country: true,
        region: true,
        city: true,
        lat: true,
        lon: true,
        userAgent: true,
        referer: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // Separate real views from email provider proxy views
    const realViews = [];
    const emailProxyViews = [];
    views.forEach((v) => {
      if (isEmailProviderTraffic(v)) {
        emailProxyViews.push(v);
      } else {
        realViews.push(v);
      }
    });

    // CSV export: unique contacts (from ALL views, including email proxy)
    if (exportCsv) {
      const contactMap = {};
      views.forEach((v) => {
        const key = v.email || v.phone || v.ip || Math.random().toString();
        if (!contactMap[key] && (v.email || v.phone)) {
          contactMap[key] = {
            email: v.email || "",
            phone: v.phone || "",
            city: v.city || "",
            country: v.country || "",
            date: v.createdAt.toISOString().slice(0, 10),
          };
        }
      });

      const contacts = Object.values(contactMap);
      const header = "Email,Telefono,Ciudad,Pais,Fecha\n";
      const rows = contacts.map((c) =>
        `"${c.email}","${c.phone}","${c.city}","${c.country}","${c.date}"`
      ).join("\n");

      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="visitantes-${days}d.csv"`,
        },
      });
    }

    // Enrich with product titles
    const productMap = {};
    products.forEach((p) => { productMap[p.id] = p.title; });

    // Aggregate by location (only real views, not email proxy)
    const locationMap = {};
    realViews.forEach((v) => {
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

    // Aggregate by product (real views only)
    const productViews = {};
    realViews.forEach((v) => {
      const title = productMap[v.productId] || v.productId;
      if (!productViews[title]) productViews[title] = 0;
      productViews[title]++;
    });

    // Daily views (real views only)
    const daily = {};
    realViews.forEach((v) => {
      const day = v.createdAt.toISOString().slice(0, 10);
      if (!daily[day]) daily[day] = 0;
      daily[day]++;
    });

    // Contacts with email or phone (deduplicated, from ALL views)
    const contactMap = {};
    views.forEach((v) => {
      if (!v.email && !v.phone) return;
      const key = v.email || v.phone;
      if (!contactMap[key]) {
        contactMap[key] = {
          email: v.email || null,
          phone: v.phone || null,
          city: v.city || null,
          country: v.country || null,
          lastVisit: v.createdAt,
          viewCount: 0,
        };
      }
      contactMap[key].viewCount++;
      if (v.createdAt > contactMap[key].lastVisit) {
        contactMap[key].lastVisit = v.createdAt;
      }
    });

    const contacts = Object.values(contactMap).sort((a, b) => b.viewCount - a.viewCount);

    return NextResponse.json({
      total: realViews.length,
      totalAll: views.length,
      emailProxyFiltered: emailProxyViews.length,
      locations,
      productViews: Object.entries(productViews).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      daily: Object.entries(daily).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
      contacts,
      contactCount: contacts.length,
    });
  } catch (err) {
    console.error("GET seller product-viewers error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
