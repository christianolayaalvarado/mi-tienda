import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req, { params }) {
  try {
    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // 🔹 Devolver stock
    await Promise.all(
      order.items.flatMap((orderItem) =>
        orderItem.items.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
            },
          })
        )
      )
    );

    return NextResponse.json({ message: "Stock restaurado correctamente" });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error restaurando stock" },
      { status: 500 }
    );
  }
}