import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import cloudinary from "@/lib/cloudinary";

// helper validar ObjectId
const isValidObjectId = (id) => {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
};

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, store: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error("GET product error:", err);
    return NextResponse.json({ error: "Error obteniendo producto" }, { status: 500 });
  }
}

// UPDATE PRODUCTO (PUT) con validaciones y manejo de errores
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // Validaciones básicas de entrada
    const title = typeof body.title === "string" ? body.title.trim() : null;
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const price = Number(body.price);
    const stockRaw = body.stock;
    const categoryId = body.categoryId || null;

    if (!title) return NextResponse.json({ error: "Título requerido" }, { status: 400 });
    if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Precio inválido" }, { status: 400 });

    // Validar stock: entero y no negativo
    const parsedStock = Number(stockRaw);
    if (!Number.isFinite(parsedStock) || !Number.isInteger(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: "Stock inválido (debe ser entero >= 0)" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

    // Permiso: solo propietario del producto puede editar
    if (String(existing.userId) !== String(session.user.id)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Subir nuevas imágenes (si las hay). Subir todas primero; si falla alguna, abortar.
    let uploadedImages = [];
    if (Array.isArray(body.newImages) && body.newImages.length > 0) {
      for (const img of body.newImages) {
        try {
          // img se espera como data URL o URL válida según tu front
          const uploaded = await cloudinary.uploader.upload(img, { folder: "mi_tienda" });
          if (uploaded && uploaded.secure_url) {
            uploadedImages.push(uploaded.secure_url);
          } else {
            console.warn("Cloudinary returned no secure_url for image:", img);
            // Decide: continuar o abortar. Aquí abortamos para evitar inconsistencias.
            throw new Error("Error subiendo imagen");
          }
        } catch (e) {
          console.error("Error subiendo imagen a Cloudinary:", e?.message || e);
          return NextResponse.json({ error: "Error subiendo imágenes" }, { status: 500 });
        }
      }
    }

    // Construir lista final de imágenes (mantener existentes + nuevas)
    const allImages = [...(existing.images || []), ...uploadedImages];

    // Actualizar producto (validado)
    const updated = await prisma.product.update({
      where: { id },
      data: {
        title,
        price,
        stock: parsedStock,
        description,
        categoryId,
        images: allImages,
      },
      include: { category: true, store: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT product error:", err);
    return NextResponse.json({ error: "Error actualizando producto" }, { status: 500 });
  }
}
