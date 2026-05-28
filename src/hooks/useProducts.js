"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

export function useProducts() {
  const [products, setProducts] = useState([])
  const [totalPages, setTotalPages] = useState(1) // ✅ manejar paginación
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)

  // 🔹 Traer productos del usuario logueado
  useEffect(() => {
    if (!session) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/mine`)
        if (!res.ok) throw new Error("Error al cargar productos")
        const data = await res.json()

        // ✅ Ajuste: consumir data.products en lugar de data directo
        setProducts(data.products || [])
        setTotalPages(data.totalPages || 1)
      } catch (err) {
        console.error("Error fetching products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [session])

  // 🔹 Eliminar producto
  async function deleteProduct(id) {
    try {
      const res = await fetch(`/api/products/bulk-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }) // ✅ enviar array de IDs
      })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id))
      } else {
        console.error("No se pudo eliminar el producto")
      }
    } catch (err) {
      console.error("Error deleting product:", err)
    }
  }

  // 🔹 Agregar producto
  async function addProduct(newProduct) {
    try {
      const res = await fetch(`/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct)
      })
      if (res.ok) {
        const created = await res.json()
        setProducts(prev => [...prev, created])
      } else {
        console.error("No se pudo crear el producto")
      }
    } catch (err) {
      console.error("Error adding product:", err)
    }
  }

  // 🔹 Actualizar producto
  async function updateProduct(updatedProduct) {
    try {
      const res = await fetch(`/api/products/${updatedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct)
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(prev => prev.map(p => p.id === data.id ? data : p))
      } else {
        console.error("No se pudo actualizar el producto")
      }
    } catch (err) {
      console.error("Error updating product:", err)
    }
  }

  // 🔹 Obtener producto por ID
  function getProductById(id) {
    return products.find(p => p.id === id)
  }

  return {
    products,
    totalPages, // ✅ ahora disponible para paginación
    loading,
    addProduct,
    deleteProduct,
    updateProduct,
    getProductById
  }
}
