"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---------------- PARAMS (lectura segura y memoizada)
  const currentSearch = searchParams?.get("search") || "";
  const currentCategory = searchParams?.get("category") || "";
  const currentSort = searchParams?.get("sort") || "";
  const currentPage = Number(searchParams?.get("page") || 1) || 1;

  // ---------------- STATES
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchController = useRef(null);
  const isFirstLoad = useRef(true);
  const mounted = useRef(false);

  // evitar renderizar una paginación enorme
  const safeTotalPages = Math.max(1, Math.min(Number(totalPages || 1), 500));

  // memoizar parámetros para evitar recrear URLSearchParams en cada render
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (currentCategory) params.set("category", currentCategory);
    if (currentSort) params.set("sort", currentSort);
    params.set("page", String(currentPage || 1));
    params.set("limit", "15");
    return params.toString();
  }, [currentSearch, currentCategory, currentSort, currentPage]);

  // ---------------- FETCH PRODUCTS (robusto)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Abort previo
      if (fetchController.current) {
        try { fetchController.current.abort(); } catch {}
      }
      fetchController.current = new AbortController();

      const res = await fetch(`/api/products?${queryString}`, {
        signal: fetchController.current.signal,
        headers: { Accept: "application/json" },
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("API /api/products responded with non-ok status:", res.status, text);
        throw new Error(text || `Error al obtener productos (${res.status})`);
      }

      if (!contentType.includes("application/json")) {
        const text = await res.text().catch(() => "");
        console.error("API /api/products returned non-JSON response:", text);
        throw new Error("Respuesta inválida del servidor (no JSON)");
      }

      const data = await res.json();

      if (!data || !Array.isArray(data.products)) {
        console.error("Payload inesperado de /api/products:", data);
        throw new Error("Respuesta inválida del servidor");
      }

      // Evitar duplicados por id
      const uniqueProducts = Array.from(new Map(data.products.map((p) => [p.id, p])).values());

      setProducts(uniqueProducts);
      setTotalPages(Number(data.totalPages || 1));
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }
      console.error("Error fetch productos:", err);
      setProducts([]);
      setTotalPages(1);
      setError(err?.message || "Error al obtener productos");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- EFFECT: carga inicial y cambios de filtros
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (fetchController.current) {
        try { fetchController.current.abort(); } catch {}
        fetchController.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchProducts();
      return;
    }
    const t = setTimeout(() => {
      if (mounted.current) fetchProducts();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  // ---------------- PAGINACIÓN (navegación segura)
  const changePage = (page) => {
    if (page < 1 || page > safeTotalPages) return;

    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (currentCategory) params.set("category", currentCategory);
    if (currentSort) params.set("sort", currentSort);
    params.set("page", String(page));
    params.set("limit", "15");

    router.push(`/?${params.toString()}`, { scroll: false });
  };

  // ---------------- RENDER
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Carrusel de productos destacados */}
      <FeaturedCarousel />

      {/* Barra de búsqueda y filtros */}
      <div className="mt-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar productos..."
              defaultValue={currentSearch}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const params = new URLSearchParams();
                  if (e.target.value) params.set("search", e.target.value);
                  if (currentCategory) params.set("category", currentCategory);
                  if (currentSort) params.set("sort", currentSort);
                  params.set("page", "1");
                  params.set("limit", "15");
                  router.push(`/?${params.toString()}`, { scroll: false });
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <select
            defaultValue={currentSort}
            onChange={(e) => {
              const params = new URLSearchParams();
              if (currentSearch) params.set("search", currentSearch);
              if (currentCategory) params.set("category", currentCategory);
              if (e.target.value) params.set("sort", e.target.value);
              params.set("page", "1");
              params.set("limit", "15");
              router.push(`/?${params.toString()}`, { scroll: false });
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
          >
            <option value="">Ordenar por</option>
            <option value="newest">Más recientes</option>
            <option value="price_asc">Menor precio</option>
            <option value="price_desc">Mayor precio</option>
            <option value="popular">Más populares</option>
          </select>
        </div>
      </div>

      {/* Título de sección */}
      {!currentSearch && !currentCategory && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Todos los productos</h2>
          <p className="text-gray-500 text-sm mt-1">Explora nuestro catálogo completo</p>
        </div>
      )}

      {error && (
        <div className="mb-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-center text-sm text-gray-500 mb-4">
          Cargando productos...
        </p>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product, idx) => (
            <ProductCard key={product.id} product={product} priority={idx < 5} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <p className="text-center">No se encontraron productos.</p>
      )}

      {safeTotalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ←
          </button>

          {Array.from({ length: safeTotalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => changePage(page)}
              className={`px-3 py-1 rounded border ${currentPage === page ? "bg-green-600 text-white" : "hover:bg-gray-100"}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === safeTotalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
