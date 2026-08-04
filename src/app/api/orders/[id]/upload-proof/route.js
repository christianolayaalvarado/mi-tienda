import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";
import { sendProofReceivedEmail } from "@/lib/email";

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

    const authUser = await getServerAuthUser(req);
    if (!authUser?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Buscar orden y validar propietario (evita que cualquiera suba comprobantes)
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    // Permitir al propietario de la orden o a un admin subir comprobante
    const sessionUserId = authUser.id || authUser.sub || null;
    const isOwner = sessionUserId && String(sessionUserId) === String(order.userId);
    const isAdmin = authUser.role === "admin";
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

      // Notificar a los vendedores (no bloquear)
      try {
        const fullOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            orderItems: { include: { store: { include: { user: { select: { email: true } } } } } },
          },
        });
        if (fullOrder) {
          const orderNumber = fullOrder.orderNumber || fullOrder.id;
          for (const oi of fullOrder.orderItems) {
            if (oi.store?.user?.email) {
              sendProofReceivedEmail({ to: oi.store.user.email, orderNumber }).catch(() => {});
            }
          }
        }
      } catch (e) { console.warn("Error notificando sellers (JSON path):", e?.message || e); }

      return NextResponse.json({ success: true, order: updated, url: proofUrl });
    }

    // Caso B: formData con archivo
    const file = formData.get("file") || formData.get("proof") || null;
    if (!file) {
      return NextResponse.json({ error: "No se encontró el archivo en formData" }, { status: 400 });
    }

    // Leer contenido del File/Blob y convertir a base64 para subir a Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validaciones básicas de tamaño y tipo real (magic bytes)
    const maxBytes = 8 * 1024 * 1024; // 8 MB
    if (buffer.length > maxBytes) {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 8MB)" }, { status: 400 });
    }

    // Validación de Magic Bytes
    function detectRealMimeType(buf) {
      if (buf.length < 4) return null;
      // PNG: 89 50 4E 47
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
        return "image/png";
      }
      // JPEG: FF D8 FF
      if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) {
        return "image/jpeg";
      }
      // WEBP: RIFF....WEBP (52 49 46 46 at 0, 57 45 42 50 at 8)
      if (buf.length >= 12 &&
          buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
          buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
        return "image/webp";
      }
      return null;
    }

    const realMime = detectRealMimeType(buffer);
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!realMime || !allowed.includes(realMime)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido o dañado. Solo JPG, PNG o WEBP." }, { status: 400 });
    }

    const base64 = buffer.toString("base64");
    const dataUri = `data:${realMime};base64,${base64}`;

    // Subir comprobante de pago
    const file = new File([buffer], `comprobante_${orderId}.${realMime.split("/")[1]}`, { type: realMime });
    const { utapi } = await import("uploadthing/server");
    const uploadResult = await utapi.uploadFiles([file]);

    if (!uploadResult || !uploadResult[0]?.data?.url) {
      console.error("Upload failed:", uploadResult);
      return NextResponse.json({ error: "Error subiendo comprobante" }, { status: 500 });
    }

    const proofUrl = uploadResult[0].data.url;

    // Actualizar orden en DB
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentProof: proofUrl,
        paymentProofMime: realMime,
        paymentStatus: "pending_verification",
      },
    });

    // Notificar a los vendedores que se subió un comprobante (no bloquear)
    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: { include: { store: { include: { user: { select: { email: true, name: true } } } } } },
        },
      });

      if (fullOrder) {
        const orderNumber = fullOrder.orderNumber || fullOrder.id;
        for (const oi of fullOrder.orderItems) {
          const sellerEmail = oi.store?.user?.email;
          if (sellerEmail) {
            sendProofReceivedEmail({ to: sellerEmail, orderNumber }).catch((e) =>
              console.error(`Error enviando email comprobante recibido a ${sellerEmail}:`, e?.message || e)
            );
          }
        }
      }
    } catch (emailErr) {
      console.error("Error notificando sellers sobre comprobante:", emailErr?.message || emailErr);
    }

    return NextResponse.json({ success: true, order: updated, url: uploadResult.secure_url });
  } catch (err) {
    console.error("🔥 ERROR UPLOAD PROOF (upload-proof route):", err?.message || err, err?.stack);
    return NextResponse.json({ error: "Error subiendo comprobante" }, { status: 500 });
  }
}
