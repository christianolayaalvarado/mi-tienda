// app/api/orders/[id]/confirm-payment/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";
import { sendPaymentConfirmedToBuyer, sendPaymentConfirmedToSeller, sendProofReceivedEmail } from "@/lib/email";

const isValidId = (id) => typeof id === "string" && id.length > 0;

export async function POST(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId || !isValidId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || body?.type || "confirmPayment";

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stores: true },
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { items: { include: { product: true } }, store: { include: { user: { select: { email: true, name: true } } } } } },
        user: { select: { email: true, name: true } },
      },
    });

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const sessionUserId = authUser.id;
    const isAdmin = user?.role === "admin";
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = (order.orderItems || []).some((oi) =>
      sellerStoreIds.includes(String(oi.storeId))
    );

    // --- confirmPayment / markPaid ---
    if (action === "confirmPayment" || action === "markPaid") {
      if (!isSellerOfOrder && !isAdmin) {
        return NextResponse.json({ error: "No autorizado para marcar pago" }, { status: 403 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const freshOrder = await tx.order.findUnique({
          where: { id: orderId },
          include: { orderItems: { include: { items: { include: { product: true } } } } },
        });
        if (!freshOrder) throw new Error("Orden no encontrada en transacción");
        if (freshOrder.paymentStatus === "paid") return { alreadyPaid: true, order: freshOrder };

        const orderItemsToPay = freshOrder.orderItems.filter((oi) => {
          if (isAdmin) return true;
          return sellerStoreIds.includes(String(oi.storeId));
        });

        if (orderItemsToPay.length === 0) {
          throw new Error("No tienes ítems en esta orden asignados a tus tiendas");
        }

        const orderItemIdsToPay = orderItemsToPay.map((oi) => oi.id);
        await tx.orderItem.updateMany({
          where: { id: { in: orderItemIdsToPay } },
          data: { paymentStatus: "paid" },
        });

        // Descontar stock si no se ha hecho
        if (!freshOrder.stockDeducted) {
          for (const oi of orderItemsToPay) {
            for (const p of oi.items || []) {
              const qty = Number(p.quantity || 0);
              if (!p.productId || qty <= 0) continue;
              try {
                await tx.product.update({ where: { id: p.productId }, data: { stock: { decrement: qty } } });
              } catch (e) {
                console.warn("No se pudo decrementar stock:", p.productId, e?.message || e);
              }
            }
          }
        }

        // Verificar si todos los items están pagados
        const refreshedOrderItems = await tx.orderItem.findMany({ where: { orderId } });
        const allPaid = refreshedOrderItems.every((oi) => oi.paymentStatus === "paid");

        let updatedOrder = freshOrder;
        if (allPaid) {
          updatedOrder = await tx.order.update({
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
        }

        // Auditoría
        try {
          const storeNames = orderItemsToPay.map((oi) => oi.storeId).join(", ");
          await tx.orderHistory.create({
            data: {
              orderId,
              action: isAdmin ? "mark_paid" : "mark_store_paid_auto",
              byUserId: sessionUserId,
              note: isAdmin
                ? "Orden completa marcada como pagada por administrador"
                : `Vendedor confirmó pago de ítems para tienda(s): ${storeNames}. ${allPaid ? "Todos los pagos completados." : "Pendiente confirmación de otras tiendas."}`,
            },
          });
        } catch (e) {
          console.warn("No se pudo registrar orderHistory:", e?.message || e);
        }

        return { alreadyPaid: false, order: updatedOrder, allPaid };
      });

      // Enviar emails después de la transacción (no bloquear)
      if (!result.alreadyPaid) {
        const buyerEmail = order.customerEmail || order.user?.email;
        const orderNumber = order.orderNumber || order.id;

        const buildOrder = (items) => items.map((it) => ({
          productName: it.product?.name || "Producto",
          quantity: it.quantity,
          price: it.price,
        }));

        const buyerOrder = {
          id: order.id,
          orderNumber,
          total: order.total,
          userName: order.customerName || order.user?.name,
          items: buildOrder(order.orderItems.flatMap((oi) => oi.items || [])),
        };

        // Email al comprador
        if (buyerEmail) {
          sendPaymentConfirmedToBuyer({ to: buyerEmail, order: buyerOrder }).catch((e) =>
            console.error("Error email confirm-payment -> buyer:", e?.message || e)
          );
        }

        // Emails a vendedores cuyos items se pagaron
        for (const oi of order.orderItems) {
          if (!orderItemIdsToPay.includes(oi.id)) continue;
          const sellerEmail = oi.store?.user?.email;
          if (!sellerEmail) continue;

          const sellerOrder = {
            id: order.id,
            orderNumber,
            total: order.total,
            sellerName: oi.store?.name || oi.store?.user?.name || "Vendedor",
            items: buildOrder(oi.items || []),
          };

          sendPaymentConfirmedToSeller({ to: sellerEmail, order: sellerOrder }).catch((e) =>
            console.error(`Error email confirm-payment -> seller (${sellerEmail}):`, e?.message || e)
          );
        }

      }

      return NextResponse.json({ success: true, result });
    }

    // --- markStorePaid ---
    if (action === "markStorePaid") {
      const { storeId } = body;
      if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

      const ownsStore = sellerStoreIds.includes(String(storeId));
      if (!ownsStore && !isAdmin) {
        return NextResponse.json({ error: "No autorizado para confirmar pago de esta tienda" }, { status: 403 });
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.orderItem.updateMany({ where: { orderId, storeId }, data: { paymentStatus: "paid" } });

        await tx.orderHistory.create({
          data: { orderId, action: "mark_store_paid", byUserId: sessionUserId, note: `Pago verificado para tienda: ${storeId}` },
        });

        const refreshed = await tx.order.findUnique({
          where: { id: orderId },
          include: { orderItems: { include: { items: true } } },
        });
        const allPaid = (refreshed.orderItems || []).every((oi) => oi.paymentStatus === "paid");

        if (allPaid && refreshed.paymentStatus !== "paid") {
          if (!refreshed.stockDeducted) {
            for (const oi of refreshed.orderItems || []) {
              for (const p of oi.items || []) {
                const qty = Number(p.quantity || 0);
                if (!p.productId || qty <= 0) continue;
                try { await tx.product.update({ where: { id: p.productId }, data: { stock: { decrement: qty } } }); }
                catch (e) { console.warn("Stock decrement failed:", p.productId, e?.message || e); }
              }
            }
          }

          const updated = await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: "paid", status: "processing", paidAt: new Date(), paymentVerifiedBy: sessionUserId, paymentVerifiedAt: new Date(), stockDeducted: true },
          });

          await tx.orderHistory.create({
            data: { orderId, action: "mark_paid_after_all_stores", byUserId: sessionUserId, note: "Orden marcada como pagada porque todas las tiendas confirmaron pago" },
          });

          return { success: true, allPaid: true, order: updated };
        }

        return { success: true, allPaid: false };
      });

      // Enviar emails si se pagó completamente
      if (result.allPaid) {
        const buyerEmail = order.customerEmail || order.user?.email;
        const orderNumber = order.orderNumber || order.id;
        const allItems = order.orderItems.flatMap((oi) => (oi.items || []).map((it) => ({
          productName: it.product?.name || "Producto",
          quantity: it.quantity,
          price: it.price,
        })));

        const buyerOrder = { id: order.id, orderNumber, total: order.total, userName: order.customerName || order.user?.name, items: allItems };

        if (buyerEmail) {
          sendPaymentConfirmedToBuyer({ to: buyerEmail, order: buyerOrder }).catch((e) =>
            console.error("Error email markStorePaid -> buyer:", e?.message || e)
          );
        }

        for (const oi of order.orderItems) {
          const sellerEmail = oi.store?.user?.email;
          if (!sellerEmail) continue;
          const sellerOrder = {
            id: order.id, orderNumber, total: order.total,
            sellerName: oi.store?.name || oi.store?.user?.name || "Vendedor",
            items: (oi.items || []).map((it) => ({ productName: it.product?.name || "Producto", quantity: it.quantity, price: it.price })),
          };
          sendPaymentConfirmedToSeller({ to: sellerEmail, order: sellerOrder }).catch((e) =>
            console.error(`Error email markStorePaid -> seller (${sellerEmail}):`, e?.message || e)
          );
        }
      }

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (err) {
    console.error("ERROR confirm-payment route:", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error confirmando pago" }, { status: 500 });
  }
}
