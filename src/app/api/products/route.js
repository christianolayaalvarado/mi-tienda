// app/api/products/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth/next";
import cloudinary from "@/lib/cloudinary";

/* Helpers */
const isDataUri = (str) => typeof str === "string" && str.startsWith("data:");
const isUrl = (str) => typeof str === "string" && (str.startsWith("http://") || str.startsWith("https://"));

/* GET: marketplace (todas las tiendas) */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(url.searchParams.get("limit") || "15", 10) || 15;

    const take = limit;
    const skip = (page - 1) * take;

    const where = {
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category: { name: category } } : {}),
    };

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      include: { category: true, store: true, user: true },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products, totalPages: Math.ceil(total / take), currentPage: page });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

/* POST: crear producto (seller) */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Payload inválido" }, { status: 400 });

    const { title, price, stock, description, categoryId, images } = body;
    if (!title || price === undefined || stock === undefined || !categoryId) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { stores: true } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    if (!user.stores || user.stores.length === 0) {
      return NextResponse.json({ error: "No tienes tienda creada" }, { status: 400 });
    }
    const store = user.stores[0];

    const uploadedImages = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const image of images) {
        try {
          if (!image) continue;
          if (isUrl(image)) { uploadedImages.push(image); continue; }
          if (isDataUri(image)) {
            const uploaded = await cloudinary.uploader.upload(image, { folder: "mi_tienda" });
            if (uploaded?.secure_url) uploadedImages.push(uploaded.secure_url);
            continue;
          }
          console.warn("Imagen ignorada (no es URL ni dataURI)");
        } catch (imgErr) {
          console.error("Error subiendo imagen a Cloudinary:", imgErr);
        }
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        title,
        price: Number(price),
        stock: Number(stock),
        description: description || "",
        images: uploadedImages,
        categoryId,
        userId: user.id,
        storeId: store.id,
      },
      include: { category: true, store: true, user: true },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: error?.message || "Error creando producto" }, { status: 500 });
  }
}

/* PUT: editar producto (owner o admin) */
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || !body.id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const productId = body.id;
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

    // Verificar propietario
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    const isOwner = String(existing.userId) === String(user.id);
    const isAdmin = session.user?.role === "admin" || session.user?.role === "ADMIN";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "No autorizado para editar este producto" }, { status: 403 });

    // Subir nuevas imágenes si vienen como dataURI
    const uploadedImages = [];
    if (Array.isArray(body.newImages) && body.newImages.length > 0) {
      for (const img of body.newImages) {
        try {
          if (!img) continue;
          if (isUrl(img)) { uploadedImages.push(img); continue; }
          if (isDataUri(img)) {
            const uploaded = await cloudinary.uploader.upload(img, { folder: "mi_tienda" });
            if (uploaded?.secure_url) uploadedImages.push(uploaded.secure_url);
            continue;
          }
          console.warn("Imagen nueva ignorada (no es URL ni dataURI)");
        } catch (imgErr) {
          console.error("Error subiendo nueva imagen:", imgErr);
        }
      }
    }

    const imagesToKeep = Array.isArray(body.imagesToKeep) ? body.imagesToKeep.filter(Boolean) : [];
    const allImages = [...imagesToKeep, ...uploadedImages];

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        title: body.title ?? existing.title,
        price: body.price !== undefined ? Number(body.price) : existing.price,
        stock: body.stock !== undefined ? Number(body.stock) : existing.stock,
        description: body.description ?? existing.description,
        categoryId: body.categoryId ?? existing.categoryId,
        images: allImages.length > 0 ? allImages : existing.images,
      },
      include: { category: true, store: true, user: true },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("PUT /api/products error:", error);
    return NextResponse.json({ error: "Error actualizando producto" }, { status: 500 });
  }
}

/* DELETE: eliminar múltiples productos (solo del owner) */
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: "IDs requeridos" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const deleted = await prisma.product.deleteMany({
      where: { id: { in: body.ids }, userId: user.id },
    });

    return NextResponse.json({ message: "Productos eliminados correctamente", count: deleted.count });
  } catch (error) {
    console.error("DELETE /api/products error:", error);
    return NextResponse.json({ error: "Error eliminando productos" }, { status: 500 });
  }
}
