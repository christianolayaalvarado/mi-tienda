import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/authOptions"
import { getServerSession } from "next-auth"
import cloudinary from "@/lib/cloudinary"

// 🔹 GET PRODUCTOS (MARKETPLACE - TODAS LAS TIENDAS)
export async function GET(req) {
  try {
    const { search, category, page = 1, limit = 12 } =
      Object.fromEntries(new URL(req.url).searchParams.entries())

    const take = parseInt(limit) || 12
    const currentPage = parseInt(page) || 1
    const skip = (currentPage - 1) * take

    const where = {
      ...(search
        ? { title: { contains: search, mode: "insensitive" } }
        : {}),
      ...(category
        ? { category: { name: category } }
        : {}),
    }

    const total = await prisma.product.count({ where })

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        store: true,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      products,
      totalPages: Math.ceil(total / take),
    })

  } catch (error) {
    console.error("GET /api/products error:", error)
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    )
  }
}

// 🔹 CREAR PRODUCTO
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { title, price, stock, description, categoryId, images } = body

    if (!title || !price || !stock || !categoryId) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      )
    }

    // 🔥 Obtener usuario REAL desde DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { stores: true },
    })

    if (!user || user.stores.length === 0) {
      return NextResponse.json(
        { error: "No tienes tienda creada" },
        { status: 400 }
      )
    }

    const store = user.stores[0]

    // 🔥 Subir imágenes
    const uploadedImages = []

    if (images?.length) {
      for (const image of images) {
        const uploaded = await cloudinary.uploader.upload(image, {
          folder: "mi_tienda",
        })
        uploadedImages.push(uploaded.secure_url)
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
    })

    return NextResponse.json(newProduct, { status: 201 })

  } catch (error) {
    console.error("POST /api/products error:", error)
    return NextResponse.json(
      { error: "Error creando producto" },
      { status: 500 }
    )
  }
}

// 🔹 EDITAR PRODUCTO
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    // 🔥 Obtener usuario real
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    const existing = await prisma.product.findUnique({
      where: { id },
    })

    // 🔒 SEGURIDAD CORRECTA
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "No autorizado para editar este producto" },
        { status: 403 }
      )
    }

    // 🔥 Subir nuevas imágenes
    const uploadedImages = []

    if (body.newImages?.length) {
      for (const img of body.newImages) {
        const uploaded = await cloudinary.uploader.upload(img, {
          folder: "mi_tienda",
        })
        uploadedImages.push(uploaded.secure_url)
      }
    }

    const allImages = [
      ...(existing.images || []),
      ...uploadedImages,
    ]

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
    })

    return NextResponse.json(updatedProduct)

  } catch (error) {
    console.error("PUT /api/products error:", error)
    return NextResponse.json(
      { error: "Error actualizando producto" },
      { status: 500 }
    )
  }
}

// 🔹 ELIMINAR MÚLTIPLES PRODUCTOS
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs requeridos" },
        { status: 400 }
      )
    }

    // 🔥 Obtener usuario real
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    // 🔒 SOLO elimina productos del usuario
    const deleted = await prisma.product.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
    })

    return NextResponse.json({
      message: "Productos eliminados correctamente",
      count: deleted.count,
    })

  } catch (error) {
    console.error("DELETE /api/products error:", error)
    return NextResponse.json(
      { error: "Error eliminando productos" },
      { status: 500 }
    )
  }
}