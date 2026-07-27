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
            <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="rGradR" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#e8304a" />
                  <stop offset="100%" stopColor="#C8102E" />
                </radialGradient>
                <radialGradient id="rGradW" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="100%" stopColor="#e8e8e8" />
                </radialGradient>
              </defs>
              {/* Ribbons: left and right */}
              <path d="M38,58 L18,96 Q22,100 26,96 L42,58Z" fill="#C8102E" />
              <path d="M42,58 L26,96 Q30,100 34,96 L46,58Z" fill="#fff" stroke="#ddd" strokeWidth="0.3" />
              <path d="M62,58 L58,96 Q62,100 66,96 L82,58Z" fill="#fff" stroke="#ddd" strokeWidth="0.3" />
              <path d="M66,58 L66,96 Q70,100 74,96 L78,58Z" fill="#C8102E" />
              {/* Outer petals - red */}
              <g>
                {Array.from({length:14}).map((_,i) => {
                  const angle = (i * (360/14)) * Math.PI / 180;
                  const cx = 50 + Math.cos(angle) * 28;
                  const cy = 38 + Math.sin(angle) * 28;
                  return <ellipse key={`ow${i}`} cx={cx} cy={cy} rx="13" ry="9" transform={`rotate(${i*(360/14)} ${cx} ${cy})`} fill="url(#rGradR)" />;
                })}
              </g>
              {/* Inner petals - white */}
              <g>
                {Array.from({length:14}).map((_,i) => {
                  const angle = (i * (360/14) + 360/28) * Math.PI / 180;
                  const cx = 50 + Math.cos(angle) * 20;
                  const cy = 38 + Math.sin(angle) * 20;
                  return <ellipse key={`ir${i}`} cx={cx} cy={cy} rx="10" ry="7" transform={`rotate(${i*(360/14)+360/28} ${cx} ${cy})`} fill="url(#rGradW)" stroke="#ddd" strokeWidth="0.3" />;
                })}
              </g>
              {/* Center - red */}
              <circle cx="50" cy="38" r="14" fill="url(#rGradR)" stroke="#a0082a" strokeWidth="1" />
              <circle cx="50" cy="38" r="10" fill="none" stroke="#fff" strokeWidth="0.6" strokeDasharray="2,1.5" />
              <text x="50" y="42" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">PE</text>
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
