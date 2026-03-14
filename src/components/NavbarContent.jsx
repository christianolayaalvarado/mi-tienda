"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCart } from "@/context/CartContext"
import { Trash2 } from "lucide-react"
import Image from "next/image"

export default function NavbarContent() {

  const router = useRouter()
  const searchParams = useSearchParams()

  // Calcular el total de productos
const { cartItems = [], increaseQuantity, decreaseQuantity, removeFromCart } = useCart()

const [cartOpen, setCartOpen] = useState(false)
const [animateCart, setAnimateCart] = useState(false)

const totalItems = cartItems.reduce(
  (sum, item) => sum + item.quantity,
  0
)

const subtotal = cartItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
)


  const currentSearch = searchParams.get("search") || ""
  const currentCategory = searchParams.get("category") || ""
  const currentSort = searchParams.get("sort") || ""


  const [search, setSearch] = useState(currentSearch)

  const scrollRef = useRef(null)
  const cartRef = useRef(null)

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


useEffect(() => {

  const handleClickOutside = (event) => {
    if (cartRef.current && !cartRef.current.contains(event.target)) {
      setCartOpen(false)
    }
  }

  document.addEventListener("mousedown", handleClickOutside)

  return () => {
    document.removeEventListener("mousedown", handleClickOutside)
  }

}, [])



useEffect(() => {

  if (totalItems === 0) return

  const timerStart = setTimeout(() => {
    setAnimateCart(true)
  }, 0)

  const timerEnd = setTimeout(() => {
    setAnimateCart(false)
  }, 500)

  return () => {
    clearTimeout(timerStart)
    clearTimeout(timerEnd)
  }

}, [totalItems])


  const categories = [
    "Climatizado",
    "Cocina",
    "Coleccionable",
    "Decoración",
    "Electrodoméstico",
    "Fitness",
    "Hogar",
    "Iluminación",
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

          <div
             data-cart-icon
             onClick={() => setCartOpen(!cartOpen)}
              className="text-sm font-medium cursor-pointer relative"
          >
        🛒 Carrito

          {totalItems > 0 && (
              <span
                className={`absolute -top-2 -right-3 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center
                ${animateCart ? "scale-125" : "scale-100"}
                transition-transform duration-300`}
              >
              {totalItems}
              </span> 
           )}
        </div>


          {cartOpen && (
            <div 
              ref={cartRef}
            className="absolute right-0 top-10 w-80 bg-white shadow-xl border rounded-lg p-4 z-50">

            <h3 className="font-semibold mb-3">
              Carrito
            </h3>

            {cartItems.length === 0 && (
              <p className="text-sm text-gray-500">
                El carrito está vacío
              </p>
            )}

            {cartItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-2 border-b last:border-none"
                >

                  <Image
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="object-cover rounded"
                  />

                  <div className="flex-1 text-sm">

                  <p className="truncate font-medium">
                    {item.name}
                  </p>

                  <p className="text-gray-500 text-xs">
                    S/ {item.price} × {item.quantity}
                  </p>

                <div className="flex items-center gap-2 mt-1">

                  <button
                    onClick={() => decreaseQuantity(item.id)}
                    className="px-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    −
                  </button>

                  <span className="text-xs w-4 text-center">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => increaseQuantity(item.id)}
                    disabled={item.quantity >= item.stock}
                    className="px-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-40"
                  >
                    +
                  </button>

                </div>

                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1 rounded hover:bg-red-100 transition"
                >
                  <Trash2 size={24} className="text-gray-500 hover:text-red-600" />
                </button>

                </div>
              ))}

              {cartItems.length > 0 && (
                <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
              )}

          <button
            onClick={() => {
              setCartOpen(false)
              router.push("/cart")
            }}
            className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Ver carrito
          </button>

  </div>
)}



      </div>

      <div className="border-t relative">

      {showLeft && (
  <div className="md:hidden absolute left-2 bottom-0 translate-y-0.5 text-green-800 text-base opacity-80 animate-pulse pointer-events-none">
    ←
  </div>
)}

{showRight && (
  <div className="md:hidden absolute right-2 bottom-0 translate-y-0.5 text-green-800 text-base opacity-80 animate-pulse pointer-events-none">
    →
  </div>
)}

<div className="pointer-events-none md:hidden absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent"></div>

<div className="pointer-events-none md:hidden absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent"></div>


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