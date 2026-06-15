// app/api/sellers/[sellerId]/payment-methods/[pmId]/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const isValidObjectId = (id) => {
  try {
    return ObjectId.isValid(id);
  } catch {
    return false;
  }
};

async function authorizeSeller(ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false, res: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };

  const { sellerId } = await ctx.params;
  // Permitir si es el mismo sellerId o si el usuario tiene role "admin"
  const isOwner = String(session.user?.id) === String(sellerId);
  const isAdmin = session.user?.role === "admin";

  if (!isOwner && !isAdmin) {
    return { ok: false, res: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { ok: true, session };
}

export async function PATCH(req, ctx) {
  const { sellerId, pmId } = await ctx.params;

  if (!pmId || !isValidObjectId(pmId)) {
    return NextResponse.json({ error: "pmId inválido" }, { status: 400 });
  }

  // Autorización
  const auth = await authorizeSeller(ctx);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db("MiTiendaDB");

    // Si solicitan marcar como principal, desmarcar los demás primero
    if (body.isPrimary === true) {
      await db.collection("payment_methods").updateMany(
        { $or: [{ userId: sellerId }, { storeId: sellerId }, { sellerId: sellerId }] },
        { $set: { isPrimary: false } }
      );
    }

    const updateDoc = {
      ...body,
      updatedAt: new Date(),
    };

    delete updateDoc._id;

    const result = await db.collection("payment_methods").findOneAndUpdate(
      { _id: new ObjectId(pmId), $or: [{ userId: sellerId }, { storeId: sellerId }, { sellerId: sellerId }] },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return NextResponse.json({ error: "Método no encontrado o no autorizado" }, { status: 404 });
    }

    const m = result.value;
    const normalized = {
      id: m._id.toString(),
      userId: m.userId || m.storeId || null,
      type: m.type || null,
      phone: m.phone || null,
      account: m.account || null,
      cci: m.cci || null,
      details: m.details || null,
      qrImageUrl: m.qrImageUrl || null,
      isPrimary: !!m.isPrimary,
      active: m.active ?? true,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
      updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : null,
    };

    return NextResponse.json(normalized, { status: 200 });
  } catch (err) {
    console.error("Error PATCH payment-method:", err);
    return NextResponse.json({ error: "Error actualizando método" }, { status: 500 });
  }
}

export async function DELETE(req, ctx) {
  const { sellerId, pmId } = await ctx.params;

  if (!pmId || !isValidObjectId(pmId)) {
    return NextResponse.json({ error: "pmId inválido" }, { status: 400 });
  }

  // Autorización
  const auth = await authorizeSeller(ctx);
  if (!auth.ok) return auth.res;

  try {
    const client = await clientPromise;
    const db = client.db("MiTiendaDB");

    const result = await db.collection("payment_methods").findOneAndDelete({
      _id: new ObjectId(pmId),
      $or: [{ userId: sellerId }, { storeId: sellerId }, { sellerId: sellerId }],
    });

    if (!result.value) {
      return NextResponse.json({ error: "Método no encontrado o no autorizado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: pmId }, { status: 200 });
  } catch (err) {
    console.error("Error DELETE payment-method:", err);
    return NextResponse.json({ error: "Error eliminando método" }, { status: 500 });
  }
}
