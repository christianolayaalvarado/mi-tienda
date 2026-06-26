"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function FeaturedCarousel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/products?limit=10&sort=featured");
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        } else {
          // Fallback: get latest products
          const fallbackRes = await fetch("/api/products?limit=10&sort=newest");
          const fallbackData = await fallbackRes.json();
          setProducts(fallbackData.products || []);
        }
      } catch (err) {
        console.error("Error fetching featured products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Auto-slide
  useEffect(() => {
    if (isPaused || products.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, products.length]);

  const goTo = (index) => {
    setCurrentIndex(index);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  if (loading) {
    return (
      <div className="w-full h-64 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl animate-pulse flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-blue-300 mx-auto mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-blue-400 text-sm">Cargando productos destacados...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={carouselRef}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="carouselGrid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#carouselGrid)" />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 px-8 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h2 className="text-xl font-bold text-white">Destacados</h2>
            </div>
            <p className="text-blue-200 text-sm">Los productos más populares de nuestra tienda</p>
          </div>
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium transition"
          >
            Ver todos
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative z-10 px-8 pb-8">
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {products.map((product, idx) => (
              <div key={product.id} className="w-full flex-shrink-0 px-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 hover:bg-white/20 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    {/* Imagen */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        {product.category?.name && (
                          <span className="text-xs font-medium text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                            {product.category.name}
                          </span>
                        )}
                        {product.store?.name && (
                          <span className="text-xs text-white/60">
                            por {product.store.name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-white/70 text-sm mb-3 line-clamp-2 hidden sm:block">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-3">
                        <span className="text-2xl sm:text-3xl font-bold text-white">
                          S/ {Number(product.price || 0).toFixed(2)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-white/50 line-through">
                            S/ {Number(product.originalPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-xs text-white/60">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {product.views || 0} vistas
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {product.stock || 0} en stock
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex-shrink-0">
                      <Link
                        href={`/product/${product.id}`}
                        className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
                      >
                        Ver producto
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation arrows */}
        {products.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots */}
        {products.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {products.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "bg-white w-6"
                    : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Ir al producto ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
