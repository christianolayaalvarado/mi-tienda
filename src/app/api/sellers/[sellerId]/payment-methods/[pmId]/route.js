// src/app/api/sellers/[sellerId]/payment-methods/[pmId]/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET un método específico
export async function GET(req, ctx) {
  const { sellerId, pmId } = await ctx.params;

  try {
    const client = await clientPromise;
    const db = client.db("MiTiendaDB");

    const method = await db.collection("payment_methods").findOne({
      _id: new ObjectId(pmId),
      $or: [
        { storeId: sellerId },
        { userId: sellerId },
        { sellerId: sellerId }
      ]
    });

    if (!method) {
      return NextResponse.json({ error: "Método no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: method._id.toString(),
      userId: method.userId || method.storeId || null,
      type: method.type || "unknown",
      phone: method.phone || null,
      account: method.account || null,
      details: method.details || null,
      qrImageUrl: method.qrImageUrl || null,
      isPrimary: !!method.isPrimary,
      active: method.active ?? true,
      createdAt: method.createdAt ? new Date(method.createdAt).toISOString() : null,
      updatedAt: method.updatedAt ? new Date(method.updatedAt).toISOString() : null
    });
  } catch (err) {
    console.error("Error en GET payment-method:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT actualizar un método
export async function PUT(req, ctx) {
  const { sellerId, pmId } = await ctx.params;
  const body = await req.json();

  try {
    const client = await clientPromise;
    const db = client.db("MiTiendaDB");

    const result = await db.collection("payment_methods").updateOne(
      { _id: new ObjectId(pmId), storeId: sellerId },
      { $set: { ...body, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Método no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error en PUT payment-method:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE eliminar un método
export async function DELETE(req, ctx) {
  const { sellerId, pmId } = await ctx.params;

  try {
    const client = await clientPromise;
    const db = client.db("MiTiendaDB");

    const result = await db.collection("payment_methods").deleteOne({
      _id: new ObjectId(pmId),
      storeId: sellerId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Método no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error en DELETE payment-method:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
