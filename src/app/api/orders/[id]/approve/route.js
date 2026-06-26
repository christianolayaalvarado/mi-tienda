import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { sendPaymentConfirmedToBuyer, sendPaymentConfirmedToSeller } from "@/lib/email"

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id)

export async function POST(req, context) {
  try {
    const { params } = await context
    const orderId = params?.id

    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            store: { include: { user: { select: { email: true, name: true } } } },
          },
        },
        user: { select: { email: true, name: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })
    }

    // Verificar autorización (solo el dueño de la orden o admin puede aprobar)
    const isAdmin = session.user?.role === "admin"
    if (order.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Actualizar orden principal
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "paid",
        status: "processing",
        paidAt: new Date(),
        paymentVerifiedBy: session.user.id,
        paymentVerifiedAt: new Date(),
      },
    })

    // Actualizar sub-órdenes
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: { paymentStatus: "paid" },
    })

    // Enviar emails de notificación (no bloquear la respuesta)
    try {
      const buyerEmail = order.customerEmail || order.user?.email;
      const buyerOrder = {
        id: order.id,
        orderNumber: order.orderNumber || order.id,
        total: order.total,
        userName: order.customerName || order.user?.name,
        items: order.orderItems.flatMap((oi) =>
          (oi.items || []).map((it) => ({
            productName: it.product?.name || "Producto",
            quantity: it.quantity,
            price: it.price,
          }))
        ),
      };

      // Email al comprador
      if (buyerEmail) {
        sendPaymentConfirmedToBuyer({ to: buyerEmail, order: buyerOrder }).catch((e) =>
          console.error("Error enviando email de pago confirmado al comprador:", e?.message || e)
        );
      }

      // Emails a cada vendedor
      for (const oi of order.orderItems) {
        const sellerEmail = oi.store?.user?.email;
        if (!sellerEmail) continue;

        const sellerOrder = {
          id: order.id,
          orderNumber: order.orderNumber || order.id,
          total: order.total,
          sellerName: oi.store?.name || oi.store?.user?.name || "Vendedor",
          items: (oi.items || []).map((it) => ({
            productName: it.product?.name || "Producto",
            quantity: it.quantity,
            price: it.price,
          })),
        };

        sendPaymentConfirmedToSeller({ to: sellerEmail, order: sellerOrder }).catch((e) =>
          console.error(`Error enviando email de pago confirmado a seller (${sellerEmail}):`, e?.message || e)
        );
      }

    } catch (emailErr) {
      console.error("[approve] Error en proceso de notificaciones:", emailErr?.message || emailErr);
    }

    return NextResponse.json({ message: "Pago aprobado correctamente" })
  } catch (error) {
    console.error("ERROR APPROVE ORDER:", error)
    return NextResponse.json({ error: "Error aprobando pago" }, { status: 500 })
  }
}
