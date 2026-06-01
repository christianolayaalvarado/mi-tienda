import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Helper: agrupar items por storeId
const groupByStore = (items) => {
  const map = new Map();
  for (const it of items) {
    const storeId = String(it.storeId || "");
    if (!map.has(storeId)) map.set(storeId, []);
    map.get(storeId).push(it);
  }
  return Array.from(map.entries()).map(([storeId, items]) => ({ storeId, items }));
};

// Helper: generar orderNumber (formato ORD-YYYYMMDD-XXXX)
const formatDatePart = (n) => String(n).padStart(2, "0");

// ==============================
// GET /api/orders  -> listar órdenes del comprador (user)
// ==============================
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        orderItems: {
          include: {
            store: true,
            items: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const normalized = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber || null,
      createdAt: o.createdAt,
      total: o.total,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      documentNumber: o.documentNumber || null,
      orderItems: (o.orderItems || []).map((oi) => ({
        id: oi.id,
        storeId: oi.storeId,
        store: oi.store ? { id: oi.store.id, name: oi.store.name } : null,
        paymentStatus: oi.paymentStatus,
        items: (oi.items || []).map((it) => ({
          id: it.id,
          productId: it.productId,
          product: it.product ? { id: it.product.id, title: it.product.title } : null,
          quantity: it.quantity,
          price: it.price,
        })),
      })),
    }));

    return NextResponse.json({ orders: normalized });
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "Error obteniendo órdenes" }, { status: 500 });
  }
}

// ==============================
// POST /api/orders  -> crear orden (buyer checkout)
// ==============================
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { items, customer = {}, paymentMethod = "manual", total } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No hay items en la orden" }, { status: 400 });
    }

    // Obtener usuario (comprador)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { stores: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 400 });
    }

    const userId = user.id;

    // Agrupar por tienda para crear orderItems por store
    const groups = groupByStore(items);

    // Ejecutar en transacción: crear orden con hijos y decrementar stock
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Generar orderNumber basado en la fecha y la cantidad de órdenes del día
      const now = new Date();
      const y = now.getFullYear();
      const m = formatDatePart(now.getMonth() + 1);
      const d = formatDatePart(now.getDate());
      const prefix = `ORD-${y}${m}${d}`;

      // contar órdenes del día para secuencia
      const startOfDay = new Date(Date.UTC(y, now.getMonth(), now.getDate(), 0, 0, 0));
      const endOfDay = new Date(Date.UTC(y, now.getMonth(), now.getDate(), 23, 59, 59, 999));

      const countToday = await tx.order.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      const seq = String(countToday + 1).padStart(4, "0");
      const orderNumber = `${prefix}-${seq}`;

      // Crear la orden con orderNumber y los orderItems anidados
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber,
          total:
            Number(total) ||
            items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0),
          status: "pending",
          paymentStatus: "unpaid",
          paymentMethod,
          customerName: customer.name || session.user.name || "",
          customerEmail: customer.email || session.user.email || "",
          customerPhone: customer.phone || "",
          customerAddress: customer.address || "",
          orderItems: {
            create: groups.map((g) => ({
              storeId: g.storeId,
              paymentStatus: "unpaid",
              items: {
                create: g.items.map((it) => ({
                  productId: it.productId,
                  quantity: Number(it.quantity) || 1,
                  price: Number(it.price) || 0,
                })),
              },
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              items: true,
            },
          },
        },
      });

      // Decrementar stock por cada producto (dentro de la misma transacción)
      for (const it of items) {
        try {
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { decrement: Number(it.quantity) || 1 } },
          });
        } catch (stockErr) {
          console.error("Error decrementando stock para producto:", it.productId, stockErr);
          // No abortamos la transacción por un fallo de stock aquí; depende de tu política.
        }
      }

      return order;
    });

    // Recuperar la orden completa con relaciones para devolver al cliente
    const fullOrder = await prisma.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        orderItems: {
          include: {
            store: true,
            items: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!fullOrder) {
      // Esto es raro, pero manejamos el caso
      return NextResponse.json({ error: "Orden creada pero no encontrada" }, { status: 500 });
    }

    // Normalizar id y devolver orderNumber para que el frontend lo use con seguridad
    const response = {
      id: fullOrder.id,
      order: fullOrder,
      orderNumber: fullOrder.orderNumber || null,
    };

    return NextResponse.json(response, {
      status: 201,
      headers: { Location: `/api/orders/${fullOrder.id}` },
    });
  } catch (err) {
    console.error("POST /api/orders error:", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error creando orden" }, { status: 500 });
  }
}
