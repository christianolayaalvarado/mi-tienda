import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

// 🔹 validar ObjectId
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(id)
}

export async function POST(req, context) {
  try {
    // ✅ Next 15 fix
    const { params } = await context
    const orderId = params?.id

    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // 🔹 buscar orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            store: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      )
    }

    // 🔥 IMPORTANTE (puedes mejorar con roles luego)
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    // 🔥 actualizar orden principal
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "paid",
      },
    })

    // 🔥 actualizar sub-órdenes
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: {
        paymentStatus: "paid",
      },
    })

    return NextResponse.json({
      message: "Pago aprobado correctamente",
    })

  } catch (error) {
    console.error("🔥 ERROR APPROVE ORDER:", error)

    return NextResponse.json(
      { error: "Error aprobando pago" },
      { status: 500 }
    )
  }
}