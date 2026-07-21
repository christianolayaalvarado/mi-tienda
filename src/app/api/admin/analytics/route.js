import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET(req) {
  try {
    const user = await getServerAuthUser(req);
    if (!user || (user.role !== "admin" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers30d,
      totalSellers,
      totalProducts,
      totalOrders,
      orders30d,
      revenue30d,
      totalReviews,
      couponsUsed,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { stores: { some: {} } } }),
      prisma.product.count(),
      prisma.order.count({ where: { status: { notIn: ["cancelled"] } } }),
      prisma.order.count({ where: { status: { notIn: ["cancelled"] }, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.findMany({
        where: { paymentStatus: "paid", createdAt: { gte: thirtyDaysAgo } },
        select: { total: true },
      }).then((orders) => orders.reduce((sum, o) => sum + o.total, 0)),
      prisma.review.count(),
      prisma.coupon.findMany({
        where: { usedCount: { gt: 0 } },
        select: { code: true, usedCount: true, discountValue: true, discountType: true },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      newUsers30d,
      totalSellers,
      totalProducts,
      totalOrders,
      orders30d,
      revenue30d,
      totalReviews,
      couponsUsed: couponsUsed.reduce((sum, c) => sum + c.usedCount, 0),
      topCoupons: couponsUsed.sort((a, b) => b.usedCount - a.usedCount).slice(0, 5),
    });
  } catch (err) {
    console.error("GET admin analytics error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
