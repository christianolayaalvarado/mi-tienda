import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// validar ObjectId simple (ajustar si usas UUID u otro formato)
const isValidObjectId = (id) => typeof id === "string" && id.length > 0;

// ==============================
// GET /api/orders/:id
// DELETE /api/orders/:id
// PATCH /api/orders/:id    -> acciones (markPaid, markStorePaid)
// POST /api/orders/:id/upload-proof  -> subir comprobante (formData)
// ==============================
export async function GET(req, { params }) {
  try {
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
            items: {
              include: { product: true },
            },
          },
        },
        user: true,
      },
    });

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    // Permitir que el comprador vea su orden o que un vendedor/admin la vea
    const isOwner = String(order.userId) === String(session.user.id);
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { stores: true } });
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = order.orderItems.some((oi) => sellerStoreIds.includes(String(oi.storeId)));
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isSellerOfOrder && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("🔥 ERROR GET ORDER:", err);
    return NextResponse.json({ error: "Error obteniendo orden" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const orderId = params?.id;
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { stores: true } });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const isOwner = String(order.userId) === String(session.user.id);
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const isSellerOfOrder = order.orderItems.some((oi) => sellerStoreIds.includes(String(oi.storeId)));
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isSellerOfOrder && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Restaurar stock por cada item
    for (const orderItem of order.orderItems) {
      for (const item of orderItem.items) {
        try {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        } catch (uErr) {
          console.error("Error restaurando stock para producto:", item.productId, uErr);
        }
      }
    }

    // Borrar hijos y la orden (ajusta nombres si tu esquema difiere)
    // Primero eliminar productos de orderItems si existe tabla intermedia
    try {
      await prisma.orderItemProduct.deleteMany({
        where: { orderItemId: { in: order.orderItems.map((oi) => oi.id) } },
      });
    } catch (e) {
      // Si no existe la tabla orderItemProduct, ignorar
      console.debug("orderItemProduct deleteMany skipped or failed:", e?.message || e);
    }

    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 ERROR DELETE ORDER:", err);
    return NextResponse.json({ error: "Error eliminando orden" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const orderId = params?.id;
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const action = body?.action || body?.type;

    if (!action) {
      return NextResponse.json({ error: "Acción no especificada" }, { status: 400 });
    }

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

    // Acción: marcar orden completa como pagada (solo admin o comprador)
    if (action === "markPaid" || action === "confirmPayment") {
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "No autorizado para marcar pago" }, { status: 403 });
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "paid", status: "processing", paidAt: new Date() },
      });

      return NextResponse.json({ success: true, order: updated });
    }

    // Acción: marcar solo el orderItem de la tienda del vendedor como pagado
    if (action === "markStorePaid") {
      if (!isSellerOfOrder && !isAdmin) {
        return NextResponse.json({ error: "No autorizado para marcar pago de tienda" }, { status: 403 });
      }

      const { storeId } = body;
      if (!storeId) return NextResponse.json({ error: "storeId requerido" }, { status: 400 });

      // Actualizar paymentStatus del orderItem correspondiente
      const updatedOrderItem = await prisma.orderItem.updateMany({
        where: { orderId, storeId },
        data: { paymentStatus: "paid" },
      });

      return NextResponse.json({ success: true, updated: updatedOrderItem });
    }

    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (err) {
    console.error("🔥 ERROR PATCH ORDER:", err);
    return NextResponse.json({ error: "Error actualizando orden" }, { status: 500 });
  }
}

// Manejar subida de comprobante: POST /api/orders/:id/upload-proof
export async function POST(req, { params }) {
  try {
    // Detectar si la ruta es /upload-proof (en Next.js la ruta debe ser app/api/orders/[id]/upload-proof/route.js
    // pero soportamos aquí si el frontend llama a /api/orders/:id con formData y un campo _action=upload-proof
    const orderId = params?.id;
    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Intentar leer formData (si el cliente envía FormData)
    let formData;
    try {
      formData = await req.formData();
    } catch (e) {
      formData = null;
    }

    // Si no hay formData, intentar JSON con proofUrl
    if (!formData) {
      const body = await req.json().catch(() => ({}));
      const proofUrl = body?.proofUrl;
      if (!proofUrl) {
        return NextResponse.json({ error: "No se recibió comprobante" }, { status: 400 });
      }

      // Guardar proofUrl en la orden y marcar como pending_verification
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { paymentProof: proofUrl, paymentStatus: "pending_verification" },
      });

      return NextResponse.json({ success: true, order: updated });
    }

    // Si hay formData, extraer el archivo (no hacemos upload real aquí; guardamos metadata)
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "No se encontró el archivo en formData" }, { status: 400 });
    }

    // Nota: aquí deberías subir el archivo a un storage (S3, Cloudinary, Supabase, etc.)
    // Como placeholder guardamos el nombre y tipo en la orden para que el frontend muestre algo.
    const filename = file.name || `proof-${Date.now()}`;
    const mime = file.type || "application/octet-stream";

    // Guardar metadata en la orden (campo paymentProof puede ser URL o nombre de archivo)
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProof: filename,
        paymentProofMime: mime,
        paymentStatus: "pending_verification",
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("🔥 ERROR UPLOAD PROOF:", err);
    return NextResponse.json({ error: "Error subiendo comprobante" }, { status: 500 });
  }
}
