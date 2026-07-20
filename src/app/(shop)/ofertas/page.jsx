"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import EmptyState from "@/components/EmptyState";
import Breadcrumbs from "@/components/Breadcrumbs";
import ScrollMascot from "@/components/ScrollMascot";

export default function OfertasPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchOfertas() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/products?onSale=true&sort=discount&page=${page}&limit=15`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Error al cargar ofertas");
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products || []);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (!cancelled) {
          setError(err?.message || "Error al cargar ofertas");
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOfertas();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page]);

  const maxDiscount = products.length > 0
    ? Math.max(...products.map((p) => p.discountPct || 0))
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8 pb-20 sm:pb-16">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Ofertas Exclusivas" },
        ]}
      />

      {/* Hero */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-2xl p-6 sm:p-10 mb-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
              Ofertas Exclusivas
            </h1>
            <p className="text-white/90 text-lg mb-1">
              Descuentos especiales solo para ti. ¡No te los pierdas!
            </p>
            {maxDiscount > 0 && (
              <div className="inline-block mt-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-bold">
                Hasta <span className="text-yellow-200">{maxDiscount}% OFF</span>
              </div>
            )}
          </div>
          <div className="text-6xl sm:text-7xl">
            🏷️
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-center text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          <div className="mb-4 text-sm text-gray-500">
            {products.length} producto{products.length !== 1 ? "s" : ""} con descuento
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product, idx) => (
              <ProductCard key={product.id} product={product} priority={idx < 5} />
            ))}
          </div>
        </>
      )}

      {!loading && products.length === 0 && !error && (
        <EmptyState
          icon="🏷️"
          title="No hay ofertas disponibles"
          description="Vuelve pronto para ver descuentos y promociones exclusivas."
          actionHref="/"
          actionLabel="Ver catálogo"
        />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-50 transition"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg border transition ${
                page === p ? "bg-red-600 text-white" : "hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border rounded-lg disabled:opacity-50 transition"
          >
            →
          </button>
        </div>
      )}

      <ScrollMascot />
    </div>
  );
}
