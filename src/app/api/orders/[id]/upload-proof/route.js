// app/api/orders/[id]/upload-proof/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const isValidObjectId = (id) => typeof id === "string" && id.length > 0;

export async function POST(req, context) {
  try {
    // await context.params porque params puede ser una Promise
    const params = await context.params;
    const orderId = params?.id;

    if (!orderId || !isValidObjectId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Intentar leer formData (si el cliente envía FormData)
    let formData;
    try {
      formData = await req.formData();
    } catch (e) {
      formData = null;
    }

    // Si no hay formData, intentar JSON con proofUrl
    if (!formData) {
      const body = await req.json().catch(() => ({}));
      const proofUrl = body?.proofUrl;
      if (!proofUrl) {
        return NextResponse.json({ error: "No se recibió comprobante" }, { status: 400 });
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { paymentProof: proofUrl, paymentStatus: "pending_verification" },
      });

      return NextResponse.json({ success: true, order: updated });
    }

    // Si hay formData, extraer el archivo
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "No se encontró el archivo en formData" }, { status: 400 });
    }

    // Aquí deberías subir el archivo a un storage real (S3, Cloudinary, Supabase, etc.)
    // Por ahora guardamos metadata (nombre y mime) en la orden como placeholder.
    const filename = file.name || `proof-${Date.now()}`;
    const mime = file.type || "application/octet-stream";

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProof: filename,
        paymentProofMime: mime,
        paymentStatus: "pending_verification",
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("🔥 ERROR UPLOAD PROOF (upload-proof route):", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error subiendo comprobante" }, { status: 500 });
  }
}
