import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";
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
      include: { category: true, store: { include: { user: { select: { id: true, name: true, email: true } } } }, user: { select: { id: true, name: true, email: true } } },
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

    const session = await getServerAuthUser(req);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const title = typeof body.title === "string" ? body.title.trim() : null;
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const price = Number(body.price);
    const originalPrice = body.originalPrice ? Number(body.originalPrice) : null;
    const discountPct = body.discountPct ? Number(body.discountPct) : null;
    const stockRaw = body.stock;
    const categoryId = body.categoryId || null;

    if (!title) return NextResponse.json({ error: "Título requerido" }, { status: 400 });
    if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Precio inválido" }, { status: 400 });

    const parsedStock = Number(stockRaw);
    if (!Number.isFinite(parsedStock) || !Number.isInteger(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: "Stock inválido (debe ser entero >= 0)" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { store: { include: { user: { select: { id: true, email: true } } } }, user: { select: { id: true, email: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

    const userId = session.id || null;
    const userEmail = session.email || null;
    const isProductOwner = (userId && String(existing.userId) === String(userId)) || (userEmail && existing.user?.email === userEmail);
    const isStoreOwner = existing.store?.user?.id
      ? (String(existing.store.user.id) === String(userId)) || (existing.store.user.email === userEmail)
      : false;
    const isAdmin = session.role === "admin" || session.role === "ADMIN";

    if (!isProductOwner && !isStoreOwner && !isAdmin) {
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

    // Registrar cambio de precio en historial
    if (price !== existing.price) {
      try {
        await prisma.priceHistory.create({
          data: {
            productId: id,
            oldPrice: existing.price,
            newPrice: price,
          },
        });
      } catch (e) {
        console.error("Error saving price history:", e);
      }
    }

    // Actualizar producto (validado)
    const updated = await prisma.product.update({
      where: { id },
      data: {
        title,
        price,
        originalPrice,
        discountPct,
        stock: parsedStock,
        description,
        categoryId,
        images: allImages,
      },
      include: { category: true, store: { include: { user: { select: { id: true, name: true, email: true } } } }, user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT product error:", err);
    return NextResponse.json({ error: "Error actualizando producto" }, { status: 500 });
  }
}
