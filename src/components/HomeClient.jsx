"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import MascotPromoBanner from "@/components/MascotPromoBanner";
import MascotWelcomeModal from "@/components/MascotWelcomeModal";
import ScrollMascot from "@/components/ScrollMascot";
import EmptyState from "@/components/EmptyState";

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
  const [promoVisible, setPromoVisible] = useState(false);

  const fetchController = useRef(null);
  const isFirstLoad = useRef(true);
  const mounted = useRef(false);

  // Animate promo banner cycle: in 2s → out 60s → in 120s → repeat
  useEffect(() => {
    let t;
    const cycle = () => {
      setPromoVisible(true);
      t = setTimeout(() => {
        setPromoVisible(false);
        t = setTimeout(cycle, 120000);
      }, 60000);
    };
    t = setTimeout(cycle, 2000);
    return () => clearTimeout(t);
  }, []);

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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8 pb-20 sm:pb-16">
      {/* Modal de bienvenida de mascotas */}
      <MascotWelcomeModal />

      {/* Carrusel de productos destacados + Promo de mascotas */}
      <div className="h-[200px] sm:h-[220px]">
        <div className="flex flex-col lg:flex-row gap-3 h-full">
          <div
            className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] min-w-0 h-full"
            style={{ flex: promoVisible ? "3 1 0" : "1 1 100%" }}
          >
            <FeaturedCarousel />
          </div>
          <div
            className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] min-w-0 overflow-hidden h-full"
            style={{
              flex: promoVisible ? "1 1 0" : "0 1 0",
              opacity: promoVisible ? 1 : 0,
            }}
          >
            <MascotPromoBanner />
          </div>
        </div>
      </div>

      {/* Título de sección */}
      {!currentSearch && !currentCategory && (
        <div className="mt-8 mb-6">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product, idx) => (
            <ProductCard key={product.id} product={product} priority={idx < 5} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <EmptyState
          icon="search"
          title="No se encontraron productos"
          description={currentSearch ? `No hay resultados para "${currentSearch}". Intenta con otros términos.` : "Aún no hay productos disponibles. Vuelve pronto."}
          actionHref={currentSearch ? "/" : undefined}
          actionLabel={currentSearch ? "Limpiar búsqueda" : undefined}
        />
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

      {/* Mascota animada */}
      <ScrollMascot onClick={() => window.dispatchEvent(new CustomEvent("open-help-modal"))} />
    </div>
  );
}
