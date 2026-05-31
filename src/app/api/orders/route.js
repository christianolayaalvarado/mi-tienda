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

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { items, customer = {}, paymentMethod = "manual", total } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No hay items en la orden" }, { status: 400 });
    }

    // Obtener usuario y su tienda
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { stores: true },
    });

    if (!user || !user.stores || user.stores.length === 0) {
      return NextResponse.json({ error: "No tienes tienda creada" }, { status: 400 });
    }

    const userId = user.id;

    // Agrupar por tienda para crear orderItems por store
    const groups = groupByStore(items);

    // Ejecutar en transacción: crear orden con hijos y decrementar stock
    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          total: Number(total) || items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0),
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

      // Decrementar stock por cada producto
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

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders error:", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error creando orden" }, { status: 500 });
  }
}
