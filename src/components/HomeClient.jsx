"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";

export default function HomeClient() {
  // Router / params (hooks cliente)
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---------------- PARAMS (lectura segura)
  const currentSearch = searchParams?.get("search") || "";
  const currentCategory = searchParams?.get("category") || "";
  const currentSort = searchParams?.get("sort") || "";
  const currentPage = Number(searchParams?.get("page") || 1);

  // ---------------- STATES
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchController = useRef(null);
  const isFirstLoad = useRef(true);
  const mounted = useRef(false);

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

      const params = new URLSearchParams();
      if (currentSearch) params.set("search", currentSearch);
      if (currentCategory) params.set("category", currentCategory);
      if (currentSort) params.set("sort", currentSort);
      params.set("page", String(currentPage || 1));

      const res = await fetch(`/api/products?${params.toString()}`, {
        signal: fetchController.current.signal,
        headers: { Accept: "application/json" },
      });

      // Si la respuesta no es JSON, leer texto para debug y lanzar error
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

      // Validaciones básicas del payload
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
        // petición abortada por navegación o nueva búsqueda: silencioso
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
      }
    };
  }, []);

  useEffect(() => {
    // Primera carga: ejecutar inmediatamente
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchProducts();
      return;
    }
    // Debounce ligero para evitar llamadas excesivas
    const t = setTimeout(() => {
      if (mounted.current) fetchProducts();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearch, currentCategory, currentSort, currentPage]);

  // ---------------- PAGINACIÓN (navegación segura)
  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;

    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (currentCategory) params.set("category", currentCategory);
    if (currentSort) params.set("sort", currentSort);
    params.set("page", String(page));

    // router.push en cliente; no forzamos scroll si el usuario lo desea
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  // ---------------- RENDER
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <p className="text-center text-sm text-gray-500 mb-4">
          Cargando productos...
        </p>
      )}

      {/* GRID */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product, idx) => (
            <ProductCard key={product.id} product={product} priority={idx < 5} />
          ))}
        </div>
      )}

      {/* EMPTY */}
      {!loading && products.length === 0 && (
        <p className="text-center">No se encontraron productos.</p>
      )}

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
