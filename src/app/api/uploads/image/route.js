// app/api/uploads/image/route.js
import { NextResponse } from "next/server";
import { utapi } from "uploadthing/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") || formData.get("image");
    const folder = formData.get("folder") || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    // Validar tamaño (4MB max para Uploadthing free)
    const maxBytes = 4 * 1024 * 1024;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > maxBytes) {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 4MB)" }, { status: 400 });
    }

    // Detectar tipo real por magic bytes
    function detectMime(buf) {
      if (buf.length < 4) return null;
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "image/png";
      if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";
      if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
          buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
      return null;
    }

    const realMime = detectMime(buffer);
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!realMime || !allowed.includes(realMime)) {
      return NextResponse.json({ error: "Tipo no permitido. Solo JPG, PNG o WEBP." }, { status: 400 });
    }

    // Subir a Uploadthing
    const uploadResult = await utapi.uploadFiles([file]);

    if (!uploadResult || !uploadResult[0]?.data?.url) {
      return NextResponse.json({ error: "Error subiendo imagen" }, { status: 500 });
    }

    return NextResponse.json({
      url: uploadResult[0].data.url,
      name: uploadResult[0].data.name,
      size: uploadResult[0].data.size,
    });
  } catch (err) {
    console.error("ERROR /api/uploads/image:", err?.message || err);
    return NextResponse.json({ error: "Error subiendo imagen" }, { status: 500 });
  }
}
