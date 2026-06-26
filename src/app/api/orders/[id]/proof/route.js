// app/api/orders/[id]/proof/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

export async function GET(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { select: { storeId: true } } },
    });
    if (!order || !order.paymentProof) return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 });

    const isOwner = String(authUser.id) === String(order.userId);

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stores: true },
    });
    const sellerStoreIds = (user?.stores || []).map((s) => String(s.id));
    const orderStoreIds = (order.orderItems || []).map((oi) => String(oi.storeId));
    const isSellerOfOrder = orderStoreIds.some((sid) => sellerStoreIds.includes(sid));
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isSellerOfOrder && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    try {
      await prisma.orderHistory.create({
        data: { orderId, action: "view_proof", byUserId: authUser.id },
      });
    } catch (e) {
      console.warn("No se pudo registrar orderHistory view_proof:", e?.message || e);
    }

    const proofUrl = order.paymentProof;
    if (proofUrl.startsWith("http://") || proofUrl.startsWith("https://")) {
      return NextResponse.redirect(new URL(proofUrl));
    }
    return NextResponse.json({ url: proofUrl });
  } catch (err) {
    console.error("ERROR proof redirect:", err);
    return NextResponse.json({ error: "Error redirigiendo al comprobante" }, { status: 500 });
  }
}
