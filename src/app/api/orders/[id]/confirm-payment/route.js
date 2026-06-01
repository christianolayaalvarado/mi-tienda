// app/api/orders/[id]/confirm-payment/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const isValidObjectId = (id) => typeof id === "string" && id.length > 0;

export async function POST(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;

    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || body?.type || "confirmPayment";

    // Obtener usuario y orden
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { stores: true } });
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { items: true } } },
    });

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const isOwner = String(order.userId) === String(session.user.id);
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = order.orderItems.some((oi) => sellerStoreIds.includes(String(oi.storeId)));
    const isAdmin = user?.role === "admin";

    // Acción: confirmar pago completo (comprador o admin)
    if (action === "confirmPayment" || action === "markPaid") {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "No autorizado para marcar pago" }, { status: 403 });
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "paid", status: "processing", paidAt: new Date() },
      });

      return NextResponse.json({ success: true, order: updated });
    }

    // Acción: marcar pago solo para la tienda del vendedor
    if (action === "markStorePaid") {
      if (!isSellerOfOrder && !isAdmin) {
        return NextResponse.json({ error: "No autorizado para marcar pago de tienda" }, { status: 403 });
      }

      const { storeId } = body;
      if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

      await prisma.orderItem.updateMany({
        where: { orderId, storeId },
        data: { paymentStatus: "paid" },
      });

      // Opcional: si todas las orderItems quedan pagadas, marcar orden completa como paid
      const refreshed = await prisma.order.findUnique({ where: { id: orderId }, include: { orderItems: true } });
      const allPaid = refreshed.orderItems.every((oi) => oi.paymentStatus === "paid");
      if (allPaid) {
        await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "paid", status: "processing", paidAt: new Date() } });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (err) {
    console.error("🔥 ERROR confirm-payment route:", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error confirmando pago" }, { status: 500 });
  }
}
