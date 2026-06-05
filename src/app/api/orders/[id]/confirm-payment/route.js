// app/api/orders/[id]/confirm-payment/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const isValidId = (id) => typeof id === "string" && id.length > 0;

export async function POST(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId || !isValidId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || body?.type || "confirmPayment";

    // Cargar usuario (con stores si es vendedor) y orden con orderItems + sus items
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email },
      include: { stores: true },
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { items: true } } },
    });

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const sessionUserId = session.user?.id;
    const isAdmin = user?.role === "admin";
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = (order.orderItems || []).some((oi) =>
      sellerStoreIds.includes(String(oi.storeId))
    );

    // --- Acción: marcar orden completa como pagada (solo vendedor relacionado o admin) ---
    if (action === "confirmPayment" || action === "markPaid") {
      if (!isSellerOfOrder && !isAdmin) {
        return NextResponse.json({ error: "No autorizado para marcar pago" }, { status: 403 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const freshOrder = await tx.order.findUnique({
          where: { id: orderId },
          include: { orderItems: { include: { items: true } } },
        });
        if (!freshOrder) throw new Error("Orden no encontrada en transacción");

        if (freshOrder.paymentStatus === "paid") {
          return { alreadyPaid: true, order: freshOrder };
        }

        // Descontar stock recorriendo orderItems -> items (OrderItemProduct)
        if (!freshOrder.stockDeducted) {
          for (const oi of freshOrder.orderItems || []) {
            const products = oi.items || [];
            for (const p of products) {
              const productId = p.productId || p.product?.id || null;
              const qty = Number(p.quantity || 0);
              if (!productId || !Number.isFinite(qty) || qty <= 0) {
                console.warn("Omitiendo decrement stock por datos incompletos:", {
                  productId,
                  qty,
                  orderItemId: oi.id,
                });
                continue;
              }
              try {
                await tx.product.update({
                  where: { id: productId },
                  data: { stock: { decrement: qty } },
                });
              } catch (e) {
                console.warn("No se pudo decrementar stock para productId:", productId, e?.message || e);
              }
            }
          }
        }

        // Actualizar la orden con campos de auditoría y estado
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "paid",
            status: "processing",
            paidAt: new Date(),
            paymentVerifiedBy: sessionUserId,
            paymentVerifiedAt: new Date(),
            stockDeducted: true,
          },
        });

        // Marcar todos los orderItems como pagados
        try {
          await tx.orderItem.updateMany({
            where: { orderId },
            data: { paymentStatus: "paid" },
          });
        } catch (e) {
          console.warn("No se pudo actualizar orderItems.paymentStatus:", e?.message || e);
        }

        // Registrar auditoría en OrderHistory
        try {
          await tx.orderHistory.create({
            data: {
              orderId,
              action: "mark_paid",
              byUserId: sessionUserId,
              note: "Pago verificado por vendedor/admin",
            },
          });
        } catch (e) {
          console.warn("No se pudo registrar orderHistory:", e?.message || e);
        }

        return { alreadyPaid: false, order: updatedOrder };
      });

      return NextResponse.json({ success: true, result });
    }

    // --- Acción: marcar pago solo para la tienda del vendedor ---
    if (action === "markStorePaid") {
      if (!isSellerOfOrder && !isAdmin) {
        return NextResponse.json({ error: "No autorizado para marcar pago de tienda" }, { status: 403 });
      }
      const { storeId } = body;
      if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

      const result = await prisma.$transaction(async (tx) => {
        // Actualizar orderItems de esa tienda
        await tx.orderItem.updateMany({
          where: { orderId, storeId },
          data: { paymentStatus: "paid" },
        });

        // Registrar auditoría
        await tx.orderHistory.create({
          data: {
            orderId,
            action: "mark_store_paid",
            byUserId: sessionUserId,
            note: `Pago marcado como pagado para storeId ${storeId}`,
          },
        });

        // Revisar si ahora todos los orderItems están pagados
        const refreshed = await tx.order.findUnique({
          where: { id: orderId },
          include: { orderItems: { include: { items: true } } },
        });
        const allPaid = (refreshed.orderItems || []).every((oi) => oi.paymentStatus === "paid");

        if (allPaid && refreshed.paymentStatus !== "paid") {
          // Descontar stock si no se ha hecho antes
          if (!refreshed.stockDeducted) {
            for (const oi of refreshed.orderItems || []) {
              const products = oi.items || [];
              for (const p of products) {
                const productId = p.productId || p.product?.id || null;
                const qty = Number(p.quantity || 0);
                if (!productId || !Number.isFinite(qty) || qty <= 0) {
                  console.warn("Omitiendo decrement stock por datos incompletos:", {
                    productId,
                    qty,
                    orderItemId: oi.id,
                  });
                  continue;
                }
                try {
                  await tx.product.update({
                    where: { id: productId },
                    data: { stock: { decrement: qty } },
                  });
                } catch (e) {
                  console.warn("No se pudo decrementar stock para productId:", productId, e?.message || e);
                }
              }
            }
          }

          const updated = await tx.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: "paid",
              status: "processing",
              paidAt: new Date(),
              paymentVerifiedBy: sessionUserId,
              paymentVerifiedAt: new Date(),
              stockDeducted: true,
            },
          });

          await tx.orderHistory.create({
            data: {
              orderId,
              action: "mark_paid_after_all_stores",
              byUserId: sessionUserId,
              note: "Orden marcada como pagada porque todas las tiendas confirmaron pago",
            },
          });

          return { success: true, allPaid: true, order: updated };
        }

        return { success: true, allPaid: false };
      });

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (err) {
    console.error("🔥 ERROR confirm-payment route:", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error confirmando pago" }, { status: 500 });
  }
}
