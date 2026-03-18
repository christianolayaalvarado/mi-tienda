"use client"

import { useEffect, useState } from "react"
import { products as initialProducts } from "@/data/products"

export function useProducts() {

  const [products, setProducts] = useState([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("products")) || []
    setProducts([...initialProducts, ...stored])
  }, [])

  // Crear producto
  function addProduct(newProduct) {

    const stored = JSON.parse(localStorage.getItem("products")) || []

    const updated = [...stored, newProduct]

    localStorage.setItem("products", JSON.stringify(updated))

    setProducts([...initialProducts, ...updated])
  }

  // Eliminar producto
  function deleteProduct(id) {

    const stored = JSON.parse(localStorage.getItem("products")) || []

    const updated = stored.filter(p => p.id !== id)

    localStorage.setItem("products", JSON.stringify(updated))

    setProducts([...initialProducts, ...updated])
  }

  // Actualizar producto
  function updateProduct(updatedProduct) {

    const stored = JSON.parse(localStorage.getItem("products")) || []

    const updated = stored.map(p =>
      p.id === updatedProduct.id ? updatedProduct : p
    )

    localStorage.setItem("products", JSON.stringify(updated))

    setProducts([...initialProducts, ...updated])
  }

  // Obtener producto por ID
  function getProductById(id) {
    return products.find(p => p.id === Number(id))
  }

  return {
    products,
    addProduct,
    deleteProduct,
    updateProduct,
    getProductById
  }
}