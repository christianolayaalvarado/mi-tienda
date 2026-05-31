import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import cloudinary from "@/lib/cloudinary";

// Helper: detectar data URI
const isDataUri = (str) =>
  typeof str === "string" && str.startsWith("data:");

// Helper: detectar URL
const isUrl = (str) =>
  typeof str === "string" && (str.startsWith("http://") || str.startsWith("https://"));

// 🔹 GET PRODUCTOS (MARKETPLACE - TODAS LAS TIENDAS)
export async function GET(req) {
  try {
    const { search, category, page = 1, limit = 12 } =
      Object.fromEntries(new URL(req.url).searchParams.entries());

    const take = parseInt(limit) || 12;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * take;

    const where = {
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { category: { name: category } } : {}),
    };

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        store: true,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      products,
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

// 🔹 CREAR PRODUCTO
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Intentamos parsear JSON; si el cliente envía archivos grandes en JSON esto puede fallar.
    const body = await req.json();
    const { title, price, stock, description, categoryId, images } = body;

    if (!title || price === undefined || stock === undefined || !categoryId) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Obtener usuario real desde DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { stores: true },
    });

    if (!user || user.stores.length === 0) {
      return NextResponse.json({ error: "No tienes tienda creada" }, { status: 400 });
    }

    const store = user.stores[0];

    // Subir imágenes: aceptar URLs ya subidas o dataURI (base64)
    const uploadedImages = [];

    if (Array.isArray(images) && images.length > 0) {
      for (const image of images) {
        try {
          if (!image) continue;

          // Si ya es URL pública (ej. Cloudinary), la usamos tal cual
          if (isUrl(image)) {
            uploadedImages.push(image);
            continue;
          }

          // Si es data URI (base64), subir a Cloudinary
          if (isDataUri(image)) {
            const uploaded = await cloudinary.uploader.upload(image, { folder: "mi_tienda" });
            if (uploaded && uploaded.secure_url) {
              uploadedImages.push(uploaded.secure_url);
            }
            continue;
          }

          // Si no es URL ni dataURI, ignorar para evitar errores
          console.warn("Imagen ignorada (no es URL ni dataURI):", typeof image);
        } catch (imgErr) {
          // Log y continuar con las demás imágenes
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
      include: {
        category: true,
        store: true,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);

    // Si el error proviene de body demasiado grande, devolver texto claro
    const message = error?.message || "Error creando producto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 🔹 EDITAR PRODUCTO
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Obtener usuario real
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "No autorizado para editar este producto" }, { status: 403 });
    }

    // Subir nuevas imágenes (si vienen como dataURI) o aceptar URLs
    const uploadedImages = [];

    if (Array.isArray(body.newImages) && body.newImages.length > 0) {
      for (const img of body.newImages) {
        try {
          if (!img) continue;
          if (isUrl(img)) {
            uploadedImages.push(img);
            continue;
          }
          if (isDataUri(img)) {
            const uploaded = await cloudinary.uploader.upload(img, { folder: "mi_tienda" });
            if (uploaded && uploaded.secure_url) uploadedImages.push(uploaded.secure_url);
            continue;
          }
          console.warn("Imagen nueva ignorada (no es URL ni dataURI)");
        } catch (imgErr) {
          console.error("Error subiendo nueva imagen:", imgErr);
        }
      }
    }

    // Mantener las imágenes que el usuario indicó conservar
    const imagesToKeep = Array.isArray(body.imagesToKeep) ? body.imagesToKeep.filter(Boolean) : [];
    const allImages = [...imagesToKeep, ...uploadedImages];

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: body.title,
        price: Number(body.price),
        stock: Number(body.stock),
        description: body.description || "",
        categoryId: body.categoryId,
        images: allImages,
      },
      include: {
        category: true,
        store: true,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("PUT /api/products error:", error);
    return NextResponse.json({ error: "Error actualizando producto" }, { status: 500 });
  }
}

// 🔹 ELIMINAR MÚLTIPLES PRODUCTOS
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs requeridos" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    const deleted = await prisma.product.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: "Productos eliminados correctamente",
      count: deleted.count,
    });
  } catch (error) {
    console.error("DELETE /api/products error:", error);
    return NextResponse.json({ error: "Error eliminando productos" }, { status: 500 });
  }
}
