"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthProvider";
import toast from "react-hot-toast";

function CountdownTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const diff = new Date(endDate) - new Date();
      if (diff <= 0) {
        setTimeLeft("Finalizada");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const parts = [];
      if (d > 0) parts.push(`${d}d`);
      if (h > 0) parts.push(`${h}h`);
      parts.push(`${m}m ${s}s`);
      setTimeLeft(parts.join(" "));
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return <span className="font-mono text-sm font-bold">{timeLeft}</span>;
}

export default function FlashSaleManager() {
  const { user } = useAuthContext() || {};
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountPct, setDiscountPct] = useState(20);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  const isAdmin = user?.role === "admin" || user?.email === "admin@demo.com";

  useEffect(() => {
    if (!expanded) return;
    setLoadingSales(true);
    fetch("/api/flash-sales", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setSales(data.sales || []);
        setLoadingSales(false);
      })
      .catch(() => setLoadingSales(false));
  }, [expanded]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }
    setLoadingProducts(true);
    const timer = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(productSearch)}&limit=20`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          setProductResults(data.products || data || []);
          setLoadingProducts(false);
        })
        .catch(() => {
          setProductResults([]);
          setLoadingProducts(false);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch]);

  if (!isAdmin) return null;

  const toggleProduct = (p) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((x) => x.id === p.id);
      if (exists) return prev.filter((x) => x.id !== p.id);
      return [...prev, p];
    });
  };

  const removeProduct = (id) => {
    setSelectedProducts((prev) => prev.filter((x) => x.id !== id));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Ingresa un título");
    if (!startDate || !endDate) return toast.error("Selecciona fechas");
    if (new Date(endDate) <= new Date(startDate)) return toast.error("La fecha de fin debe ser posterior");
    if (new Date(startDate) < new Date()) return toast.error("La fecha de inicio no puede ser en el pasado");

    setSubmitting(true);
    try {
      const res = await fetch("/api/flash-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          discountPct,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          productIds: selectedProducts.map((p) => p.id),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Oferta relámpago creada");
        setTitle("");
        setDescription("");
        setDiscountPct(20);
        setStartDate("");
        setEndDate("");
        setSelectedProducts([]);
        setProductSearch("");
        setSales((prev) => [data.sale, ...prev]);
      } else {
        toast.error(data.error || "Error al crear");
      }
    } catch {
      toast.error("Error de conexión");
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div className="text-left">
            <p className="font-semibold text-gray-900 text-sm">Ofertas Relámpago</p>
            <p className="text-xs text-gray-500">
              {sales.filter((s) => s.status === "active").length} activa{sales.filter((s) => s.status === "active").length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-5">
          {/* Active / Upcoming Sales */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ofertas Activas / Próximas</p>
            {loadingSales ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : sales.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No hay ofertas relámpago</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sales.map((sale) => {
                  const isActive = sale.status === "active";
                  return (
                    <div
                      key={sale.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${isActive ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isActive ? "bg-red-500 text-white" : "bg-gray-300 text-white"}`}>
                        ⚡
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{sale.title}</p>
                        <p className="text-xs text-gray-500">
                          {sale.discountPct}% off · {new Date(sale.startDate).toLocaleDateString("es-PE")} → {new Date(sale.endDate).toLocaleDateString("es-PE")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {isActive ? (
                          <CountdownTimer endDate={sale.endDate} />
                        ) : (
                          <span className="text-xs text-gray-400">Programada</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create Form */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Crear Nueva Oferta</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Oferta de Navidad"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción breve"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descuento: <span className="text-red-600 font-bold">{discountPct}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={discountPct}
                onChange={(e) => setDiscountPct(Number(e.target.value))}
                className="w-full accent-red-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>10%</span>
                <span>50%</span>
                <span>90%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inicio *</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            {/* Product selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Productos (opcional)</label>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar productos por nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
              {loadingProducts && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}

              {productResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
                  {productResults.map((p) => {
                    const isSelected = selectedProducts.some((x) => x.id === p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleProduct(p)}
                        className={`w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 transition ${isSelected ? "bg-red-50" : ""}`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${isSelected ? "bg-red-500 border-red-500" : "border-gray-300"}`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        {p.images?.[0] && (
                          <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{p.title || p.name}</p>
                          <p className="text-[10px] text-gray-500">S/ {p.price}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedProducts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedProducts.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full"
                    >
                      {p.title || p.name}
                      <button onClick={() => removeProduct(p.id)} className="hover:text-red-900 ml-0.5">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !startDate || !endDate}
              className="w-full py-2.5 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creando...
                </>
              ) : (
                <>⚡ Crear Oferta Relámpago</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
