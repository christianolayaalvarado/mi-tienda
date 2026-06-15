// src/app/api/sellers/[sellerId]/payment-methods/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req, ctx) {
  // En App Router, ctx.params es una Promise → usar await
  const { sellerId } = await ctx.params;

  try {
    const client = await clientPromise;
    const db = client.db("MiTiendaDB");

    const methods = await db
      .collection("payment_methods")
      .find({
        $or: [
          { storeId: sellerId },
          { userId: sellerId },
          { sellerId: sellerId }
        ]
      })
      .toArray();

    const normalized = methods.map((m) => ({
      id: m._id?.toString(),
      userId: m.userId || m.storeId || null,
      type: m.type || "unknown",
      phone: m.phone || null,
      account: m.account || null,
      details: m.details || null,
      qrImageUrl: m.qrImageUrl || null,
      isPrimary: !!m.isPrimary,
      active: m.active ?? true,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
      updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : null
    }));

    console.log("sellerId recibido:", sellerId);
    console.log("methods encontrados:", methods.length);

    return NextResponse.json(normalized, { status: 200 });
  } catch (err) {
    console.error("Error en GET payment-methods:", err);
    return NextResponse.json([], { status: 200 });
  }
}
