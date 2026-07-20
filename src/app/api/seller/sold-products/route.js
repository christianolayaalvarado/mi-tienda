import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET(req) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stores: { select: { id: true } } },
    });

    if (!user?.stores?.length) {
      return NextResponse.json({ products: [] });
    }

    const storeIds = user.stores.map((s) => s.id);

    // Get all paid orderItems for this seller's stores
    const orderItems = await prisma.orderItem.findMany({
      where: {
        storeId: { in: storeIds },
        paymentStatus: "paid",
      },
      include: {
        items: {
          include: { product: { select: { id: true, title: true, price: true, images: true, stock: true } } },
        },
        order: { select: { id: true, orderNumber: true, createdAt: true } },
      },
    });

    // Aggregate by product
    const productMap = new Map();
    for (const oi of orderItems) {
      for (const item of oi.items || []) {
        const pid = item.productId;
        if (!pid) continue;
        const product = item.product;
        if (!product) continue;

        if (!productMap.has(pid)) {
          productMap.set(pid, {
            id: product.id,
            title: product.title,
            price: product.price,
            images: product.images,
            currentStock: Math.max(0, product.stock),
            totalSold: 0,
            totalRevenue: 0,
            orderCount: 0,
            orders: [],
          });
        }

        const entry = productMap.get(pid);
        entry.totalSold += item.quantity || 0;
        entry.totalRevenue += (item.price || 0) * (item.quantity || 0);
        entry.orderCount += 1;
        if (entry.orders.length < 5) {
          entry.orders.push({
            orderNumber: oi.order?.orderNumber,
            date: oi.order?.createdAt,
            quantity: item.quantity,
            price: item.price,
          });
        }
      }
    }

    const products = Array.from(productMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

    return NextResponse.json({ products });
  } catch (err) {
    console.error("Error sold products:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
