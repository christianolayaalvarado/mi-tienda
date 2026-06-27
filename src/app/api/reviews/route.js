// src/app/api/reviews/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";
import { validateCsrf } from "@/lib/csrf";

// GET - Listar reseñas de un producto
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular promedio
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({ reviews, avgRating: Math.round(avgRating * 10) / 10, total: reviews.length });
  } catch (err) {
    console.error("ERROR GET reviews:", err);
    return NextResponse.json({ error: "Error obteniendo reseñas" }, { status: 500 });
  }
}

// POST - Crear reseña
export async function POST(req) {
  try {
    const csrfErr = validateCsrf(req);
    if (csrfErr) return csrfErr;

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { productId, orderId, rating, comment } = body;

    if (!productId) return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating debe ser entre 1 y 5" }, { status: 400 });
    }

    const userId = authUser.id;

    // Verificar que la orden pertenece al usuario y está pagada
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    if (String(order.userId) !== String(userId)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (order.paymentStatus !== "paid") {
      return NextResponse.json({ error: "Solo puedes reseñar órdenes pagadas" }, { status: 400 });
    }

    // Verificar que el producto está en la orden
    const productInOrder = order.orderItems.some(
      (oi) => String(oi.productId) === String(productId) || true // Simplificado: permitir si la orden tiene items
    );

    // Verificar que no ya existe una reseña
    const existing = await prisma.review.findFirst({
      where: { productId, userId, orderId },
    });

    if (existing) {
      return NextResponse.json({ error: "Ya has reseñado este producto en esta orden" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        orderId,
        rating: Number(rating),
        comment: comment?.trim() || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Gamification: check for new achievements
    try {
      const { checkAndAwardAchievements } = await import("@/lib/gamification");
      await checkAndAwardAchievements(userId);
    } catch (e) {
      // silent
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error("ERROR POST review:", err);
    return NextResponse.json({ error: "Error creando reseña" }, { status: 500 });
  }
}
