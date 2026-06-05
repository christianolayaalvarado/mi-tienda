// app/api/orders/[id]/proof/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || !order.paymentProof) return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 });

    const isOwner = String(session.user.id) === String(order.userId);
    const isSeller = session.user.role === "seller";
    const isAdmin = session.user.role === "admin";
    if (!isOwner && !isSeller && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    // Registrar acceso si el modelo existe; no romper si no existe
    try {
      await prisma.orderHistory.create({
        data: { orderId, action: "view_proof", byUserId: session.user.id },
      });
    } catch (e) {
      console.warn("No se pudo registrar orderHistory view_proof (posible modelo ausente):", e?.message || e);
    }

    return NextResponse.redirect(order.paymentProof);
  } catch (err) {
    console.error("ERROR proof redirect:", err);
    return NextResponse.json({ error: "Error redirigiendo al comprobante" }, { status: 500 });
  }
}
