"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { optimizeCloudinary } from "@/lib/cloudinaryOptimize";

export default function RecommendedProducts({
  categoryId: catIdProp,
  storeId: storeIdProp,
  orderId, // opcional: para excluir productos ya comprados
  showPaymentLinks = false, // si true muestra botones de pago directo
}) {
  const PAGE_SIZE = 8;
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef();

  const { addToCart } = useCart();
  const params = useParams() || {};
  const categoryId = catIdProp || params.categoryId || null;
  const storeId = storeIdProp || params.storeId || null;

  // Fetch productos recomendados
  const fetchProducts = async (pageNumber) => {
    setLoading(true);
    try {
      let url = `/api/products/recommended?page=${pageNumber}&limit=${PAGE_SIZE}`;
      if (categoryId) url += `&categoryId=${categoryId}`;
      if (storeId) url += `&storeId=${storeId}`;
      if (orderId) url += `&excludeOrderId=${orderId}`; // opcional: no mostrar productos ya comprados

      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Datos de productos inválidos");

      if (data.length < PAGE_SIZE) setHasMore(false);

      setProducts((prev) => [...prev, ...data]);
    } catch (err) {
      console.error("Error cargando productos recomendados:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Reset cuando cambia categoría o tienda
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, [categoryId, storeId, orderId]);

  // Fetch cuando cambia la página, categoría o tienda
  useEffect(() => {
    fetchProducts(page);
  }, [page, categoryId, storeId, orderId]);

  // Scroll infinito
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "100px" }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore]);

  // Skeletons
  const renderSkeletons = () =>
    Array.from({ length: PAGE_SIZE }, (_, i) => (
      <div key={`skeleton-${i}`} className="border rounded-lg p-4 animate-pulse">
        <div className="bg-gray-200 w-full aspect-square rounded mb-2" />
        <div className="h-4 bg-gray-200 rounded mb-1 w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-8 bg-gray-200 rounded mt-2" />
      </div>
    ));

  // Filtrar duplicados
  const uniqueProducts = Array.from(new Map(products.map((p) => [p.id, p])).values());

  if (uniqueProducts.length === 0 && loading) {
    return (
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">También te puede interesar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{renderSkeletons()}</div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-semibold mb-4">También te puede interesar</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {uniqueProducts.map((product, index) => (
          <div
            key={`${product.id}-${index}`}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 flex flex-col"
          >
            <Link
              href={`/product/${product.id}`}
              className="relative aspect-square w-full mb-2 rounded overflow-hidden bg-gray-100"
            >
              <Image
                src={optimizeCloudinary(product.image, { width: 200 }) || "/images/placeholder.png"}
                alt={product.title || "Producto"}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                className="object-cover transition-transform duration-200 hover:scale-105"
                loading={product.image ? "eager" : "lazy"}
                placeholder="blur"
                blurDataURL="/images/placeholder.png"
              />
            </Link>

            <Link href={`/product/${product.id}`} className="flex-1">
              <p className="text-sm font-medium line-clamp-2 mb-1" title={product.title}>
                {product.title}
              </p>
              <p className="text-green-600 font-semibold">S/ {product.price?.toFixed(2)}</p>
            </Link>

            <button
              onClick={() => addToCart(product)}
              className="mt-2 w-full bg-green-600 text-white py-1 rounded hover:bg-green-700 transition-colors"
            >
              Añadir al carrito
            </button>

            {/* Botón de pago directo si showPaymentLinks y existe paymentLink */}
            {showPaymentLinks && product.paymentLink && (
              <a
                href={product.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full block bg-blue-600 text-white py-1 rounded text-center hover:bg-blue-700"
              >
                Pagar ahora
              </a>
            )}
          </div>
        ))}

        {loading && renderSkeletons()}
      </div>

      {hasMore && (
        <div ref={observerRef} className="h-4 mt-4">
          {loading && <p className="text-center text-gray-500">Cargando...</p>}
        </div>
      )}
    </div>
  );
}