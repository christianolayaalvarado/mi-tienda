// app/api/sellers/[sellerId]/payment-methods/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ajusta la ruta a tu prisma client

export async function GET(req, { params }) {
  try {
    // Desempaquetar params (await porque puede ser un Promise)
    const { sellerId } = await params;
    if (!sellerId) {
      return NextResponse.json({ error: "sellerId missing" }, { status: 400 });
    }

    const methods = await prisma.paymentMethod.findMany({
      where: { userId: sellerId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(methods);
  } catch (err) {
    console.error("GET payment-methods error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { sellerId } = await params;
    if (!sellerId) {
      return NextResponse.json({ error: "sellerId missing" }, { status: 400 });
    }

    const body = await req.json();

    // Validaciones mínimas
    const type = body.type?.toString() || "yape";
    const isPrimary = !!body.isPrimary;

    // Si viene isPrimary true, desmarcar otros métodos primarios del seller
    if (isPrimary) {
      await prisma.paymentMethod.updateMany({
        where: { userId: sellerId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const created = await prisma.paymentMethod.create({
      data: {
        userId: sellerId,
        type,
        phone: body.phone || null,
        account: body.account || null,
        cci: body.cci || null,
        qrImageUrl: body.qrImageUrl || null,
        details: body.details || null,
        isPrimary,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST payment-methods error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
