// app/api/orders/bulk-delete/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// helper: validar ObjectId (Mongo)
const isValidObjectId = (id) => {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
};

const chunk = (arr, size = 50) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/**
 * DELETE /api/orders/bulk-delete
 * Body: { ids: string[], reason?: string, mode?: "soft" | "hard", confirm?: boolean }
 *
 * Behavior:
 * - mode default: "soft"
 * - soft: marca deleted=true, guarda deletedReason, deletedBy, deletedAt y crea OrderHistory
 * - hard: SOLO admin -> en transacción restaura stock, borra orderHistory, orderItemProducts, orderItems y orders
 *
 * Permisos:
 * - admin: puede soft o hard sobre cualquier orden
 * - no-admin: solo soft sobre sus propias órdenes
 *
 * Safety:
 * - hard delete requiere confirm=true en el body para evitar borrados accidentales
 * - operaciones en lotes se procesan en chunks para evitar límites de transacción
 */
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const mode = body.mode === "hard" ? "hard" : "soft";
    const confirm = body.confirm === true;

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "IDs requeridos" }, { status: 400 });
    }

    // filtrar ids válidos
    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    const isAdmin = session.user?.role === "admin";
    const userId = String(session.user?.id);

    // Si no es admin, forzamos soft-delete y solo sobre órdenes del usuario
    if (!isAdmin && mode === "hard") {
      return NextResponse.json({ error: "Solo admin puede borrar físicamente" }, { status: 403 });
    }

    // Obtener órdenes objetivo (si no admin, filtrar por userId)
    const orders = await prisma.order.findMany({
      where: isAdmin
        ? { id: { in: validIds } }
        : { id: { in: validIds }, userId },
      include: {
        orderItems: {
          include: {
            items: true, // OrderItemProduct
          },
        },
      },
    });

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: "No se encontraron órdenes para los IDs proporcionados" }, { status: 404 });
    }

    // SOFT DELETE (recomendado)
    if (mode === "soft") {
      const now = new Date();

      // Restaurar stock para órdenes que lo descontaron
      for (const order of orders) {
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
                console.warn("No se pudo restaurar stock (bulk soft delete):", productId, e?.message || e);
              }
            }
          }
        }
      }

      const orderChunks = chunk(orders.map((o) => o.id), 100);
      const updatedIds = [];

      // Actualizar en chunks para evitar transacciones enormes
      for (const c of orderChunks) {
        const updates = c.map((id) =>
          prisma.order.update({
            where: { id },
            data: {
              deleted: true,
              deletedAt: now,
              deletedBy: userId,
              deletedReason: reason || null,
            },
          })
        );
        const updated = await prisma.$transaction(updates);
        updated.forEach((u) => updatedIds.push(u.id));
      }

      // Registrar en orderHistory (createMany por chunks)
      const histories = orders.map((o) => ({
        orderId: o.id,
        action: "soft_delete",
        byUserId: userId,
        note: reason || "Eliminación por usuario/admin",
      }));

      try {
        const historyChunks = chunk(histories, 200);
        for (const hc of historyChunks) {
          await prisma.orderHistory.createMany({ data: hc });
        }
      } catch (e) {
        console.warn("orderHistory.createMany falló:", e?.message || e);
      }

      return NextResponse.json({ success: true, mode: "soft", count: updatedIds.length, ids: updatedIds });
    }

    // HARD DELETE (solo admin) - transacción segura
    if (mode === "hard" && isAdmin) {
      if (!confirm) {
        return NextResponse.json({ error: "Confirmación requerida para hard delete (confirm: true)" }, { status: 400 });
      }

      // Recolectar orderItemIds y product adjustments antes de la transacción
      const orderItemIds = orders.flatMap((o) => (o.orderItems || []).map((oi) => oi.id));
      const productAdjustments = [];
      for (const o of orders) {
        for (const oi of o.orderItems || []) {
          for (const p of oi.items || []) {
            const productId = p.productId;
            const qty = Number(p.quantity || 0);
            if (!productId || !Number.isFinite(qty) || qty <= 0) {
              console.warn("Omitiendo restore stock por datos incompletos:", { productId, qty, orderId: o.id });
              continue;
            }
            productAdjustments.push({ productId, qty });
          }
        }
      }

      // Ejecutar transacción: restaurar stock, borrar relaciones y órdenes
      const result = await prisma.$transaction(async (tx) => {
        // 1) Restaurar stock (increment) por producto (agrupar por productId)
        const grouped = productAdjustments.reduce((acc, cur) => {
          acc[cur.productId] = (acc[cur.productId] || 0) + cur.qty;
          return acc;
        }, {});
        const productIds = Object.keys(grouped);
        for (const pid of productIds) {
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
        await tx.orderHistory.deleteMany({ where: { orderId: { in: orders.map((o) => o.id) } } });

        // 3) eliminar orderItemProducts (OrderItemProduct) usando orderItemIds
        if (orderItemIds.length > 0) {
          await tx.orderItemProduct.deleteMany({ where: { orderItemId: { in: orderItemIds } } });
        }

        // 4) eliminar orderItems
        if (orderItemIds.length > 0) {
          await tx.orderItem.deleteMany({ where: { id: { in: orderItemIds } } });
        }

        // 5) eliminar órdenes
        const del = await tx.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } });

        return del;
      });

      return NextResponse.json({ success: true, mode: "hard", deletedCount: result.count || result });
    }

    return NextResponse.json({ error: "Modo no soportado o permisos insuficientes" }, { status: 400 });
  } catch (err) {
    console.error("🔥 ERROR BULK DELETE ORDERS:", err);
    return NextResponse.json({ error: "Error eliminando órdenes" }, { status: 500 });
  }
}
