import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(req) {
  try {
    // 🔐 Validar sesión
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // 📦 Leer body correctamente
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Body inválido" },
        { status: 400 }
      );
    }

    const { ids } = body;

    // 🔍 Validar IDs
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // 🔥 Obtener órdenes con items
    const orders = await prisma.order.findMany({
      where: {
        id: { in: ids },
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

    // 🔥 Restaurar stock
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

    // 🔥 Eliminar relaciones (orden correcto)

    // 1. eliminar productos de orderItem
    await prisma.orderItemProduct.deleteMany({
      where: {
        orderItem: {
          orderId: { in: ids },
        },
      },
    });

    // 2. eliminar orderItems
    await prisma.orderItem.deleteMany({
      where: {
        orderId: { in: ids },
      },
    });

    // 3. eliminar órdenes
    const result = await prisma.order.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Órdenes eliminadas correctamente",
      count: result.count,
    });

  } catch (error) {
    console.error("🔥 ERROR BULK DELETE ORDERS:", error);

    return NextResponse.json(
      {
        error: "Error eliminando órdenes",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}