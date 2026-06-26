// app/api/seller/orders/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET(req) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscar usuario con sus tiendas
    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stores: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const storeIds = (user.stores || []).map((s) => s.id).filter(Boolean);
    if (storeIds.length === 0) {
      return NextResponse.json({ error: "No tienes tienda" }, { status: 400 });
    }

    // Paginación opcional: ?limit=20&cursor=<createdAt ISO>
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
    const cursor = url.searchParams.get("cursor") || undefined;

    // SOLO órdenes que contienen items de ALGUNA de las tiendas del usuario
    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            storeId: { in: storeIds },
          },
        },
      },
      include: {
        // Incluir solo los orderItems pertenecientes a las tiendas del seller
        orderItems: {
          where: {
            storeId: { in: storeIds },
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
        user: true, // cliente (info mínima)
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { createdAt: new Date(cursor) }, skip: 1 } : {}),
    });

    // Normalizar la forma de los datos para el frontend
    const normalized = orders.map((o) => ({
      id: o.id || (o._id && String(o._id)) || null,
      orderNumber: o.orderNumber || null,
      createdAt: o.createdAt,
      total: o.total,
      status: o.status || null,
      paymentStatus: o.paymentStatus || null,
      paymentMethod: o.paymentMethod || null,
      customerName: o.customerName || o.user?.name || "",
      customerEmail: o.customerEmail || o.user?.email || "",
      documentNumber: o.documentNumber || null,
      // Campos de eliminación normalizados
      deleted: typeof o.deleted !== "undefined" ? !!o.deleted : false,
      deletedReason: o.deletedReason || null,
      deletedAt: o.deletedAt || null,
      deletedBy: o.deletedBy || null,
      // Otros campos útiles
      paymentProof: o.paymentProof || null,
      orderItems: (o.orderItems || []).map((oi) => ({
        id: oi.id || (oi._id && String(oi._id)) || null,
        storeId: oi.storeId,
        store: oi.store ? { id: oi.store.id, name: oi.store.name } : null,
        paymentStatus: oi.paymentStatus,
        items: (oi.items || []).map((it) => ({
          id: it.id || (it._id && String(it._id)) || null,
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
