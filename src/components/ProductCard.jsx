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
            <img src="/escarapela.svg" alt="Escarapela Peru" width="60" height="60" className="drop-shadow" />
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
