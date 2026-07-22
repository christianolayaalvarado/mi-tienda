import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/product-views — log a product view with IP geolocation
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }

    // Get IP from headers (Vercel/Next.js)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";

    // Geolocate with ip-api.com (free, no key needed)
    let country = null, region = null, city = null, lat = null, lon = null;

    if (ip && ip !== "127.0.0.1" && ip !== "::1") {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${ip}?fields=country,regionName,city,lat,lon`,
          { signal: AbortSignal.timeout(3000) }
        );
        const geo = await geoRes.json();
        if (geo.status === "success") {
          country = geo.country || null;
          region = geo.regionName || null;
          city = geo.city || null;
          lat = geo.lat || null;
          lon = geo.lon || null;
        }
      } catch {
        // Geolocation failed, continue without it
      }
    }

    // Deduplicate: only 1 view per IP per product per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await prisma.productView.findFirst({
      where: {
        productId,
        ip: ip || null,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, deduped: true });
    }

    await prisma.productView.create({
      data: {
        productId,
        ip: ip || null,
        country,
        region,
        city,
        lat,
        lon,
        userAgent: userAgent.slice(0, 500),
        referer: referer.slice(0, 500),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error logging product view:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
