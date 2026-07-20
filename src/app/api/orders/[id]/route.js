// src/app/api/orders/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";
import { sendPaymentConfirmedToBuyer, sendPaymentConfirmedToSeller } from "@/lib/email";

const isValidObjectId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

// GET
export async function GET(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            store: { include: { user: { select: { id: true, phone: true, name: true, email: true } } } },
            items: { include: { product: true } },
          },
        },
        user: true,
        paymentMethod: true,
      },
    });

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const isOwner = String(order.userId) === String(authUser.id);

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stores: true },
    });
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = order.orderItems.some((oi) => sellerStoreIds.includes(String(oi.storeId)));
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isSellerOfOrder && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const normalized = {
      order: {
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
        paymentProof: order.paymentProof || null,
        paymentProofMime: order.paymentProofMime || null,
        status: order.status,
        deletedAt: order.deletedAt || null,
        deletedReason: order.deletedReason || null,
        refundStatus: order.refundStatus || "none",
        shippingCost: order.shippingCost || 0,
        shippingAddress: order.shippingAddress || null,
        shippingCity: order.shippingCity || null,
        shippingDepartment: order.shippingDepartment || null,
        shippingPostalCode: order.shippingPostalCode || null,
        trackingNumber: order.trackingNumber || null,
        shippingStatus: order.shippingStatus || "none",
        shippingCarrier: order.shippingCarrier || null,
        shippedAt: order.shippedAt || null,
        deliveredAt: order.deliveredAt || null,
      },
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

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const mode = body.mode === "hard" ? "hard" : "soft";
    const confirm = body.confirm === true;

    const user = await prisma.user.findUnique({ where: { email: authUser.email }, include: { stores: true } });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { items: true } } },
    });

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const isOwner = String(order.userId) === String(authUser.id);
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = order.orderItems.some((oi) => sellerStoreIds.includes(String(oi.storeId)));
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isSellerOfOrder && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Bloquear soft delete si tiene comprobante de pago o está pagado
    const hasPaymentProof = !!order.paymentProof;
    const hasPayment = order.paymentStatus === "paid" || order.paymentStatus === "pending_verification";
    if (mode === "soft" && (hasPaymentProof || hasPayment)) {
      return NextResponse.json({
        error: "Esta orden tiene un pago registrado. Usa POST /api/orders/[id]/cancel para cancelarla con motivo.",
      }, { status: 400 });
    }

    if (mode === "soft") {
      const now = new Date();

      // Restaurar stock si fue descontado
      if (order.stockDeducted) {
        for (const oi of order.orderItems || []) {
          for (const p of oi.items || []) {
            const productId = p.productId;
            const qty = Number(p.quantity || 0);
            if (!productId || qty <= 0) continue;
            try {
              await prisma.product.update({
                where: { id: productId },
                data: { stock: { increment: qty } },
              });
            } catch (e) {
              console.warn("No se pudo restaurar stock (soft delete):", productId, e?.message || e);
            }
          }
        }
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          deleted: true,
          deletedAt: now,
          deletedBy: authUser.id,
          deletedReason: reason || null,
        },
      });

      try {
        await prisma.orderHistory.create({
          data: {
            orderId,
            action: "soft_delete",
            byUserId: authUser.id,
            note: reason || "Eliminación (soft) por usuario/admin",
          },
        });
      } catch (e) {
        console.warn("No se pudo crear orderHistory (soft_delete):", e?.message || e);
      }

      return NextResponse.json({ success: true, mode: "soft", order: updated });
    }

    // HARD DELETE
    if (mode === "hard") {
      if (!isAdmin) {
        return NextResponse.json({ error: "Solo admin puede borrar físicamente" }, { status: 403 });
      }
      if (!confirm) {
        return NextResponse.json({ error: "Confirmación requerida para hard delete (confirm: true)" }, { status: 400 });
      }

      const orderItemIds = order.orderItems.flatMap((oi) => (oi?.id ? [oi.id] : []));
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

        await tx.orderHistory.deleteMany({ where: { orderId } });

        if (orderItemIds.length > 0) {
          await tx.orderItemProduct.deleteMany({ where: { orderItemId: { in: orderItemIds } } });
          await tx.orderItem.deleteMany({ where: { id: { in: orderItemIds } } });
        }

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

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || body?.type;
    if (!action) return NextResponse.json({ error: "Acción no especificada" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: authUser.email }, include: { stores: true } });
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { orderItems: { include: { items: true } } } });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    if (order.status === "cancelled") {
      return NextResponse.json({ error: "No se puede modificar una orden cancelada" }, { status: 400 });
    }

    const isOwner = String(order.userId) === String(authUser.id);
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = order.orderItems.some((oi) => sellerStoreIds.includes(String(oi.storeId)));
    const isAdmin = user?.role === "admin";

    // Acción: marcar pago de orden (para Sellers solo sus tiendas; para Admins completo)
    if (action === "markPaid" || action === "confirmPayment") {
      if (!isSellerOfOrder && !isAdmin) return NextResponse.json({ error: "No autorizado para marcar pago" }, { status: 403 });

      const result = await prisma.$transaction(async (tx) => {
        const freshOrder = await tx.order.findUnique({
          where: { id: orderId },
          include: { orderItems: { include: { items: true } } },
        });
        if (!freshOrder) throw new Error("Orden no encontrada en transacción");

        if (freshOrder.paymentStatus === "paid") {
          return { alreadyPaid: true, order: freshOrder };
        }

        // Filtrar qué orderItems se marcarán como pagados en este paso
        const orderItemsToPay = freshOrder.orderItems.filter((oi) => {
          if (isAdmin) return true;
          return sellerStoreIds.includes(String(oi.storeId));
        });

        if (orderItemsToPay.length === 0) {
          throw new Error("No tienes ítems en esta orden asignados a tus tiendas");
        }

        // Marcar los items seleccionados como pagados
        const orderItemIdsToPay = orderItemsToPay.map((oi) => oi.id);
        await tx.orderItem.updateMany({
          where: { id: { in: orderItemIdsToPay } },
          data: { paymentStatus: "paid" },
        });

        // Descontar stock si la orden no tenía stockDeducted
        if (!freshOrder.stockDeducted) {
          for (const oi of orderItemsToPay) {
            for (const p of oi.items || []) {
              const productId = p.productId;
              const qty = Number(p.quantity || 0);
              if (!productId || qty <= 0) continue;
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

        // Verificar si ahora todos los orderItems de la orden están pagados
        const refreshedOrderItems = await tx.orderItem.findMany({
          where: { orderId },
        });
        const allPaid = refreshedOrderItems.every((oi) => oi.paymentStatus === "paid");

        let updatedOrder = freshOrder;
        if (allPaid) {
          updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: "paid",
              status: "processing",
              paidAt: new Date(),
              paymentVerifiedBy: authUser.id,
              paymentVerifiedAt: new Date(),
              stockDeducted: true,
            },
          });
        }

        // Registrar historial de auditoría
        try {
          const storeNames = orderItemsToPay.map((oi) => oi.storeId).join(", ");
          await tx.orderHistory.create({
            data: {
              orderId,
              action: isAdmin ? "mark_paid" : "mark_store_paid_auto",
              byUserId: authUser.id,
              note: isAdmin
                ? "Orden completa marcada como pagada por administrador"
                : `Vendedor confirmó pago de ítems para tienda(s): ${storeNames}. ` +
                  (allPaid ? "Todos los pagos completados, orden marcada como pagada." : "Pendiente confirmación de otras tiendas."),
            },
          });
        } catch (e) {
          console.warn("No se pudo registrar orderHistory:", e?.message || e);
        }

        return { alreadyPaid: false, order: updatedOrder, allPaid };
      });

      // Send emails when all stores are paid
      if (result?.allPaid && result?.order) {
        try {
          const fullOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { orderItems: { include: { items: { include: { product: true } }, store: { include: { user: { select: { email: true, name: true } } } } } } },
          });
          if (fullOrder) {
            const buyerEmail = fullOrder.customerEmail;
            const orderData = {
              id: fullOrder.id,
              orderNumber: fullOrder.orderNumber,
              total: fullOrder.total,
              items: fullOrder.orderItems.flatMap((oi) => (oi.items || []).map((it) => ({ productName: it.product?.title || "Producto", quantity: it.quantity, price: it.price }))),
            };
            if (buyerEmail) {
              sendPaymentConfirmedToBuyer({ to: buyerEmail, order: orderData }).catch((e) => console.error("Error email buyer:", e));
            }
            for (const oi of fullOrder.orderItems) {
              const sellerEmail = oi.store?.user?.email;
              if (sellerEmail) {
                sendPaymentConfirmedToSeller({ to: sellerEmail, order: { ...orderData, sellerName: oi.store?.name || "Tu tienda" } }).catch((e) => console.error("Error email seller:", e));
              }
            }
          }
        } catch (e) { console.warn("Error sending payment emails:", e?.message); }
      }

      return NextResponse.json({ success: true, result });
    }

    // Acción: marcar pago solo para la tienda del vendedor
    if (action === "markStorePaid") {
      const { storeId } = body;
      if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

      // Ciberseguridad: Validar que el Seller realmente sea dueño de la tienda que intenta confirmar
      const ownsStore = sellerStoreIds.includes(String(storeId));
      if (!ownsStore && !isAdmin) {
        return NextResponse.json({ error: "No autorizado para confirmar pago de esta tienda" }, { status: 403 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Actualizar orderItems de esa tienda
        await tx.orderItem.updateMany({
          where: { orderId, storeId },
          data: { paymentStatus: "paid" },
        });

        await tx.orderHistory.create({
          data: {
            orderId,
            action: "mark_store_paid",
            byUserId: authUser.id,
            note: `Pago verificado para tienda: ${storeId}`,
          },
        });

        // Revisar si ahora todos los orderItems están pagados
        const refreshed = await tx.order.findUnique({ where: { id: orderId }, include: { orderItems: { include: { items: true } } } });
        const allPaid = (refreshed.orderItems || []).every((oi) => oi.paymentStatus === "paid");

        if (allPaid && refreshed.paymentStatus !== "paid") {
          if (!refreshed.stockDeducted) {
            for (const oi of refreshed.orderItems || []) {
              for (const p of oi.items || []) {
                const productId = p.productId;
                const qty = Number(p.quantity || 0);
                if (!productId || qty <= 0) continue;
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
              paymentVerifiedBy: authUser.id,
              paymentVerifiedAt: new Date(),
              stockDeducted: true,
            },
          });

          await tx.orderHistory.create({
            data: {
              orderId,
              action: "mark_paid_after_all_stores",
              byUserId: authUser.id,
              note: "Orden marcada como pagada porque todas las tiendas confirmaron pago",
            },
          });

          return { success: true, allPaid: true, order: updated };
        }

        return { success: true, allPaid: false };
      });

      // Send emails when all stores are paid
      if (result?.allPaid && result?.order) {
        try {
          const fullOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { orderItems: { include: { items: { include: { product: true } }, store: { include: { user: { select: { email: true, name: true } } } } } } },
          });
          if (fullOrder) {
            const buyerEmail = fullOrder.customerEmail;
            const orderData = {
              id: fullOrder.id,
              orderNumber: fullOrder.orderNumber,
              total: fullOrder.total,
              items: fullOrder.orderItems.flatMap((oi) => (oi.items || []).map((it) => ({ productName: it.product?.title || "Producto", quantity: it.quantity, price: it.price }))),
            };
            if (buyerEmail) {
              sendPaymentConfirmedToBuyer({ to: buyerEmail, order: orderData }).catch((e) => console.error("Error email buyer:", e));
            }
            for (const oi of fullOrder.orderItems) {
              const sellerEmail = oi.store?.user?.email;
              if (sellerEmail) {
                sendPaymentConfirmedToSeller({ to: sellerEmail, order: { ...orderData, sellerName: oi.store?.name || "Tu tienda" } }).catch((e) => console.error("Error email seller:", e));
              }
            }
          }
        } catch (e) { console.warn("Error sending payment emails:", e?.message); }
      }

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (err) {
    console.error("🔥 ERROR PATCH ORDER:", err);
    return NextResponse.json({ error: "Error actualizando orden" }, { status: 500 });
  }
}

