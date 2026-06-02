// app/api/orders/[id]/upload-proof/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Nota:
 * - Este handler acepta:
 *   1) multipart/form-data con campo "file" (File/Blob desde fetch/FormData)
 *   2) JSON { proofUrl: "https://..." } para guardar una URL ya subida
 * - Valida que la sesión exista y que el usuario sea propietario de la orden o admin.
 * - Sube la imagen a Cloudinary y guarda secure_url + mime en la orden.
 */

const isValidId = (id) => typeof id === "string" && id.length > 0;

export async function POST(req, context) {
  try {
    const params = await context.params;
    const orderId = params?.id;
    if (!orderId || !isValidId(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Buscar orden y validar propietario (evita que cualquiera suba comprobantes)
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    // Permitir al propietario de la orden o a un admin subir comprobante
    const sessionUserId = session.user?.id || session.user?.sub || null;
    const isOwner = sessionUserId && String(sessionUserId) === String(order.userId);
    const isAdmin = session.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "No autorizado para subir comprobante en esta orden" }, { status: 403 });
    }

    // Intentar parsear formData (si el cliente envía FormData con file)
    let formData;
    try {
      formData = await req.formData();
    } catch (e) {
      formData = null;
    }

    // Caso A: JSON con proofUrl (cliente ya subió a Cloudinary u otro storage)
    if (!formData) {
      const body = await req.json().catch(() => ({}));
      const proofUrl = body?.proofUrl;
      const proofMime = body?.proofMime || null;
      if (!proofUrl) {
        return NextResponse.json({ error: "No se recibió comprobante" }, { status: 400 });
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentProof: proofUrl,
          paymentProofMime: proofMime || undefined,
          paymentStatus: "pending_verification",
        },
      });

      return NextResponse.json({ success: true, order: updated, url: proofUrl });
    }

    // Caso B: formData con archivo
    const file = formData.get("file") || formData.get("proof") || null;
    if (!file) {
      return NextResponse.json({ error: "No se encontró el archivo en formData" }, { status: 400 });
    }

    // Validaciones básicas
    const mime = file.type || file.type || "application/octet-stream";
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const maxBytes = 8 * 1024 * 1024; // 8 MB
    // file.size puede no estar disponible en algunos entornos; intentar leer tamaño si existe
    if (file.size && file.size > maxBytes) {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 8MB)" }, { status: 400 });
    }
    if (!allowed.includes(mime)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    // Leer contenido del File/Blob y convertir a base64 para subir a Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mime};base64,${base64}`;

    // Subir a Cloudinary en carpeta por orden
    const folder = `comprobantes/${orderId}`;
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
      overwrite: true,
      use_filename: true,
      unique_filename: false,
    });

    if (!uploadResult || !uploadResult.secure_url) {
      console.error("Cloudinary upload failed:", uploadResult);
      return NextResponse.json({ error: "Error subiendo a Cloudinary" }, { status: 500 });
    }

    // Actualizar orden en DB
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProof: uploadResult.secure_url,
        paymentProofMime: uploadResult.format ? `image/${uploadResult.format}` : mime,
        paymentStatus: "pending_verification",
      },
    });

    return NextResponse.json({ success: true, order: updated, url: uploadResult.secure_url });
  } catch (err) {
    console.error("🔥 ERROR UPLOAD PROOF (upload-proof route):", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error subiendo comprobante" }, { status: 500 });
  }
}
