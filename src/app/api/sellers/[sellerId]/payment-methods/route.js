// src/app/api/sellers/[sellerId]/payment-methods/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";

// ==============================
// GET /api/sellers/[sellerId]/payment-methods
// ==============================
export async function GET(req, ctx) {
  try {
    const params = await ctx.params;
    const { sellerId } = params;

    if (!sellerId) {
      return NextResponse.json({ error: "sellerId requerido" }, { status: 400 });
    }

    const methods = await prisma.paymentMethod.findMany({
      where: {
        userId: sellerId,
      },
      orderBy: { createdAt: "desc" },
    });

    const normalized = methods.map((m) => ({
      id: m.id,
      userId: m.userId,
      type: m.type || "unknown",
      phone: m.phone || null,
      account: m.account || null,
      cci: m.cci || null,
      details: m.details || null,
      qrImageUrl: m.qrImageUrl || null,
      isPrimary: !!m.isPrimary,
      createdAt: m.createdAt ? m.createdAt.toISOString() : null,
      updatedAt: m.updatedAt ? m.updatedAt.toISOString() : null,
    }));

    return NextResponse.json({ methods: normalized }, { status: 200 });
  } catch (err) {
    console.error("Error en GET payment-methods:", err);
    return NextResponse.json({ methods: [] }, { status: 200 });
  }
}

// ==============================
// POST /api/sellers/[sellerId]/payment-methods
// ==============================
export async function POST(req, ctx) {
  try {
    const params = await ctx.params;
    const { sellerId } = params;

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const isOwner = String(authUser.id) === String(sellerId);
    const isAdmin = authUser.role === "admin" || authUser.isAdmin;
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { type, phone, account, cci, details, qrImageUrl, isPrimary } = body;

    if (!type) {
      return NextResponse.json({ error: "El tipo de método de pago es requerido" }, { status: 400 });
    }

    // Crear el método de pago y si es principal, desmarcar los otros
    const newMethod = await prisma.$transaction(async (tx) => {
      if (isPrimary === true) {
        await tx.paymentMethod.updateMany({
          where: { userId: sellerId },
          data: { isPrimary: false },
        });
      }

      return await tx.paymentMethod.create({
        data: {
          userId: sellerId,
          type,
          phone: phone || null,
          account: account || null,
          cci: cci || null,
          details: details || null,
          qrImageUrl: qrImageUrl || null,
          isPrimary: !!isPrimary,
        },
      });
    });

    return NextResponse.json(
      {
        id: newMethod.id,
        userId: newMethod.userId,
        type: newMethod.type,
        phone: newMethod.phone,
        account: newMethod.account,
        cci: newMethod.cci,
        details: newMethod.details,
        qrImageUrl: newMethod.qrImageUrl,
        isPrimary: newMethod.isPrimary,
        createdAt: newMethod.createdAt.toISOString(),
        updatedAt: newMethod.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error en POST payment-methods:", err);
    return NextResponse.json({ error: "Error creando método de pago" }, { status: 500 });
  }
}
