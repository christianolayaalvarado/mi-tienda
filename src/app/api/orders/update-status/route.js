import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

const VALID_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled", "pending_verification"];

export async function PUT(req) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { orderId, status } = await req.json().catch(() => ({}));

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Estado inválido. Valores permitidos: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Buscar orden con sus orderItems
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Cargar usuario completo para validar roles y tiendas
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { stores: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "admin";
    const isBuyer = String(order.userId) === String(user.id);
    
    // Tiendas del vendedor
    const sellerStoreIds = (user.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = order.orderItems.some((oi) =>
      sellerStoreIds.includes(String(oi.storeId))
    );

    let authorized = false;

    // Reglas de autorización:
    // 1. Admin puede todo
    if (isAdmin) {
      authorized = true;
    }
    // 2. El vendedor relacionado con la orden puede cambiar el estado (ej. a procesando, enviado, etc.)
    else if (isSellerOfOrder) {
      authorized = true;
    }
    // 3. El comprador puede cancelar su orden sólo si aún no ha sido pagada/procesada
    else if (isBuyer && status === "cancelled") {
      if (order.status === "pending" && order.paymentStatus !== "paid") {
        authorized = true;
      } else {
        return NextResponse.json(
          { error: "No se puede cancelar una orden que ya está pagada o en proceso" },
          { status: 400 }
        );
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "No autorizado para cambiar el estado de esta orden" },
        { status: 403 }
      );
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Registrar en el historial de la orden
    try {
      await prisma.orderHistory.create({
        data: {
          orderId,
          action: `update_status_${status}`,
          byUserId: user.id,
          note: `Estado cambiado a ${status} por ${isAdmin ? "admin" : isSellerOfOrder ? "vendedor" : "comprador"}`,
        },
      });
    } catch (e) {
      console.warn("No se pudo registrar orderHistory en update-status:", e?.message || e);
    }

    // Si se marcó como entregada, enviar email pidiendo reseña
    if (status === "delivered") {
      try {
        const buyer = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { email: true, name: true },
        });
        if (buyer?.email) {
          const { sendReviewRequestEmail } = await import("@/lib/email");
          sendReviewRequestEmail({
            to: buyer.email,
            buyerName: buyer.name,
            orderId: order.id,
            orderNumber: order.orderNumber,
          }).catch(() => {});
        }
      } catch (e) {
        console.warn("Error sending review request email:", e?.message || e);
      }
    }

    return NextResponse.json({ success: true, status: updated.status });

  } catch (err) {
    console.error("🔥 ERROR update-status route:", err);
    return NextResponse.json(
      { error: "Error actualizando estado" },
      { status: 500 }
    );
  }
}