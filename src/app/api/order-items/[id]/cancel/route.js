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

    const orderItemId = params.id

    // 🔍 Buscar sub-orden
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true,
        items: true,
      },
    })

    if (!orderItem) {
      return NextResponse.json({ error: "Sub-orden no encontrada" }, { status: 404 })
    }

    if (orderItem.order.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    if (orderItem.paymentStatus !== "pending") {
      return NextResponse.json(
        { error: "Solo se pueden cancelar sub-órdenes pendientes" },
        { status: 400 }
      )
    }

    // 🔄 Devolver stock SOLO de esta tienda
    for (const item of orderItem.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      })
    }

    // ❌ Cancelar sub-orden
    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        paymentStatus: "cancelled",
      },
    })

    // 🔎 Verificar si TODA la orden está cancelada
    const remaining = await prisma.orderItem.count({
      where: {
        orderId: orderItem.orderId,
        paymentStatus: {
          not: "cancelled",
        },
      },
    })

    if (remaining === 0) {
      await prisma.order.update({
        where: { id: orderItem.orderId },
        data: {
          status: "cancelled",
        },
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error cancelando sub-orden:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}