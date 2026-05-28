import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

const prisma = new PrismaClient()

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const orderId = params.id

    // 🔍 Buscar orden con sub-órdenes y productos
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            items: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Solo se pueden cancelar órdenes pendientes" },
        { status: 400 }
      )
    }

    // 🔄 Devolver stock de TODOS los productos
    for (const sub of order.orderItems) {
      for (const item of sub.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }
    }

    // ❌ Cancelar TODAS las sub-órdenes (OrderItem)
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: {
        paymentStatus: "cancelled",
      },
    })

    // 🧾 Cancelar orden principal
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "cancelled",
        paymentStatus: "refunded",
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error cancelando orden:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}