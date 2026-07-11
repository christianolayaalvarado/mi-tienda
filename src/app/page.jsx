import prisma from "@/lib/prisma"
import HomeClient from "@/components/HomeClient"

export default async function HomePage({ searchParams }) {

  const params = await searchParams

  const search = params?.search || ""
  const category = params?.category || ""
  const page = parseInt(params?.page) || 1
  const limit = 12

  const skip = (page - 1) * limit

  const where = {
    ...(search
      ? { title: { contains: search, mode: "insensitive" } }
      : {}),
    ...(category
      ? { category: { name: category } }
      : {}),
  }

  let products = []
  let totalPages = 1

  try {
    const total = await prisma.product.count({ where })

    const fetched = await prisma.product.findMany({
      where,
      include: {
        category: true,
        store: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    })

    products = fetched
    totalPages = Math.ceil(total / limit)
  } catch (err) {
    console.error("[HomePage] Error fetching products:", err)
  }

  return (
    <HomeClient
      initialProducts={products}
      initialTotalPages={totalPages}
    />
  )
}