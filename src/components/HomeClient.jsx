"use client"

import ProductCard from "@/components/ProductCard"
import { products } from "@/data/products"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function HomeClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get("search") || ""
  const currentCategory = searchParams.get("category") || ""
  const currentSort = searchParams.get("sort") || ""
  const currentPage = parseInt(searchParams.get("page")) || 1

  const [search, setSearch] = useState(currentSearch)

  const productsPerPage = 12

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchSearch = product.title.toLowerCase().includes(search.toLowerCase())
    const matchCategory = currentCategory === "" || product.category === currentCategory
    return matchSearch && matchCategory
  })

  // Ordenar productos
  const sortedProducts = [...filteredProducts]
  if (currentSort === "price_asc") sortedProducts.sort((a, b) => a.price - b.price)
  if (currentSort === "price_desc") sortedProducts.sort((a, b) => b.price - a.price)
  if (currentSort === "newest") sortedProducts.sort((a, b) => b.id - a.id)

  // Paginación
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / productsPerPage))
  const safePage = currentPage > totalPages ? totalPages : currentPage
  const start = (safePage - 1) * productsPerPage
  const end = start + productsPerPage
  const paginatedProducts = sortedProducts.slice(start, end)

  function buildURL({
    searchVal = currentSearch,
    categoryVal = currentCategory,
    sortVal = currentSort,
    pageVal = safePage
  }) {
    const params = new URLSearchParams()
    if (searchVal) params.set("search", searchVal)
    if (categoryVal) params.set("category", categoryVal)
    if (sortVal) params.set("sort", sortVal)
    if (pageVal) params.set("page", pageVal.toString())
    return `/?${params.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto p-10">

      {/* Contador y filtros activos */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {sortedProducts.length} productos encontrados
        </p>

        <div className="flex items-center gap-4">
          {(currentSearch || currentCategory || currentSort) && (
            <button
              onClick={() => router.push("/")}
              className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
            >
              Limpiar filtros
            </button>
          )}

          <select
            value={currentSort}
            onChange={(e) => router.push(buildURL({ sortVal: e.target.value, pageVal: 1 }))}
            className="border rounded-md px-3 py-1 text-sm"
          >
            <option value="">Ordenar</option>
            <option value="newest">Más nuevos</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
        </div>
      </div>

      {/* Filtros activos */}
      {(currentSearch || currentCategory || currentSort) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {currentSearch && (
            <button
              onClick={() => router.push(buildURL({ searchVal: "", pageVal: 1 }))}
              className="text-sm bg-gray-100 border px-3 py-1 rounded"
            >
              Búsqueda: {currentSearch} ✕
            </button>
          )}
          {currentCategory && (
            <button
              onClick={() => router.push(buildURL({ categoryVal: "", pageVal: 1 }))}
              className="text-sm bg-gray-100 border px-3 py-1 rounded"
            >
              Categoría: {currentCategory} ✕
            </button>
          )}
          {currentSort && (
            <button
              onClick={() => router.push(buildURL({ sortVal: "", pageVal: 1 }))}
              className="text-sm bg-gray-100 border px-3 py-1 rounded"
            >
              Orden activo ✕
            </button>
          )}
        </div>
      )}

      {/* Grid de productos */}
      {paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
          {paginatedProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 2} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          No se encontraron productos con estos filtros.
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => router.push(buildURL({ pageVal: p }))}
              className={`px-3 py-1 border rounded ${p === safePage ? "bg-black text-white" : "bg-white"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

    </div>
  )
}