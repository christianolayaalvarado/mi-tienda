"use client"

import { useState, useEffect } from "react"
import PurchaseCard from "./PurchaseCard"
import PurchaseFilters from "./PurchaseFilters"
import Pagination from "@/components/Pagination"

export default function PurchasesPage() {
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState({
    status: "all",
    store: "all",
    dateRange: "30d",
  })
  const [loading, setLoading] = useState(false)

  // 🔄 Cargar órdenes desde API
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        page,
        status: filter.status,
        store: filter.store,
        dateRange: filter.dateRange,
      })

      const res = await fetch(`/api/orders?${query.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        console.error(data.error || "Error al cargar órdenes")
        return
      }

      setOrders(data.orders || [])
      setTotalPages(data.totalPages || 1)

    } catch (error) {
      console.error("Error al cargar órdenes:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, filter])

  // 🔁 Cambiar filtros
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setPage(1)
  }

  // ✅ Actualización reactiva al cancelar
  const handleOrderCancelled = (orderId) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? { ...order, status: "cancelled" }
          : order
      )
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Historial de Compras
      </h1>

      <PurchaseFilters onFilterChange={handleFilterChange} />

      {loading ? (
        <p>Cargando órdenes...</p>
      ) : orders.length === 0 ? (
        <p>No se encontraron órdenes.</p>
      ) : (
        orders.map((order) => (
          <PurchaseCard
            key={order.id}
            order={order}
            showActions={true}
            onOrderCancelled={handleOrderCancelled}
          />
        ))
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}