"use client"

import { useProducts } from "@/hooks/useProducts"
import Image from "next/image"
import Link from "next/link"


export default function DashboardProducts() {

  const { products, deleteProduct } = useProducts()

  
  return (

    <div>

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-bold">
          Productos
        </h1>

        <Link
          href="/dashboard/products/new"
          className="bg-lime-600 text-white px-4 py-2 rounded-md hover:bg-lime-700 transition"
        >
          + Nuevo producto
        </Link>

      </div>

      <table className="w-full bg-white shadow rounded-lg overflow-hidden">

        <thead className="bg-gray-100 text-sm">
          <tr>
            <th className="p-3 text-left">Imagen</th>
            <th className="p-3 text-left">Producto</th>
            <th className="p-3 text-left">Categoría</th>
            <th className="p-3 text-left">Precio</th>
            <th className="p-3 text-left">Stock</th>
            <th className="p-3 text-left">Tienda</th>
            <th className="p-3 text-left">Acciones</th>
          </tr>
        </thead>

        <tbody>

          {products.map(product => (

            <tr key={product.id} className="border-t hover:bg-gray-50">

              <td className="p-3">
                <div className="relative w-12 h-12">
                  <Image
                    src={product.images?.[0] || "/images/placeholder.png"}
                    alt={product.title}
                    fill
                    className="object-cover rounded"
                  />
                </div>
              </td>

              <td className="p-3 font-medium">
                {product.title}
              </td>

              <td className="p-3">
                {product.category?.name || "-"}
              </td>

              <td className="p-3">
                S/. {product.price}
              </td>

              <td className="p-3">
                {product.stock}
              </td>

              <td className="p-3">
                {product.store}
              </td>

              <td className="p-3 flex gap-3">

                <Link
                  href={`/dashboard/products/edit/${product.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </Link>

                <button
                  onClick={() => deleteProduct(product.id)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )
}