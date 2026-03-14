"use client"

import Link from "next/link"

export default function RecommendedProducts({ products }) {

  if (!products || products.length === 0) return null

  return (
    <div className="mt-12">

      <h2 className="text-xl font-semibold mb-4">
        También te puede interesar
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {products.map((product) => (

          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="border rounded-lg p-4 hover:shadow"
          >

            <div className="aspect-square bg-gray-100 rounded mb-2"></div>

            <p className="text-sm font-medium">
              {product.title}
            </p>

            <p className="text-green-600 font-semibold">
              S/ {product.price}
            </p>

          </Link>

        ))}

      </div>

    </div>
  )
}