// PUT - Actualizar datos de envío (tracking, estado)
export async function PUT(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { trackingNumber, shippingStatus, shippingCarrier } = body;

    const user = await prisma.user.findUnique({ where: { email: authUser.email }, include: { stores: true } });
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { orderItems: true } });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = order.orderItems.some((oi) => sellerStoreIds.includes(String(oi.storeId)));
    const isAdmin = user?.role === "admin";

    if (!isSellerOfOrder && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const updateData = {};
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (shippingStatus !== undefined) updateData.shippingStatus = shippingStatus;
    if (shippingCarrier !== undefined) updateData.shippingCarrier = shippingCarrier;
    if (shippingStatus === "shipped") updateData.shippedAt = new Date();
    if (shippingStatus === "delivered") updateData.deliveredAt = new Date();

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Registrar historial
    try {
      await prisma.orderHistory.create({
        data: {
          orderId,
          action: "shipping_update",
          byUserId: authUser.id,
          note: `Envío actualizado: ${shippingStatus || "—"}`, tracking: trackingNumber || null,
        },
      });
    } catch (e) {
      console.warn("No se pudo registrar historial:", e?.message || e);
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("ERROR PUT shipping:", err);
    return NextResponse.json({ error: "Error actualizando envío" }, { status: 500 });
  }
}

