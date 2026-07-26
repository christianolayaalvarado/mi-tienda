"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import SocialProof from "@/components/SocialProof";

const imageSizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

export default function ProductCard({ product, priority }) {
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const categoryName = product.category?.name || "Sin categoría";
  const storeName = product.store?.name || "Tienda";
  const storeCode = product.store?.code;

  const hasValidImage = product.images?.[0] && !imgError;
  const productId = product.id?.toString() || product.id;

  return (
    <div className="group card-theme rounded-xl shadow-md overflow-hidden transform transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <Link href={`/product/${productId}`} className="block">
        <div className="relative h-40 overflow-hidden">
          <span className="absolute top-2 left-2 z-10 bg-black/20 text-white text-[10px] font-semibold px-2 py-1 rounded-md backdrop-blur-sm">
            {categoryName}
          </span>

          {/* Escarapela Peruana */}
          <div className="absolute top-1.5 right-1.5 z-10" title="Fiestas Patrias">
            <svg width="38" height="38" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="rosetteGrad" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="100%" stopColor="#f0f0f0" />
                </radialGradient>
              </defs>
              {/* Ribbons */}
              <g transform="translate(50,55)">
                <path d="M-4,-2 L-18,40 L-10,38 L-2,0Z" fill="#C8102E" />
                <path d="M4,-2 L18,40 L10,38 L2,0Z" fill="#C8102E" />
                <path d="M-1,-2 L-14,35 L-8,34 L0,0Z" fill="#fff" stroke="#ddd" strokeWidth="0.3" />
                <path d="M1,-2 L14,35 L8,34 L0,0Z" fill="#fff" stroke="#ddd" strokeWidth="0.3" />
                <path d="M-8,2 L-28,30 L-20,30 L-4,6Z" fill="#C8102E" />
                <path d="M8,2 L28,30 L20,30 L4,6Z" fill="#C8102E" />
                <path d="M-6,2 L-22,26 L-16,26 L-2,5Z" fill="#fff" stroke="#ddd" strokeWidth="0.3" />
                <path d="M6,2 L22,26 L16,26 L2,5Z" fill="#fff" stroke="#ddd" strokeWidth="0.3" />
              </g>
              {/* Rosette center */}
              <circle cx="50" cy="40" r="22" fill="url(#rosetteGrad)" stroke="#C8102E" strokeWidth="2.5" />
              <circle cx="50" cy="40" r="17" fill="none" stroke="#C8102E" strokeWidth="1" strokeDasharray="3,2" />
              <circle cx="50" cy="40" r="12" fill="#C8102E" />
              <text x="50" y="44" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="sans-serif">PE</text>
            </svg>
          </div>

          {product.originalPrice && product.originalPrice > product.price && (
            <span className="absolute bottom-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
              -{product.discountPct || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}

          {product.stock === 0 && (
            <span className="absolute bottom-2 left-2 z-10 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
              Agotado
            </span>
          )}

          {hasValidImage ? (
            <img
              src={product.images[0]}
              alt={product.title || "Producto"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <img
              src="/images/placeholder.png"
              alt="Imagen por defecto"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="p-3">
          <h2 className="text-sm font-semibold line-clamp-2 text-theme-primary">
            {product.title || "Producto sin título"}
          </h2>

          <p className="text-green-600 font-bold text-lg mt-1">
            S/ {product.price ?? 0}
          </p>

          {product.stock === 1 && (
            <p className="text-red-600 text-xs font-semibold mt-1">🔥 Última unidad</p>
          )}

          {product.stock > 1 && product.stock <= 3 && (
            <p className="text-orange-600 text-xs font-semibold mt-1">🔥 Solo quedan {product.stock}</p>
          )}

          <div className="mt-1">
            <SocialProof productId={product.id} type="viewing" />
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3 flex items-center gap-2">
        <p className="text-xs text-theme-secondary flex-1 min-w-0 truncate">
          por{" "}
          {storeCode ? (
            <Link href={`/store/${storeCode}`} className="font-medium hover:underline hover:text-green-600">
              {storeName}
            </Link>
          ) : (
            <span className="font-medium">{storeName}</span>
          )}
          {product.user?.isVerified && <span title="Vendedor verificado" className="inline-flex items-center ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded-full font-medium">✓</span>}
        </p>

        <Link href={`/product/${productId}`} className="shrink-0">
          <span className="btn-primary py-1.5 px-3 rounded-lg text-sm font-medium transition whitespace-nowrap">
            Ver detalle
          </span>
        </Link>
      </div>
    </div>
  );
}
