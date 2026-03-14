"use client"

import { createContext, useContext, useState, useEffect } from "react"

const CartContext = createContext()

export function CartProvider({ children }) {

const [cartItems, setCartItems] = useState(() => {

  if (typeof window !== "undefined") {
    const savedCart = localStorage.getItem("cart")
    return savedCart ? JSON.parse(savedCart) : []
  }

  return []
})


  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems))
  }, [cartItems])

const addToCart = (product) => {

  if (product.stock === 0) return

  const qtyToAdd = product.quantity ?? 1

  setCartItems((prev) => {

    const existing = prev.find((item) => item.id === product.id)

    if (existing) {

      const newQuantity = Math.min(
        existing.quantity + qtyToAdd,
        product.stock
      )

      return prev.map((item) =>
        item.id === product.id
          ? { ...item, quantity: newQuantity }
          : item
      )
    }

    return [...prev, { ...product, quantity: qtyToAdd }]
  })
}

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

const updateQuantity = (id, quantity) => {

  setCartItems((prev) =>
    prev.map((item) => {

      if (item.id !== id) return item

      // eliminar si llega a 0
      if (quantity <= 0) return null

      // evitar superar stock
      if (item.stock && quantity > item.stock) {
        quantity = item.stock
      }

      return { ...item, quantity }

    }).filter(Boolean)
  )

}

 const increaseQuantity = (id) => {

  setCartItems((prev) =>
    prev.map((item) => {

      if (item.id !== id) return item

      console.log(item)

      // bloquear si llegó al stock
      const stock = item.stock ?? 1

      if (item.quantity >= stock) return item

      return {
        ...item,
        quantity: item.quantity + 1
      }

    })
  )

}

  const decreaseQuantity = (id) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }



  const clearCart = () => {
    setCartItems([])
  }

  return (
    <CartContext.Provider
    value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      clearCart
    }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}