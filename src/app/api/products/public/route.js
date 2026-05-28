import prisma from "@/lib/prisma"

export async function GET(req) {
  try {
    const { search, category, sort, page = 1, limit = 12 } =
      Object.fromEntries(new URL(req.url).searchParams.entries())

    const take = parseInt(limit) || 12
    const currentPage = parseInt(page) || 1
    const skip = (currentPage - 1) * take

    // 🔥 WHERE DINÁMICO (SIN FILTRO DE STOCK)
    const where = {}

    // 🔍 búsqueda
    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      }
    }

    // 🔍 categoría
    if (category) {
      where.category = {
        name: category,
      }
    }

    // 🔃 orden
    const orderBy =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
          ? { price: "desc" }
          : { createdAt: "desc" }

    // ✅ PRODUCTOS
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        store: true,
      },
      orderBy,
      skip,
      take,
    })

    // ✅ TOTAL
    const totalProducts = await prisma.product.count({ where })
    const totalPages = Math.ceil(totalProducts / take)

    return Response.json({
      products,
      totalPages,
      currentPage,
    })
  } catch (error) {
    console.error("🔥 ERROR EN API PRODUCTS:", error)

    return Response.json(
      {
        error: "Error al obtener productos",
        detail: error.message,
      },
      { status: 500 }
    )
  }
}