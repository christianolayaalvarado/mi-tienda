import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// validar ObjectId simple
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

// ==============================
// GET ORDER BY ID
// ==============================
export async function GET(req, { params }) {
  try {
    const orderId = params?.id;

    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Traer orden con relaciones completas
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            store: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    console.log("DEBUG GET ORDER - params.id:", orderId);
    console.log("DEBUG session.user.id:", session?.user?.id);

    if (!order) {
      console.warn("ORDER NOT FOUND - prisma returned null for id:", orderId);
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // comparar como strings para evitar mismatch de tipos
    if (String(order.userId) !== String(session.user.id)) {
      console.warn("UNAUTHORIZED - order.userId vs session.user.id:", String(order.userId), String(session.user.id));
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("🔥 ERROR GET ORDER:", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error obteniendo orden" }, { status: 500 });
  }
}

// ==============================
// DELETE ORDER BY ID
// ==============================
export async function DELETE(req, { params }) {
  try {
    const orderId = params?.id;

    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    if (String(order.userId) !== String(session.user.id)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Restaurar stock
    for (const orderItem of order.orderItems) {
      for (const item of orderItem.items) {
        try {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        } catch (uErr) {
          console.error("Error restaurando stock para producto:", item.productId, uErr);
        }
      }
    }

    // Eliminar hijos y luego la orden
    await prisma.orderItemProduct.deleteMany({
      where: { orderItemId: { in: order.orderItems.map((oi) => oi.id) } },
    });

    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 ERROR DELETE ORDER:", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error eliminando orden" }, { status: 500 });
  }
}
