// app/api/orders/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Helper: validar ObjectId (Mongo)
const isValidObjectId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

// GET
export async function GET(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            store: true,
            items: { include: { product: true } },
          },
        },
        user: true,
        paymentMethod: true, // incluir relación con método de pago
      },
    });

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    // autorización: comprador, vendedor de alguna tienda o admin
    const isOwner = String(order.userId) === String(session.user.id);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { stores: true },
    });
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = order.orderItems.some((oi) =>
      sellerStoreIds.includes(String(oi.storeId))
    );
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isSellerOfOrder && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Normalizar respuesta incluyendo método de pago
    const normalized = {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      total: order.total,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod
        ? {
          id: order.paymentMethod.id,
          type: order.paymentMethod.type,
          phone: order.paymentMethod.phone,
          account: order.paymentMethod.account,
          qrImageUrl: order.paymentMethod.qrImageUrl,
          details: order.paymentMethod.details,
        }
        : null,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      orderItems: order.orderItems.map((oi) => ({
        id: oi.id,
        storeId: oi.storeId,
        store: oi.store ? { id: oi.store.id, name: oi.store.name } : null,
        paymentStatus: oi.paymentStatus,
        items: oi.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          product: it.product ? { id: it.product.id, title: it.product.title } : null,
          quantity: it.quantity,
          price: it.price,
        })),
      })),
    };

    return NextResponse.json(normalized);
  } catch (err) {
    console.error("🔥 ERROR GET ORDER:", err);
    return NextResponse.json({ error: "Error obteniendo orden" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const mode = body.mode === "hard" ? "hard" : "soft";
    const confirm = body.confirm === true;

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

    // permisos: soft-delete permitido para owner, sellerOfOrder o admin
    if (!isOwner && !isSellerOfOrder && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Si piden hard delete, solo admin y requiere confirm:true
    if (mode === "hard" && !isAdmin) {
      return NextResponse.json({ error: "Solo admin puede borrar físicamente" }, { status: 403 });
    }
    if (mode === "hard" && isAdmin && !confirm) {
      return NextResponse.json({ error: "Confirmación requerida para hard delete (confirm: true)" }, { status: 400 });
    }

    // SOFT DELETE (recomendado): marcar la orden como eliminada y registrar razón
    if (mode === "soft") {
      const now = new Date();
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          deleted: true,
          deletedAt: now,
          deletedBy: session.user.id,
          deletedReason: reason || null,
        },
      });

      // Registrar auditoría
      try {
        await prisma.orderHistory.create({
          data: {
            orderId,
            action: "soft_delete",
            byUserId: session.user.id,
            note: reason || "Eliminación (soft) por usuario/admin",
          },
        });
      } catch (e) {
        console.warn("No se pudo crear orderHistory (soft_delete):", e?.message || e);
      }

      return NextResponse.json({ success: true, mode: "soft", order: updated });
    }

    // HARD DELETE (solo admin) - transacción segura: restaurar stock, borrar relaciones y la orden
    if (mode === "hard" && isAdmin) {
      const orderItemIds = order.orderItems.flatMap((oi) => (oi?.id ? [oi.id] : []));
      // Recolectar ajustes de stock por producto
      const productAdjustments = [];
      for (const oi of order.orderItems || []) {
        for (const p of oi.items || []) {
          const productId = p.productId;
          const qty = Number(p.quantity || 0);
          if (!productId || !Number.isFinite(qty) || qty <= 0) {
            console.warn("Omitiendo restore stock por datos incompletos:", { productId, qty, orderItemId: oi.id });
            continue;
          }
          productAdjustments.push({ productId, qty });
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1) Restaurar stock (agrupar por productId)
        const grouped = productAdjustments.reduce((acc, cur) => {
          acc[cur.productId] = (acc[cur.productId] || 0) + cur.qty;
          return acc;
        }, {});
        for (const pid of Object.keys(grouped)) {
          const qty = grouped[pid];
          try {
            await tx.product.update({
              where: { id: pid },
              data: { stock: { increment: qty } },
            });
          } catch (e) {
            console.warn("No se pudo incrementar stock para productId:", pid, e?.message || e);
          }
        }

        // 2) eliminar orderHistory relacionados
        await tx.orderHistory.deleteMany({ where: { orderId } });

        // 3) eliminar orderItemProducts (OrderItemProduct) usando orderItemIds
        if (orderItemIds.length > 0) {
          await tx.orderItemProduct.deleteMany({ where: { orderItemId: { in: orderItemIds } } });
        }

        // 4) eliminar orderItems
        if (orderItemIds.length > 0) {
          await tx.orderItem.deleteMany({ where: { id: { in: orderItemIds } } });
        }

        // 5) eliminar la orden
        const del = await tx.order.delete({ where: { id: orderId } });

        return del;
      });

      return NextResponse.json({ success: true, mode: "hard", deleted: true });
    }

    return NextResponse.json({ error: "Modo no soportado" }, { status: 400 });
  } catch (err) {
    console.error("🔥 ERROR DELETE ORDER:", err);
    return NextResponse.json({ error: "Error eliminando orden" }, { status: 500 });
  }
}

