import prisma from "@/lib/prisma"
import Link from "next/link"
import ProductGallery from "@/components/ProductGallery"
import ProductInfo from "@/components/ProductInfo"
import ReviewsSection from "@/components/ReviewsSection"
import Image from "next/image"

export default async function ProductDetail({ params }) {

  // 🔥 FIX Next.js
  const { id } = await params

  // 🔹 Validar ObjectId (Mongo)
  const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id)

  if (!isValidObjectId) {
    return <p className="p-6">ID de producto inválido</p>
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      user: true,
      store: true,
    },
  })

  if (!product) {
    return <p className="p-6">Producto no encontrado</p>
  }

  // 🔹 Productos relacionados
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      NOT: { id: product.id },
    },
    take: 4,
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      <Link href="/" className="text-green-600 hover:underline">
        ← Volver
      </Link>

      <div className="grid md:grid-cols-2 gap-10 mt-6">

        {/* 🔥 FIX AQUÍ */}
        <ProductGallery 
          images={product.images} 
          title={product.title} 
        />

        <ProductInfo product={product} />
      </div>

      {/* Reseñas */}
      <ReviewsSection productId={product.id} />

      {/* 🔥 MEJORADOS RELACIONADOS */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">
            Productos relacionados
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((item) => (
              <Link key={item.id} href={`/product/${item.id}`}>
                <div className="border p-3 rounded hover:shadow transition">

                  {item.images?.[0] && (
                    <div className="relative w-full h-32 mb-2">
                      <Image
                        src={item.images[0]}
                        alt={item.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}

                  <p className="text-sm font-medium line-clamp-2">
                    {item.title}
                  </p>

                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}