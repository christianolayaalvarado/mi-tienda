"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function NavbarContent() {

  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get("search") || ""
  const currentCategory = searchParams.get("category") || ""
  const currentSort = searchParams.get("sort") || ""
  const currentPage = searchParams.get("page") || "1"

  const [search, setSearch] = useState(currentSearch)

  const scrollRef = useRef(null)

const [showLeft, setShowLeft] = useState(false)
const [showRight, setShowRight] = useState(false)

const updateArrows = () => {
  const el = scrollRef.current
  if (!el) return

  const maxScroll = el.scrollWidth - el.clientWidth

  setShowLeft(el.scrollLeft > 5)
  setShowRight(el.scrollLeft < maxScroll - 5)
}

useEffect(() => {
  updateArrows()

  const el = scrollRef.current
  if (!el) return

  el.addEventListener("scroll", updateArrows)
  window.addEventListener("resize", updateArrows)

  return () => {
    el.removeEventListener("scroll", updateArrows)
    window.removeEventListener("resize", updateArrows)
  }
}, [])


  const categories = [
    "Climatizado",
    "Cocina",
    "Coleccionable",
    "Decoracion",
    "Electrodomestico",
    "Fitness",
    "Hogar",
    "Iluminacion",
    "Muebles",
    "Vidrio"
  ]

  function buildURL({
    searchVal = currentSearch,
    categoryVal = currentCategory,
    sortVal = currentSort,
    pageVal = "1"
  }) {
    const params = new URLSearchParams()

    if (searchVal) params.set("search", searchVal)
    if (categoryVal) params.set("category", categoryVal)
    if (sortVal) params.set("sort", sortVal)
    if (pageVal) params.set("page", pageVal.toString())

    return `/?${params.toString()}`
  }

  return (
    <nav className="w-full bg-white shadow-md sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">

        <Link href="/" className="text-2xl font-bold text-green-600">
          MiTienda
        </Link>

        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => {
              const value = e.target.value
              setSearch(value)
              router.push(buildURL({ searchVal: value, pageVal: "1" }))
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />
        </div>

        <div className="text-sm font-medium cursor-pointer">
          🛒 Carrito
        </div>

      </div>

      <div className="border-t relative">

      {showLeft && (
  <div className="md:hidden absolute left-2 bottom-[2px] text-green-600 text-base opacity-80 animate-pulse pointer-events-none">
    ←
  </div>
)}

{showRight && (
  <div className="md:hidden absolute right-2 bottom-[2px] text-green-600 text-base opacity-80 animate-pulse pointer-events-none">
    →
  </div>
)}


        <div
  ref={scrollRef}
  className="max-w-7xl mx-auto px-6 md:px-8 py-2 flex gap-6 text-sm overflow-x-auto whitespace-nowrap scrollbar-none"
>

          <button
            onClick={() =>
              router.push(buildURL({ categoryVal: "", pageVal: "1" }))
            }
            className={`font-semibold transition px-2 py-1 rounded ${
              currentCategory === "" ? "bg-green-600 text-white" : "hover:text-green-600"
            }`}
          >
            Todos
          </button>

          {categories.map((cat, index) => {
            const isActive = currentCategory === cat
            return (
              <button
                key={index}
                onClick={() =>
                  router.push(buildURL({ categoryVal: cat, pageVal: "1" }))
                }
                className={`transition px-2 py-1 rounded ${
                  isActive ? "bg-green-600 text-white" : "hover:text-green-600"
                }`}
              >
                {cat}
              </button>
            )
          })}

        </div>

      </div>

    </nav>
  )
}