// DELETE - fallback si alguien llama a esta ruta directamente
export async function POST(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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

    // Subir a Cloudinary (igual que upload-proof/route.js)
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const maxBytes = 8 * 1024 * 1024;
    if (buffer.length > maxBytes) {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 8MB)" }, { status: 400 });
    }

    function detectMime(buf) {
      if (buf.length < 4) return null;
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "image/png";
      if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";
      if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
          buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
      return null;
    }

    const realMime = detectMime(buffer);
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!realMime || !allowed.includes(realMime)) {
      return NextResponse.json({ error: "Tipo no permitido. Solo JPG, PNG o WEBP." }, { status: 400 });
    }

    const base64 = buffer.toString("base64");
    const dataUri = `data:${realMime};base64,${base64}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: `comprobantes/${orderId}`,
      resource_type: "image",
      overwrite: true,
      use_filename: true,
      unique_filename: false,
    });

    if (!uploadResult || !uploadResult.secure_url) {
      return NextResponse.json({ error: "Error subiendo a Cloudinary" }, { status: 500 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProof: uploadResult.secure_url,
        paymentProofMime: uploadResult.format ? `image/${uploadResult.format}` : realMime,
        paymentStatus: "pending_verification",
      },
    });

    return NextResponse.json({ success: true, order: updated, url: uploadResult.secure_url });
  } catch (err) {
    console.error("ERROR UPLOAD PROOF:", err);
    return NextResponse.json({ error: "Error subiendo comprobante" }, { status: 500 });
  }
}
