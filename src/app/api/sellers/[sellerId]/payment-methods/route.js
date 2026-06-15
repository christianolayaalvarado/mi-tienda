// src/app/api/sellers/[sellerId]/payment-methods/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// ==============================
// GET /api/sellers/[sellerId]/payment-methods
// ==============================
export async function GET(req, ctx) {
  const { sellerId } = await ctx.params;

  try {
    const client = await clientPromise;
    const db = client.db("MiTiendaDB");

    const methods = await db.collection("payment_methods").find({
      $or: [
        { storeId: sellerId },
        { userId: sellerId },
        { sellerId: sellerId }
      ]
    }).toArray();

    const normalized = methods.map((m) => ({
      id: m._id?.toString(),
      userId: m.userId || m.storeId || null,
      type: m.type || "unknown",
      phone: m.phone || null,
      account: m.account || null,
      cci: m.cci || null,
      details: m.details || null,
      qrImageUrl: m.qrImageUrl || null,
      isPrimary: !!m.isPrimary,
      active: m.active ?? true,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
      updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : null
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
  const { sellerId } = await ctx.params;

  try {
    const body = await req.json();
    const { type, phone, account, cci, details, qrImageUrl, isPrimary } = body;

    const client = await clientPromise;
    const db = client.db("MiTiendaDB");

    const newMethod = {
      userId: sellerId,
      type,
      phone: phone || null,
      account: account || null,
      cci: cci || null,
      details: details || null,
      qrImageUrl: qrImageUrl || null,
      isPrimary: !!isPrimary,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("payment_methods").insertOne(newMethod);

    return NextResponse.json(
      { id: result.insertedId.toString(), ...newMethod },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error en POST payment-methods:", err);
    return NextResponse.json({ error: "Error creando método" }, { status: 500 });
  }
}
