import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

// 🔹 validar ObjectId
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id)

// ==============================
// 🔹 GET ORDER
// ==============================
export async function GET(req, context) {
  try {
    const contextData = await context
    const orderId = contextData?.params?.id

    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            store: true,
            items: { include: { product: true } },
          },
        },
      },
    })

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
    if (order.userId !== session.user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    return NextResponse.json(order)
  } catch (err) {
    console.error("🔥 ERROR GET ORDER:", err)
    return NextResponse.json({ error: "Error obteniendo orden" }, { status: 500 })
  }
}

// ==============================
// 🔥 DELETE ORDER
// ==============================
export async function DELETE(req, context) {
  try {
    const contextData = await context
    const orderId = contextData?.params?.id

    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { items: true } } },
    })

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
    if (order.userId !== session.user.id) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    // 🔥 restaurar stock
    for (const orderItem of order.orderItems) {
      for (const item of orderItem.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }

    await prisma.orderItem.deleteMany({ where: { orderId } })
    await prisma.order.delete({ where: { id: orderId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("🔥 ERROR DELETE ORDER:", err)
    return NextResponse.json({ error: "Error eliminando orden" }, { status: 500 })
  }
}
