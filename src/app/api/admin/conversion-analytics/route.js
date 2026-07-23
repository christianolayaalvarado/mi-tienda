import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        _count: {
          select: {
            favorites: true,
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const productIds = products.map((p) => p.id);

    const views = await prisma.productView.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _count: { id: true },
    });

    const viewMap = {};
    views.forEach((v) => {
      viewMap[v.productId] = v._count.id;
    });

    const enriched = products.map((p) => {
      const viewCount = viewMap[p.id] || 0;
      const favoriteCount = p._count.favorites;
      const soldCount = p._count.orderItems;
      const conversionRate = viewCount > 0 ? ((soldCount / viewCount) * 100).toFixed(1) : 0;

      let discountSuggestion = null;
      if (viewCount >= 5 && soldCount === 0) {
        discountSuggestion = { type: "percentage", value: 15, reason: "Alta visita, 0 ventas" };
      } else if (viewCount >= 10 && soldCount <= 1) {
        discountSuggestion = { type: "percentage", value: 10, reason: "Muy vista, pocas ventas" };
      } else if (favoriteCount >= 3 && soldCount === 0) {
        discountSuggestion = { type: "percentage", value: 20, reason: "Favoritos sin compra" };
      }

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        views: viewCount,
        favorites: favoriteCount,
        sold: soldCount,
        conversionRate: Number(conversionRate),
        discountSuggestion,
      };
    });

    const byViews = [...enriched].sort((a, b) => b.views - a.views).slice(0, 10);
    const bySold = [...enriched].sort((a, b) => b.sold - a.sold).slice(0, 10);
    const lowConversion = enriched.filter((p) => p.views >= 5 && p.sold === 0).sort((a, b) => b.views - a.views).slice(0, 10);
    const favoriteOnly = enriched.filter((p) => p.favorites >= 2 && p.sold === 0).sort((a, b) => b.favorites - a.favorites).slice(0, 10);

    const avgConversion = enriched.length > 0
      ? (enriched.reduce((sum, p) => sum + Number(p.conversionRate), 0) / enriched.length).toFixed(1)
      : 0;

    return NextResponse.json({
      summary: {
        totalProducts: products.length,
        avgConversion: Number(avgConversion),
        totalViews: Object.values(viewMap).reduce((a, b) => a + b, 0),
        productsWithSales: enriched.filter((p) => p.sold > 0).length,
      },
      byViews,
      bySold,
      lowConversion,
      favoriteOnly,
    });
  } catch (err) {
    console.error("GET conversion-analytics error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
