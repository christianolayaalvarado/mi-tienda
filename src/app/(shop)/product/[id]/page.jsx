import prisma from "@/lib/prisma"
import Link from "next/link"
import ProductGallery from "@/components/ProductGallery"
import ProductInfo from "@/components/ProductInfo"
import ReviewsSection from "@/components/ReviewsSection"
import Image from "next/image"
import Breadcrumbs from "@/components/Breadcrumbs"

export default async function ProductDetail({ params }) {

  // 🔥 FIX Next.js
  const { id } = await params

  // 🔹 Validar ObjectId (Mongo)
  const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id)

  if (!isValidObjectId) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-12 text-center">
        <p className="text-gray-500 text-lg mb-4">ID de producto inválido</p>
        <Link href="/" className="inline-flex items-center gap-1 text-green-600 hover:underline font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inicio
        </Link>
      </div>
    );
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
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-12 text-center">
        <p className="text-gray-500 text-lg mb-4">Producto no encontrado</p>
        <Link href="/" className="inline-flex items-center gap-1 text-green-600 hover:underline font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inicio
        </Link>
      </div>
    );
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">

      <Breadcrumbs extraItems={[{ label: product.title }]} />

      <div className="grid md:grid-cols-2 gap-10 mt-4">

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