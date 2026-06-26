// src/app/api/orders/[id]/cancel/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";
import { sendOrderCancelledTemplate } from "@/lib/email";
import { orderCancelledBuyerTemplate, orderCancelledSellerTemplate } from "@/lib/emailTemplates";

const isValidObjectId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

export async function POST(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return NextResponse.json({ error: "El motivo de cancelación es obligatorio" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stores: true },
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            store: { include: { user: { select: { email: true, name: true } } } },
            items: { include: { product: true } },
          },
        },
        user: { select: { email: true, name: true } },
      },
    });

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    if (order.status === "cancelled") {
      return NextResponse.json({ error: "La orden ya está cancelada" }, { status: 400 });
    }

    const isOwner = String(order.userId) === String(authUser.id);
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = order.orderItems.some((oi) => sellerStoreIds.includes(String(oi.storeId)));
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isSellerOfOrder && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const hasPaymentProof = !!order.paymentProof;
    const hasPayment = order.paymentStatus === "paid" || order.paymentStatus === "pending_verification";

    // Si tiene comprobante pero no está pagado, solo el vendedor/admin puede cancelar
    if (hasPaymentProof && !hasPayment && !isSellerOfOrder && !isAdmin) {
      return NextResponse.json({
        error: "Solo el vendedor puede cancelar órdenes con comprobante pendiente de verificación",
      }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Restaurar stock si fue descontado
      if (order.stockDeducted) {
        for (const oi of order.orderItems || []) {
          for (const p of oi.items || []) {
            const productId = p.productId;
            const qty = Number(p.quantity || 0);
            if (!productId || qty <= 0) continue;
            try {
              await tx.product.update({
                where: { id: productId },
                data: { stock: { increment: qty } },
              });
            } catch (e) {
              console.warn("No se pudo restaurar stock:", productId, e?.message || e);
            }
          }
        }
      }

      // Actualizar orden
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "cancelled",
          paymentStatus: hasPayment ? "refunded" : order.paymentStatus,
          refundStatus: hasPayment ? "pending" : "none",
          deleted: true,
          deletedAt: new Date(),
          deletedBy: authUser.id,
          deletedReason: reason,
        },
      });

      // Registrar historial
      try {
        await tx.orderHistory.create({
          data: {
            orderId,
            action: "cancelled",
            byUserId: authUser.id,
            note: `Orden cancelada. Motivo: ${reason}${hasPayment ? " (pago registrado, reembolso pendiente)" : ""}`,
          },
        });
      } catch (e) {
        console.warn("No se pudo registrar orderHistory:", e?.message || e);
      }

      return updated;
    });

    // Enviar emails de notificación (no bloquear)
    const orderNumber = order.orderNumber || order.id;
    const buyerEmail = order.customerEmail || order.user?.email;
    const buyerName = order.customerName || order.user?.name || "Cliente";

    const buildItems = (items) => items.map((it) => ({
      productName: it.product?.title || "Producto",
      quantity: it.quantity,
      price: it.price,
    }));

    const allItems = order.orderItems.flatMap((oi) => oi.items || []);

    // Email al comprador
    if (buyerEmail) {
      const buyerTemplate = orderCancelledBuyerTemplate({
        orderNumber,
        userName: buyerName,
        reason,
        total: order.total,
        items: buildItems(allItems),
        hasPayment,
        refundStatus: hasPayment ? "pending" : "none",
      });

      sendOrderCancelledTemplate({ to: buyerEmail, html: buyerTemplate }).catch((e) =>
        console.error("Error email cancel -> buyer:", e?.message || e)
      );
    }

    // Emails a vendedores
    for (const oi of order.orderItems) {
      const sellerEmail = oi.store?.user?.email;
      if (!sellerEmail) continue;

      const sellerTemplate = orderCancelledSellerTemplate({
        orderNumber,
        sellerName: oi.store?.name || oi.store?.user?.name || "Vendedor",
        reason,
        total: order.total,
        items: buildItems(oi.items || []),
        buyerName,
        hasPayment,
      });

      sendOrderCancelledTemplate({ to: sellerEmail, html: sellerTemplate }).catch((e) =>
        console.error(`Error email cancel -> seller (${sellerEmail}):`, e?.message || e)
      );
    }

    return NextResponse.json({
      success: true,
      order: result,
      message: hasPayment
        ? "Orden cancelada. El pago registrado será procesado para reembolso."
        : "Orden cancelada exitosamente.",
    });
  } catch (err) {
    console.error("ERROR CANCEL ORDER:", err);
    return NextResponse.json({ error: "Error cancelando orden" }, { status: 500 });
  }
}
