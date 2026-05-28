"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useNotification } from "@/context/NotificationContext"

export default function CreateStorePage() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { addNotification } = useNotification()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      addNotification("El nombre es obligatorio", "error")
      return
    }

    try {
      setLoading(true)

      const res = await fetch("/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      const data = await res.json()

      if (!res.ok) {
        addNotification(data.error || "Error al crear tienda", "error")
        return
      }

      addNotification("Tienda creada correctamente", "success")

      // 🔥 Redirigir al dashboard de productos
      router.push("/dashboard/products")

    } catch (error) {
      console.error(error)
      addNotification("Error inesperado", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      
      <h1 className="text-xl font-bold mb-4">
        Crear nueva tienda
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <input
          type="text"
          placeholder="Nombre de la tienda"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className={`p-2 rounded text-white ${
            loading
              ? "bg-gray-400"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Creando..." : "Crear tienda"}
        </button>

      </form>
    </div>
  )
}