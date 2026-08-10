"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LatestProductsBanner() {
  const [products, setProducts] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/products?sort=newest&limit=3");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching latest products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  useEffect(() => {
    if (isHovered || products.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % products.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovered, products.length]);

  if (loading || products.length === 0) return null;

  const product = products[currentIdx];

  return (
    <div className="w-full h-full">
      <div
        data-banner="latest"
        className="relative w-full h-full rounded-xl overflow-hidden shadow-lg shadow-blue-500/15"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />

        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-20 h-20 rounded-full bg-cyan-400/10 blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex h-full">
          {/* Left: Product image */}
          <Link
            href={`/product/${product.id}`}
            className="w-2/5 flex items-center justify-center p-3 group"
          >
            <div className="relative w-full h-full max-w-[120px] max-h-[120px] lg:max-w-[140px] lg:max-h-[140px] rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 group-hover:scale-105 transition-transform duration-300">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-3xl">
                  📦
                </div>
              )}
            </div>
          </Link>

          {/* Right: Product info */}
          <div className="w-3/5 flex flex-col justify-center p-2 pr-4 gap-1.5">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/30 backdrop-blur-sm rounded-full px-2 py-0.5 w-fit">
              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" />
              <span className="text-white text-[8px] font-bold uppercase tracking-wide">Nuevo</span>
            </div>

            <div key={currentIdx} className="animate-[fadeInUp_0.4s_ease-out]">
              <Link href={`/product/${product.id}`}>
                <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg text-left leading-tight drop-shadow-md line-clamp-2 hover:text-blue-200 transition-colors">
                  {product.title || "Producto nuevo"}
                </h3>
              </Link>
              <p className="text-blue-200/80 text-xs sm:text-sm mt-0.5">
                {product.category?.name || "Sin categoría"}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-white font-bold text-base sm:text-lg lg:text-xl">
                S/ {Number(product.price || 0).toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-blue-300/60 text-xs line-through">
                  S/ {Number(product.originalPrice).toFixed(2)}
                </span>
              )}
            </div>

            <Link
              href={`/product/${product.id}`}
              className="mt-1 inline-flex items-center gap-1 text-blue-300 hover:text-white text-xs font-medium transition-colors w-fit"
            >
              Ver producto
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Dots */}
            {products.length > 1 && (
              <div className="flex gap-1 mt-1">
                {products.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentIdx ? "bg-white w-3 shadow" : "bg-white/30 w-1"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