// PATCH
export async function PATCH(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || body?.type;
    if (!action) return NextResponse.json({ error: "Acción no especificada" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { stores: true } });
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { orderItems: { include: { items: true } } } });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const isOwner = String(order.userId) === String(session.user.id);
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = order.orderItems.some((oi) => sellerStoreIds.includes(String(oi.storeId)));
    const isAdmin = user?.role === "admin";

    // Acción: marcar orden completa como pagada
    if (action === "markPaid" || action === "confirmPayment") {
      // Permitir a admin o al vendedor responsable de la(s) tienda(s) involucradas marcar como pagada
      if (!isSellerOfOrder && !isAdmin) return NextResponse.json({ error: "No autorizado para marcar pago" }, { status: 403 });

      // Ejecutar en transacción: decrementar stock (si no se ha hecho), actualizar order y orderItems, registrar history
      const result = await prisma.$transaction(async (tx) => {
        const freshOrder = await tx.order.findUnique({
          where: { id: orderId },
          include: { orderItems: { include: { items: true } } },
        });
        if (!freshOrder) throw new Error("Orden no encontrada en transacción");

        if (freshOrder.paymentStatus === "paid") {
          return { alreadyPaid: true, order: freshOrder };
        }

        // Descontar stock si no se ha hecho antes
        if (!freshOrder.stockDeducted) {
          for (const oi of freshOrder.orderItems || []) {
            for (const p of oi.items || []) {
              const productId = p.productId;
              const qty = Number(p.quantity || 0);
              if (!productId || !Number.isFinite(qty) || qty <= 0) {
                console.warn("Omitiendo decrement stock por datos incompletos:", { productId, qty, orderItemId: oi.id });
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
            paymentVerifiedBy: session.user.id,
            paymentVerifiedAt: new Date(),
            stockDeducted: true,
          },
        });

        try {
          await tx.orderItem.updateMany({
            where: { orderId },
            data: { paymentStatus: "paid" },
          });
        } catch (e) {
          console.warn("No se pudo actualizar orderItems.paymentStatus:", e?.message || e);
        }

        try {
          await tx.orderHistory.create({
            data: {
              orderId,
              action: "mark_paid",
              byUserId: session.user.id,
              note: "Pago verificado por vendedor/admin",
            },
          });
        } catch (e) {
          console.warn("No se pudo crear orderHistory mark_paid:", e?.message || e);
        }

        return { alreadyPaid: false, order: updated };
      });

      return NextResponse.json({ success: true, result });
    }

    // Acción: marcar pago solo para la tienda del vendedor
    if (action === "markStorePaid") {
      if (!isSellerOfOrder && !isAdmin) return NextResponse.json({ error: "No autorizado para marcar pago de tienda" }, { status: 403 });
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
            byUserId: session.user.id,
            note: `Pago marcado como pagado para storeId ${storeId}`,
          },
        });

        // Revisar si ahora todos los orderItems están pagados
        const refreshed = await tx.order.findUnique({ where: { id: orderId }, include: { orderItems: { include: { items: true } } } });
        const allPaid = (refreshed.orderItems || []).every((oi) => oi.paymentStatus === "paid");

        if (allPaid && refreshed.paymentStatus !== "paid") {
          // Descontar stock si no se ha hecho antes
          if (!refreshed.stockDeducted) {
            for (const oi of refreshed.orderItems || []) {
              for (const p of oi.items || []) {
                const productId = p.productId;
                const qty = Number(p.quantity || 0);
                if (!productId || !Number.isFinite(qty) || qty <= 0) {
                  console.warn("Omitiendo decrement stock por datos incompletos:", { productId, qty, orderItemId: oi.id });
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
              paymentVerifiedBy: session.user.id,
              paymentVerifiedAt: new Date(),
              stockDeducted: true,
            },
          });

          await tx.orderHistory.create({
            data: {
              orderId,
              action: "mark_paid_after_all_stores",
              byUserId: session.user.id,
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
    console.error("🔥 ERROR PATCH ORDER:", err);
    return NextResponse.json({ error: "Error actualizando orden" }, { status: 500 });
  }
}

// POST (upload-proof)
export async function POST(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    let formData;
    try { formData = await req.formData(); } catch (e) { formData = null; }

    if (!formData) {
      const body = await req.json().catch(() => ({}));
      const proofUrl = body?.proofUrl;
      if (!proofUrl) return NextResponse.json({ error: "No se recibió comprobante" }, { status: 400 });
      const updated = await prisma.order.update({ where: { id: orderId }, data: { paymentProof: proofUrl, paymentStatus: "pending_verification" } });
      return NextResponse.json({ success: true, order: updated });
    }

    const file = formData.get("file");
    if (!file) return NextResponse.json({ error: "No se encontró el archivo en formData" }, { status: 400 });

    const filename = file.name || `proof-${Date.now()}`;
    const mime = file.type || "application/octet-stream";

    // Nota: aquí solo guardamos el nombre/mime en DB. Si usas Cloudinary u otro storage,
    // sube el archivo y guarda la URL en paymentProof.
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { paymentProof: filename, paymentProofMime: mime, paymentStatus: "pending_verification" },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("🔥 ERROR UPLOAD PROOF:", err);
    return NextResponse.json({ error: "Error subiendo comprobante" }, { status: 500 });
  }
}
