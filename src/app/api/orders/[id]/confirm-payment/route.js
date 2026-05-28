import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { sendPaymentConfirmedEmail } from "@/lib/email"

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id)

export async function POST(req, context) {
  try {
    const { params } = await context
    const orderId = params?.id

    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { store: true } },
        user: true,
      },
    })

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })

    const isOwner = order.userId === session.user.id
    const isSeller = order.orderItems.some((item) => item.store?.userId === session.user.id)
    if (!isOwner && !isSeller) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ success: true, message: "La orden ya estaba pagada" })
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "paid", status: "completed", paidAt: new Date() },
    })

    await prisma.orderItem.updateMany({
      where: { orderId },
      data: { paymentStatus: "paid" },
    })

    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: { include: { store: { include: { user: true } } } },
      },
    })

    if (fullOrder?.user?.email) {
      await sendPaymentConfirmedEmail({ to: fullOrder.user.email, orderId })
    }

    const notifiedEmails = new Set()
    for (const item of fullOrder.orderItems) {
      const sellerEmail = item.store?.user?.email
      if (sellerEmail && !notifiedEmails.has(sellerEmail)) {
        notifiedEmails.add(sellerEmail)
        await sendPaymentConfirmedEmail({ to: sellerEmail, orderId })
      }
    }

    return NextResponse.json({ success: true, message: "Pago confirmado correctamente" })
  } catch (error) {
    console.error("🔥 ERROR CONFIRM PAYMENT:", error)
    return NextResponse.json({ error: "Error confirmando pago" }, { status: 500 })
  }
}
