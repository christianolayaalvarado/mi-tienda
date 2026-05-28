import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import cloudinary from "@/lib/cloudinary";

// 🔹 helper validar ObjectId
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(id);
};

// 🔹 GET PRODUCTO
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        store: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);

  } catch (err) {
    console.error("GET product error:", err);

    return NextResponse.json(
      { error: "Error obteniendo producto" },
      { status: 500 }
    );
  }
}

// 🔥 UPDATE PRODUCTO (FIX CLAVE)
export async function PUT(req, { params }) {
  try {
    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // 🔹 subir nuevas imágenes
    let uploadedImages = [];

    if (body.newImages?.length) {
      for (const img of body.newImages) {
        const uploaded = await cloudinary.uploader.upload(img, {
          folder: "mi_tienda",
        });
        uploadedImages.push(uploaded.secure_url);
      }
    }

    const allImages = [
      ...(existing.images || []),
      ...uploadedImages,
    ];

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: body.title,
        price: Number(body.price),
        stock: Number(body.stock), // 🔥 AQUÍ actualizas stock
        description: body.description || "",
        categoryId: body.categoryId,
        images: allImages,
      },
      include: {
        category: true,
        store: true,
      },
    });

    return NextResponse.json(updated);

  } catch (err) {
    console.error("PUT product error:", err);

    return NextResponse.json(
      { error: "Error actualizando producto" },
      { status: 500 }
    );
  }
}