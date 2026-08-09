import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/authFromCookie";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const user = await getAuthUserFromCookie(req);
  if (!user?.email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
  if (!dbUser) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  try {
    const [totalSales, totalOrders, pendingCommission, paidCommission, productCount, viewStats] = await Promise.all([
      prisma.order.aggregate({ where: { sellerId: dbUser.id, paymentStatus: "paid" }, _sum: { total: true }, _count: true }),
      prisma.order.count({ where: { sellerId: dbUser.id } }),
      prisma.vendorCommission.aggregate({ where: { sellerId: dbUser.id, status: "pending" }, _sum: { commission: true } }),
      prisma.vendorCommission.aggregate({ where: { sellerId: dbUser.id, status: "paid" }, _sum: { commission: true } }),
      prisma.product.count({ where: { userId: dbUser.id, deletedAt: null } }),
      prisma.productView.groupBy({ by: ["productId"], where: { userId: dbUser.id }, _count: true }),
    ]);

    return NextResponse.json({
      totalRevenue: totalSales._sum?.total || 0,
      totalOrders: totalOrders || 0,
      pendingCommission: pendingCommission._sum?.commission || 0,
      paidCommission: paidCommission._sum?.commission || 0,
      productCount,
      totalViews: viewStats.reduce((sum, v) => sum + (v._count || 0), 0),
    });
  } catch {
    return NextResponse.json({ totalRevenue: 0, totalOrders: 0, pendingCommission: 0, paidCommission: 0, productCount: 0, totalViews: 0 });
  }
}
