import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET(req) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (authUser.role !== "admin" && authUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");

    const where = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: {
          include: {
            store: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
            items: { include: { product: true } },
          },
        },
        paymentMethod: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("GET /api/admin/orders error:", err);
    return NextResponse.json({ error: "Error obteniendo órdenes" }, { status: 500 });
  }
}
