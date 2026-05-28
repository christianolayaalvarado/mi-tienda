import prisma from "@/lib/prisma"
import HomeClient from "@/components/HomeClient"

export default async function HomePage({ searchParams }) {

  // 🔥 FIX NUEVO NEXT.JS
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

  const total = await prisma.product.count({ where })

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      store: true,
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  })

  return (
    <HomeClient
      initialProducts={products}
      initialTotalPages={Math.ceil(total / limit)}
    />
  )
}