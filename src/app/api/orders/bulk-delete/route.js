import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// 🔹 helper: validar ObjectId (Mongo)
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(id);
};

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { ids } = body;

    // 🔥 VALIDACIÓN
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // 🔥 filtrar IDs válidos
    const validIds = ids.filter((id) => isValidObjectId(id));

    if (validIds.length === 0) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // 🔥 obtener órdenes con items
    const orders = await prisma.order.findMany({
      where: {
        id: { in: validIds },
        userId: session.user.id,
      },
      include: {
        orderItems: {
          include: {
            items: true,
          },
        },
      },
    });

    // ==============================
    // 🔥 RESTAURAR STOCK
    // ==============================
    for (const order of orders) {
      for (const orderItem of order.orderItems) {
        for (const item of orderItem.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }
    }

    // ==============================
    // 🔥 ELIMINAR RELACIONES
    // ==============================

    // 1. eliminar productos de sub-órdenes
    await prisma.orderItemProduct.deleteMany({
      where: {
        orderItem: {
          orderId: { in: validIds },
        },
      },
    });

    // 2. eliminar sub-órdenes
    await prisma.orderItem.deleteMany({
      where: {
        orderId: { in: validIds },
      },
    });

    // 3. eliminar órdenes
    const result = await prisma.order.deleteMany({
      where: {
        id: { in: validIds },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    });

  } catch (err) {
    console.error("🔥 ERROR BULK DELETE ORDERS:", err);

    return NextResponse.json(
      { error: "Error eliminando órdenes" },
      { status: 500 }
    );
  }
}