// src/app/api/reviews/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

const isValidObjectId = (id) => typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

// PUT - Actualizar reseña
export async function PUT(req, context) {
  try {
    const params = await context.params;
    const reviewId = params?.id;
    if (!reviewId || !isValidObjectId(reviewId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating debe ser entre 1 y 5" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
    if (String(review.userId) !== String(authUser.id)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: Number(rating),
        comment: comment?.trim() || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ review: updated });
  } catch (err) {
    console.error("ERROR PUT review:", err);
    return NextResponse.json({ error: "Error actualizando reseña" }, { status: 500 });
  }
}

// DELETE - Eliminar reseña
export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const reviewId = params?.id;
    if (!reviewId || !isValidObjectId(reviewId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    const isOwner = String(review.userId) === String(authUser.id);
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("ERROR DELETE review:", err);
    return NextResponse.json({ error: "Error eliminando reseña" }, { status: 500 });
  }
}
