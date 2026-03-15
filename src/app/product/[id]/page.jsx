import ProductGallery from "@/components/ProductGallery"
import ProductCard from "@/components/ProductCard"
import ProductInfo from "@/components/ProductInfo"
import Link from "next/link"
import { products } from "@/data/products"



export default async function ProductDetail({ params }) {

  const { id } = await params
  const productId = Number(id)

  const product = products.find(p => p.id === productId)

  if (!product) {
    return <h1 className="p-10 text-xl">Producto no encontrado</h1>
  }

    const relatedProducts = products
  .filter(p => p.category === product.category && p.id !== product.id)
  .slice(0, 4)



  return (
    <div className="px-4 py-6 md:p-8 max-w-[1400px] mx-auto">

      <div className="grid md:grid-cols-[1.60fr_1fr] gap-8 md:gap-16 items-start">

        {/* Galería */}
        <div className="flex justify-center md:justify-start w-full max-w-full">
          <ProductGallery 
            images={product.images} 
            title={product.title} 
          />
        </div>
      {/* Información del producto */}
      <ProductInfo product={product} />



      </div>

      {/* Botón volver */}
      <div className="mt-12 border-t pt-6">
        <Link
          href="/"
          className="inline-block bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm"
        >
          ← Volver a productos
        </Link>
      </div>

      {/* Productos relacionados */}
{relatedProducts.length > 0 && (
  <div className="mt-16">

    <h2 className="text-2xl font-bold mb-6">
      Productos relacionados
    </h2>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {relatedProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>

  </div>
)}

    </div>
  )
}