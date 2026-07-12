// app/api/products/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthUser } from "@/lib/serverAuth";
import cloudinary from "@/lib/cloudinary";
import { validateCsrf } from "@/lib/csrf";

/* Helpers */
const isDataUri = (str) => typeof str === "string" && str.startsWith("data:");
const isUrl = (str) => typeof str === "string" && (str.startsWith("http://") || str.startsWith("https://"));

/* GET: marketplace (todas las tiendas) */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const sort = url.searchParams.get("sort") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(url.searchParams.get("limit") || "15", 10) || 15;

    const take = limit;
    const skip = (page - 1) * take;

    const where = {
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category: { name: category } } : {}),
    };

    // Para featured: necesitamos incluir reviews y orderItemProducts para calcular el score
    const includeFeatured = sort === "featured"
      ? { category: true, store: true, user: true, reviews: true, orderItemProducts: true }
      : { category: true, store: true, user: true };

    const total = await prisma.product.count({ where });

    let products = await prisma.product.findMany({
      where,
      include: includeFeatured,
      skip: sort === "featured" ? 0 : skip,
      take: sort === "featured" ? 50 : take, // traemos más para ordenar por score
      orderBy: sort === "featured" ? undefined : { createdAt: "desc" },
    });

    // Para featured: calcular score y ordenar por popularidad
    if (sort === "featured") {
      products = products
        .map((p) => {
          const reviewCount = p.reviews?.length || 0;
          const avgRating = reviewCount > 0
            ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            : 0;
          const salesCount = p.orderItemProducts?.length || 0;
          const totalSold = p.orderItemProducts?.reduce((sum, oip) => sum + (oip.quantity || 0), 0) || 0;
          const hasImages = p.images && p.images.length > 0 ? 1 : 0;

          // Score: más peso a ventas y reviews, bonus por tener imágenes
          const score = (totalSold * 3) + (salesCount * 2) + (reviewCount * 2) + (avgRating * 1.5) + (hasImages * 5);

          return { ...p, _score: score, _avgRating: avgRating, _reviewCount: reviewCount, _totalSold: totalSold };
        })
        .sort((a, b) => b._score - a._score)
        .slice(skip, skip + take);
    }

    return NextResponse.json({ products, totalPages: Math.ceil(total / take), currentPage: page });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

/* POST: crear producto (seller) */
export async function POST(req) {
  try {
    const csrfErr = validateCsrf(req);
    if (csrfErr) return csrfErr;

    const session = await getServerAuthUser(req);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Payload inválido" }, { status: 400 });

    const { title, price, stock, description, categoryId, images, originalPrice, discountPct } = body;
    if (!title || price === undefined || stock === undefined || !categoryId) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.email }, include: { stores: true } });
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
        originalPrice: originalPrice ? Number(originalPrice) : null,
        discountPct: discountPct ? Number(discountPct) : null,
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
    const csrfErr = validateCsrf(req);
    if (csrfErr) return csrfErr;

    const session = await getServerAuthUser(req);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Leer body con manejo de errores
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("PUT /api/products - invalid JSON body", e);
      return NextResponse.json({ error: "Payload inválido (JSON)" }, { status: 400 });
    }

    if (!body || !body.id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const productId = String(body.id);

    // Log temporal para depuración
    console.log("PUT /api/products - request body:", JSON.stringify(body));

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      console.warn("PUT /api/products - producto no encontrado:", productId);
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // Verificar propietario
    const user = await prisma.user.findUnique({ where: { email: session.email } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const isOwner = String(existing.userId) === String(user.id);
    const role = session.role || "";
    const isAdmin = role === "admin" || role === "ADMIN";
    // También verificar ownership por tienda
    const storeUserId = existing.storeId ? await prisma.store.findUnique({ where: { id: existing.storeId } }).then(s => s?.userId) : null;
    const isStoreOwner = storeUserId && String(storeUserId) === String(user.id);
    if (!isOwner && !isAdmin && !isStoreOwner) return NextResponse.json({ error: "No autorizado para editar este producto" }, { status: 403 });

    // Preparar imágenes (subidas) — igual que antes
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

    // Construir objeto de actualización solo con campos permitidos
    const dataToUpdate = {};
    if (body.title !== undefined) dataToUpdate.title = body.title;
    if (body.price !== undefined) dataToUpdate.price = Number(body.price);
    if (body.originalPrice !== undefined) dataToUpdate.originalPrice = body.originalPrice ? Number(body.originalPrice) : null;
    if (body.discountPct !== undefined) dataToUpdate.discountPct = body.discountPct ? Number(body.discountPct) : null;
    if (body.stock !== undefined) dataToUpdate.stock = Number(body.stock);
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.categoryId !== undefined) dataToUpdate.categoryId = body.categoryId;
    if (allImages.length > 0) dataToUpdate.images = allImages;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    // Registrar cambio de precio en historial
    if (body.price !== undefined && Number(body.price) !== existing.price) {
      try {
        await prisma.priceHistory.create({
          data: {
            productId: productId,
            oldPrice: existing.price,
            newPrice: Number(body.price),
          },
        });
      } catch (e) {
        console.error("Error saving price history:", e);
      }
    }

    // Ejecutar update y asegurar await
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: dataToUpdate,
      include: { category: true, store: true, user: true },
    });

    // Log de éxito
    console.log("PUT /api/products - actualizado:", productId);

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("PUT /api/products error:", error);
    return NextResponse.json({ error: error?.message || "Error actualizando producto" }, { status: 500 });
  }
}

/* DELETE: eliminar múltiples productos (solo del owner) */
export async function DELETE(req) {
  try {
    const csrfErr = validateCsrf(req);
    if (csrfErr) return csrfErr;

    const session = await getServerAuthUser(req);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: "IDs requeridos" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.email } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Verificar que los productos pertenecen al usuario o a sus tiendas
    const productIds = body.ids;
    const userProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { store: true },
    });

    const authorized = userProducts.every(
      (p) => String(p.userId) === String(user.id) || (p.store && String(p.store.userId) === String(user.id))
    );
    if (!authorized) {
      return NextResponse.json({ error: "No autorizado para eliminar algunos productos" }, { status: 403 });
    }

    const deleted = await prisma.product.deleteMany({
      where: { id: { in: body.ids }, userId: user.id },
    });

    return NextResponse.json({ message: "Productos eliminados correctamente", count: deleted.count });
  } catch (error) {
    console.error("DELETE /api/products error:", error);
    return NextResponse.json({ error: "Error eliminando productos" }, { status: 500 });
  }
}
