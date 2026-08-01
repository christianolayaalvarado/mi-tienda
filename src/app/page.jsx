import prisma from "@/lib/prisma"
import HomeClient from "@/components/HomeClient"

export const metadata = {
  title: {
    default: "Mi Tienda — Compra y Venta de Productos en Perú",
    template: "%s | Mi Tienda",
  },
  description:
    "Mi Tienda es tu marketplace en Perú. Compra y vende productos de calidad: electrodomésticos, cocina, muebles, decoración, fitness y más. Ofertas exclusivas y envíos a todo el país.",
  alternates: { canonical: "https://mi-tienda-app-theta.vercel.app" },
};

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