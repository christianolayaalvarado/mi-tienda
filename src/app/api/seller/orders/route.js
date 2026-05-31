// app/api/seller/orders/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscar usuario con su tienda
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { stores: true },
    });

    if (!user || !user.stores || user.stores.length === 0) {
      return NextResponse.json({ error: "No tienes tienda" }, { status: 400 });
    }

    const storeId = user.stores[0].id;

    // SOLO órdenes que contienen items de ESTA tienda
    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            storeId: storeId,
          },
        },
      },
      include: {
        orderItems: {
          where: {
            storeId: storeId, // solo los orderItems de esta tienda
          },
          include: {
            store: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        user: true, // cliente
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Normalizar la forma de los datos para el frontend
    const normalized = orders.map((o) => ({
      id: o.id || (o._id && String(o._id)),
      orderNumber: o.orderNumber || null,
      createdAt: o.createdAt,
      total: o.total,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      customerName: o.customerName || o.user?.name || "",
      customerEmail: o.customerEmail || o.user?.email || "",
      documentNumber: o.documentNumber || null,
      orderItems: (o.orderItems || []).map((oi) => ({
        id: oi.id || (oi._id && String(oi._id)),
        storeId: oi.storeId,
        store: oi.store ? { id: oi.store.id, name: oi.store.name } : null,
        paymentStatus: oi.paymentStatus,
        items: (oi.items || []).map((it) => ({
          id: it.id || (it._id && String(it._id)),
          productId: it.productId,
          product: it.product ? { id: it.product.id, title: it.product.title } : null,
          quantity: it.quantity,
          price: it.price,
        })),
      })),
    }));

    return NextResponse.json({ orders: normalized });
  } catch (error) {
    console.error("Error seller orders:", error);
    return NextResponse.json({ error: "Error obteniendo órdenes del seller" }, { status: 500 });
  }
}
