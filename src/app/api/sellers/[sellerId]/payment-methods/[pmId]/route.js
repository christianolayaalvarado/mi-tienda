// app/api/sellers/[sellerId]/payment-methods/[pmId]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ajusta si tu prisma está en otra ruta

// Opcional: función helper para comprobar ownership (descomenta si usas next-auth)
// import { getServerSession } from "next-auth";
// async function ensureSellerMatchesSession(sellerId) {
//   const session = await getServerSession();
//   if (!session?.user?.id || session.user.id !== sellerId) {
//     return false;
//   }
//   return true;
// }

export async function PATCH(req, { params }) {
  try {
    const { sellerId, pmId } = await params;
    if (!sellerId || !pmId) {
      return NextResponse.json({ error: "sellerId or pmId missing" }, { status: 400 });
    }

    const body = await req.json();

    // Si se solicita marcar como principal, desmarcar otros primero
    if (body.isPrimary) {
      try {
        await prisma.paymentMethod.updateMany({
          where: { userId: sellerId, isPrimary: true },
          data: { isPrimary: false },
        });
      } catch (e) {
        // Si el campo isPrimary no existe en el modelo, no queremos romper la petición
        console.warn("Could not unset other primary flags:", e?.message || e);
      }
    }

    const updated = await prisma.paymentMethod.update({
      where: { id: pmId },
      data: {
        type: body.type ?? undefined,
        phone: body.phone ?? null,
        account: body.account ?? null,
        cci: body.cci ?? null,
        qrImageUrl: body.qrImageUrl ?? null,
        details: body.details ?? null,
        ...(typeof body.isPrimary !== "undefined" ? { isPrimary: !!body.isPrimary } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH payment-method error:", err);
    // Si el registro no existe prisma lanza, devolvemos 404
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { sellerId, pmId } = await params;
    if (!sellerId || !pmId) {
      return NextResponse.json({ error: "sellerId or pmId missing" }, { status: 400 });
    }

    // Log temporal para depuración
    console.log("DELETE handler hit for sellerId:", sellerId, "pmId:", pmId);

    const existing = await prisma.paymentMethod.findUnique({ where: { id: pmId } });
    if (!existing) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
    }

    // Opcional: verificar que el método pertenece al sellerId
    if (existing.userId !== sellerId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    await prisma.paymentMethod.delete({ where: { id: pmId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE payment-method error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
