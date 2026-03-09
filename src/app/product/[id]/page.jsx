import ProductGallery from "@/components/ProductGallery"
import ProductCard from "@/components/ProductCard"
import Link from "next/link"
import { products } from "@/data/products"


export default async function ProductDetail({ params }) {

  const { id } = await params
  const productId = Number(id)

  const product = products.find(p => p.id === productId)

  const relatedProducts = products
  .filter(p => p.category === product.category && p.id !== product.id)
  .slice(0, 4)

  if (!product) {
    return <h1 className="p-10 text-xl">Producto no encontrado</h1>
  }

  return (
    <div className="px-4 py-6 md:p-8 max-w-[1400px] mx-auto">

      <div className="grid md:grid-cols-[1.1fr_1fr] gap-8 md:gap-16 items-start">

        {/* Galería */}
        <div className="flex justify-center md:justify-start w-full">
          <ProductGallery 
            images={product.images} 
            title={product.title} 
          />
        </div>

        {/* Información */}
        <div className="flex flex-col justify-start mt-6 md:mt-10 md:pl-10 text-center md:text-left px-2 md:px-0">

          <h1 className="text-3xl md:text-4xl font-bold">
            {product.title}
          </h1>

          <p className="text-green-600 text-2xl md:text-3xl mt-4 font-semibold">
            S/ {product.price}
          </p>

          {/* Información del producto */}
          <div className="mt-6 space-y-1 text-sm text-gray-600">

            <p>
              <span className="font-semibold text-gray-800">ID Producto:</span> {product.id}
            </p>

            <p>
              <span className="font-semibold text-gray-800">Categoría:</span> {product.category}
            </p>

            <p>
              <span className="font-semibold text-gray-800">Vendedor:</span> {product.seller}
            </p>

            <p>
              <span className="font-semibold text-gray-800">Código vendedor:</span> {product.sellerCode}
            </p>

            <p>
              <span className="font-semibold text-gray-800">Tienda:</span> {product.store}
            </p>

            <p>
              <span className="font-semibold text-gray-800">Código tienda:</span> {product.storeCode}
            </p>

          </div>

          {/* Descripción */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">
              Descripción
            </h2>

            <p className="text-gray-700 leading-relaxed text-justify">
              {product.description}
            </p>
          </div>

          {/* Botón */}
          <button className="mt-8 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition w-fit mx-auto md:mx-0">
            Agregar al carrito
          </button>

        </div>

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