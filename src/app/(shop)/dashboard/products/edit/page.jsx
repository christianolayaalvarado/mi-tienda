"use client"

import { useState, useEffect } from "react"
import { products } from "@/data/products"
import { useParams, useRouter } from "next/navigation"

export default function EditProduct() {

  const { id } = useParams()
  const router = useRouter()

 const [form, setForm] = useState(() => {

  if (typeof window === "undefined") return null

  const stored =
    JSON.parse(localStorage.getItem("products")) || []

  const allProducts = [...products, ...stored]

  return allProducts.find(
    p => p.id.toString() === id
  )

})

  function handleChange(e) {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    })

  }

  function handleSubmit(e) {

    e.preventDefault()

    const stored =
      JSON.parse(localStorage.getItem("products")) || []

    const updatedStored = stored.map(p =>
      p.id.toString() === id ? form : p
    )

    localStorage.setItem(
      "products",
      JSON.stringify(updatedStored)
    )

    alert("Producto actualizado")

    router.push("/dashboard/products")

  }

  if (!form) return <p className="p-6">Cargando...</p>

  return (

    <div className="max-w-xl">

      <h1 className="text-2xl font-bold mb-6">
        Editar producto
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="price"
          type="number"
          value={form.price}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <input
          name="stock"
          type="number"
          value={form.stock}
          onChange={handleChange}
          className="border p-3 rounded"
        />

        <button
          className="bg-lime-600 text-white p-3 rounded hover:bg-lime-700"
        >
          Guardar cambios
        </button>

      </form>

    </div>

  )
}