// src/app/api/reviews/seller/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

// GET - Listar reseñas de los productos del vendedor
export async function GET(req) {
  try {
    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { stores: true },
    });

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const storeIds = (user.stores || []).map((s) => s.id);

    if (storeIds.length === 0) {
      return NextResponse.json({ reviews: [], stats: { total: 0, avgRating: 0 } });
    }

    // Obtener IDs de productos del vendedor
    const products = await prisma.product.findMany({
      where: { storeId: { in: storeIds } },
      select: { id: true, title: true, storeId: true },
    });

    const productIds = products.map((p) => p.id);
    const productMap = {};
    products.forEach((p) => { productMap[p.id] = p; });

    if (productIds.length === 0) {
      return NextResponse.json({ reviews: [], stats: { total: 0, avgRating: 0 } });
    }

    // Obtener reseñas de esos productos
    const reviews = await prisma.review.findMany({
      where: { productId: { in: productIds } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, title: true, images: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Estadísticas
    const total = reviews.length;
    const avgRating = total > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
      : 0;

    // Contar por estrella
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    return NextResponse.json({
      reviews,
      stats: { total, avgRating, ratingDistribution },
    });
  } catch (err) {
    console.error("ERROR GET seller reviews:", err);
    return NextResponse.json({ error: "Error obteniendo reseñas" }, { status: 500 });
  }
}
