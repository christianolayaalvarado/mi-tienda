// app/api/sellers/[sellerId]/payment-methods/[pmId]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

async function authorizeSeller(req, ctx) {
  const authUser = await getServerAuthUser(req);
  if (!authUser?.id) {
    return { ok: false, res: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const params = await ctx.params;
  const { sellerId } = params;
  // Permitir si es el mismo sellerId o si el usuario tiene role "admin"
  const isOwner = String(authUser.id) === String(sellerId);
  const isAdmin = authUser.role === "admin" || authUser.isAdmin;

  if (!isOwner && !isAdmin) {
    return { ok: false, res: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { ok: true, authUser };
}

export async function PATCH(req, ctx) {
  try {
    const params = await ctx.params;
    const { sellerId, pmId } = params;

    if (!pmId) {
      return NextResponse.json({ error: "pmId inválido" }, { status: 400 });
    }

    // Autorización
    const auth = await authorizeSeller(req, ctx);
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({}));

    // Si solicitan marcar como principal, desmarcar los demás primero
    const updated = await prisma.$transaction(async (tx) => {
      if (body.isPrimary === true) {
        await tx.paymentMethod.updateMany({
          where: { userId: sellerId },
          data: { isPrimary: false },
        });
      }

      // Preparar campos para actualizar
      const updateData = {};
      if (typeof body.type === "string") updateData.type = body.type;
      if (typeof body.phone !== "undefined") updateData.phone = body.phone;
      if (typeof body.account !== "undefined") updateData.account = body.account;
      if (typeof body.cci !== "undefined") updateData.cci = body.cci;
      if (typeof body.details !== "undefined") updateData.details = body.details;
      if (typeof body.qrImageUrl !== "undefined") updateData.qrImageUrl = body.qrImageUrl;
      if (typeof body.isPrimary !== "undefined") updateData.isPrimary = !!body.isPrimary;

      return await tx.paymentMethod.update({
        where: { id: pmId, userId: sellerId },
        data: updateData,
      });
    });

    const normalized = {
      id: updated.id,
      userId: updated.userId,
      type: updated.type,
      phone: updated.phone,
      account: updated.account,
      cci: updated.cci,
      details: updated.details,
      qrImageUrl: updated.qrImageUrl,
      isPrimary: updated.isPrimary,
      createdAt: updated.createdAt ? updated.createdAt.toISOString() : null,
      updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : null,
    };

    return NextResponse.json(normalized, { status: 200 });
  } catch (err) {
    console.error("Error PATCH payment-method:", err);
    return NextResponse.json({ error: "Error actualizando método" }, { status: 500 });
  }
}

export async function DELETE(req, ctx) {
  try {
    const params = await ctx.params;
    const { sellerId, pmId } = params;

    if (!pmId) {
      return NextResponse.json({ error: "pmId inválido" }, { status: 400 });
    }

    // Autorización
    const auth = await authorizeSeller(req, ctx);
    if (!auth.ok) return auth.res;

    await prisma.paymentMethod.delete({
      where: { id: pmId, userId: sellerId },
    });

    return NextResponse.json({ success: true, id: pmId }, { status: 200 });
  } catch (err) {
    console.error("Error DELETE payment-method:", err);
    return NextResponse.json({ error: "Error eliminando método" }, { status: 500 });
  }
}
