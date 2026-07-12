import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const recent = searchParams.get("recent") === "true";

    if (recent) {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const drops = await prisma.priceHistory.findMany({
        where: { changedAt: { gte: last24h }, oldPrice: { gt: undefined } },
        include: { product: { select: { id: true, title: true, images: true, price: true, store: { select: { name: true } } } } },
        orderBy: { changedAt: "desc" },
        take: 50,
      });

      const filtered = drops.filter((d) => d.newPrice < d.oldPrice);
      return NextResponse.json({ drops: filtered });
    }

    if (!productId) {
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    }

    const history = await prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { changedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { productId, oldPrice, newPrice } = await req.json();

    if (!productId || oldPrice == null || newPrice == null) {
      return NextResponse.json({ error: "Datos requeridos" }, { status: 400 });
    }

    const entry = await prisma.priceHistory.create({
      data: { productId, oldPrice, newPrice },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error creating price history:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
