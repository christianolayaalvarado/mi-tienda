"use client"

import { useState } from "react"

export default function PurchaseFilters({ onFilterChange }) {
  const [status, setStatus] = useState("all")
  const [store, setStore] = useState("all")
  const [dateRange, setDateRange] = useState("30d")

  const handleChange = () => {
    onFilterChange({ status, store, dateRange })
  }

  return (
    <div className="flex gap-4 mb-4">
      <select value={status} onChange={(e) => { setStatus(e.target.value); handleChange() }} className="border rounded p-1">
        <option value="all">Todos los estados</option>
        <option value="pending">Pendiente</option>
        <option value="paid">Pagado</option>
        <option value="cancelled">Cancelado</option>
      </select>

      <select value={store} onChange={(e) => { setStore(e.target.value); handleChange() }} className="border rounded p-1">
        <option value="all">Todas las tiendas</option>
        {/* Puedes mapear tiendas dinámicamente */}
      </select>

      <select value={dateRange} onChange={(e) => { setDateRange(e.target.value); handleChange() }} className="border rounded p-1">
        <option value="7d">Últimos 7 días</option>
        <option value="30d">Últimos 30 días</option>
        <option value="custom">Personalizado</option>
      </select>
    </div>
  )
}