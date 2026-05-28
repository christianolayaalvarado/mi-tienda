import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { search, categoryId, page = 1, limit = 8 } =
      Object.fromEntries(new URL(req.url).searchParams.entries())

    const take = parseInt(limit) || 8
    const currentPage = parseInt(page) || 1
    const skip = (currentPage - 1) * take

    // 🔥 Obtener usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // 🔥 Filtros SOLO para sus productos
    const where = {
      userId: user.id,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(categoryId ? { categoryId } : {}),
    }

    const total = await prisma.product.count({ where })

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        store: true,
        user: true,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    })

    // ✅ Ajuste: devolver array directo si frontend lo espera así
    return NextResponse.json({
      products,
      totalPages: Math.ceil(total / take),
      currentPage,
    })

  } catch (error) {
    console.error("GET /api/products/mine error:", error)
    return NextResponse.json({ error: "Error al obtener productos", detail: error.message }, { status: 500 })
  }
}
