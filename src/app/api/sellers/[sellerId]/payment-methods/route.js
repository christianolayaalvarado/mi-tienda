// src/app/api/sellers/[sellerId]/payment-methods/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req, ctx) {
  // ctx.params es una Promise en App Router; await para desempaquetar
  const params = await ctx.params;
  const sellerId = String(params?.sellerId || "");

  try {
    const client = await clientPromise;
    const db = client.db("MiTiendaDB"); // forzar DB explícita

    const methods = await db
      .collection("payment_methods")
      .find({
        $or: [
          { storeId: sellerId },
          { store_id: sellerId },
          { sellerId: sellerId },
          { seller_id: sellerId },
          { userId: sellerId },
          { user_id: sellerId },
          { ownerId: sellerId },
          { owner_id: sellerId }
        ]
      })
      .toArray();

    const normalized = (methods || []).map((m) => ({
      id: m._id?.toString() || m.id || null,
      userId: m.userId || m.user_id || m.storeId || m.store_id || null,
      type: m.type || m.method || "unknown",
      phone: m.phone || m.telefono || null,
      account: m.account || m.cuenta || null,
      cci: m.cci || null,
      details: m.details || m.descripcion || null,
      qrImageUrl: m.qrImageUrl || m.qr || m.qr_url || null,
      isPrimary: !!m.isPrimary,
      active: m.active === undefined ? true : !!m.active,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
      updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : null
    }));

    return NextResponse.json(normalized, { status: 200 });
  } catch (err) {
    console.error("GET /api/sellers/[sellerId]/payment-methods error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
