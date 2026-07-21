import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const storeIds = stores.map((s) => s.id);

    const storeProducts = await prisma.product.findMany({
      where: { storeId: { in: storeIds } },
      select: { id: true, stock: true, price: true },
    });
    const productIds = storeProducts.map((p) => p.id);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalOrders, recentOrders, totalRevenue, recentRevenue, totalFavorites] = await Promise.all([
      prisma.orderItem.findMany({
        where: { productId: { in: productIds }, order: { status: { notIn: ["cancelled"] } } },
        select: { quantity: true, price: true, orderId: true },
      }).then((items) => ({
        count: new Set(items.map((i) => i.orderId)).size,
        items,
      })),
      prisma.orderItem.findMany({
        where: {
          productId: { in: productIds },
          order: { status: { notIn: ["cancelled"] }, createdAt: { gte: sevenDaysAgo } },
        },
        select: { quantity: true, price: true, orderId: true },
      }).then((items) => ({
        count: new Set(items.map((i) => i.orderId)).size,
        items,
      })),
      prisma.orderItem.findMany({
        where: { productId: { in: productIds }, order: { paymentStatus: "paid" } },
        select: { quantity: true, price: true },
      }).then((items) => items.reduce((sum, i) => sum + i.price * i.quantity, 0)),
      prisma.orderItem.findMany({
        where: {
          productId: { in: productIds },
          order: { paymentStatus: "paid", createdAt: { gte: thirtyDaysAgo } },
        },
        select: { quantity: true, price: true },
      }).then((items) => items.reduce((sum, i) => sum + i.price * i.quantity, 0)),
      prisma.favorite.count({
        where: { productId: { in: productIds } },
      }),
    ]);

    const lowStockProducts = storeProducts.filter((p) => p.stock <= 3 && p.stock > 0).length;
    const outOfStock = storeProducts.filter((p) => p.stock === 0).length;
    const totalStockValue = storeProducts.reduce((sum, p) => sum + p.stock * p.price, 0);

    return NextResponse.json({
      totalProducts: storeProducts.length,
      totalStores: stores.length,
      totalOrders: totalOrders.count,
      ordersLast7Days: recentOrders.count,
      totalRevenue,
      revenueLast30Days: recentRevenue,
      totalFavorites,
      lowStockProducts,
      outOfStock,
      totalStockValue,
    });
  } catch (err) {
    console.error("GET analytics error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
