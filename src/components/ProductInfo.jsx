// src/components/ProductInfo.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SocialProof from "@/components/SocialProof";
import { useCart } from "@/context/CartContext";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { fetchSession } from "@/lib/useSessionCheck";
import toast from "react-hot-toast";
import DiscountBadge from "@/components/DiscountBadge";
import { useFavorites } from "@/hooks/useFavorites";
import ShippingCostModal from "@/components/ShippingCostModal";

const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

export default function ProductInfo({ product }) {
  const { addToCart, cartItems } = useCart();
  const router = useRouter();

  const productIdStr = String(product.id ?? product._id ?? "");
  const storeIdCandidate = product.storeId ?? product.store?.id ?? "";
  const storeIdStr = String(storeIdCandidate ?? "");

  const existingItem = cartItems.find((item) => String(item.productId) === productIdStr);

  const mainImage = product.images?.[0] || "/images/placeholder.png";

  const maxAvailable = Number(product.stock || 0);
  const alreadyInCart = Number(existingItem?.quantity || 0);
  const remainingStock = Math.max(maxAvailable - alreadyInCart, 0);
  const maxInCart = alreadyInCart >= maxAvailable;

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [stockLimit, setStockLimit] = useState(false);
  const [animateQty, setAnimateQty] = useState(false);
  const [adding, setAdding] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const { isFavorited, toggle, loaded } = useFavorites();
  const fav = loaded && isFavorited(productIdStr);

  const handleChatWithSeller = async () => {
    const user = await fetchSession();
    if (!user) {
      setModalOpen(true);
      return;
    }

    const sellerId = product.user?.id || product.userId;
    if (!sellerId) {
      toast.error("No se pudo identificar al vendedor");
      return;
    }

    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          productId: product.id,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error");

      router.push(`/dashboard/chat`);
    } catch (err) {
      toast.error(err?.message || "Error iniciando chat");
    }
  };

  const selectionTotal = Number(product.price || 0) * Number(quantity || 0);

  useEffect(() => {
    (async () => {
      try {
        if (typeof window === "undefined") return;
        const pendingRaw = sessionStorage.getItem("pendingAdd");
        if (!pendingRaw) return;

        const pending = JSON.parse(pendingRaw);
        if (!pending || !Array.isArray(pending.items) || pending.items.length === 0) return;

        const pendingItem = pending.items[0];
        if (!pendingItem || String(pendingItem.productId) !== String(productIdStr)) return;

        const user = await fetchSession();
        if (!user) return;

        const payload = {
          productId: pendingItem.productId,
          storeId: pendingItem.storeId || storeIdStr || undefined,
          name: product.title || product.name || "",
          price: Number(product.price) || 0,
          image: mainImage,
          quantity: Number(pendingItem.quantity) || 1,
        };

        setAdding(true);
        const result = await addToCart(payload, Number(pendingItem.quantity) || 1);
        setAdding(false);

        if (result && result.success) {
          try {
            sessionStorage.removeItem("pendingAdd");
          } catch (e) {}
          setAdded(true);
          setShowToast(true);
          setTimeout(() => {
            setAdded(false);
            setShowToast(false);
          }, 2000);
        } else if (result?.status === 401) {
          setModalOpen(true);
        } else {
          toast.error(result?.error || "No se pudo completar la acción pendiente.");
        }
      } catch (err) {
        setAdding(false);
        console.warn("Reintento pendiente falló:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e) => {
    try {
      if (adding) return;
      if (remainingStock === 0) {
        setStockLimit(true);
        setTimeout(() => setStockLimit(false), 2000);
        return;
      }

      if (maxInCart) {
        setStockLimit(true);
        setTimeout(() => setStockLimit(false), 2000);
        return;
      }

      setAdding(true);

      const user = await fetchSession();
      if (!user) {
        try {
          sessionStorage.setItem(
            "pendingAdd",
            JSON.stringify({
              items: [{ productId: productIdStr, quantity: Number(quantity) || 1, storeId: storeIdStr || undefined }],
              ts: Date.now(),
            })
          );
        } catch (err) {}
        setAdding(false);
        setModalOpen(true);
        return;
      }

      if (!isValidObjectId(productIdStr)) {
        console.warn("ID de producto no tiene formato ObjectId; se persistirá localmente si el servidor lo rechaza.");
      }

      const payload = {
        productId: productIdStr,
        storeId: storeIdStr || undefined,
        name: product.title || product.name || "",
        price: Number(product.price) || 0,
        image: mainImage,
        quantity: Number(quantity) || 1,
      };

      const result = await addToCart(payload, Number(quantity) || 1);

      if (!result || result.success === false) {
        if (result?.status === 401) {
          try {
            sessionStorage.setItem(
              "pendingAdd",
              JSON.stringify({
                items: [{ productId: productIdStr, quantity: Number(quantity) || 1, storeId: storeIdStr || undefined }],
                ts: Date.now(),
              })
            );
          } catch (err) {}
          setModalOpen(true);
        } else {
          toast.error(result?.error || "No se pudo agregar al carrito");
        }
        setAdding(false);
        return;
      }

      try {
        flyToCart(mainImage, e);
      } catch (err) {
        console.warn("Animación falló:", err);
      }

      setAdded(true);
      setShowToast(true);
      setTimeout(() => {
        setAdded(false);
        setShowToast(false);
      }, 2000);

      setQuantity(1);
    } catch (err) {
      console.error("handleAdd error:", err);
      toast?.error?.(err?.message || "Error agregando al carrito");
    } finally {
      setAdding(false);
    }
  };

  function flyToCart(imageSrc, event) {
    try {
      const cartIcon = document.querySelector("[data-cart-icon]");
      if (!cartIcon || !event?.currentTarget) return;

      const preload = new Image();
      preload.src = imageSrc || "/images/placeholder.png";

      const img = document.createElement("img");
      img.src = imageSrc || "/images/placeholder.png";

      const rect = event.currentTarget.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      img.style.position = "fixed";
      img.style.left = rect.left + "px";
      img.style.top = rect.top + "px";
      img.style.width = "40px";
      img.style.height = "40px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "8px";
      img.style.zIndex = "9999";
      img.style.transition = "all 0.7s ease-in-out";
      img.style.pointerEvents = "none";

      document.body.appendChild(img);
      img.offsetWidth;

      requestAnimationFrame(() => {
        img.style.left = cartRect.left + "px";
        img.style.top = cartRect.top + "px";
        img.style.width = "10px";
        img.style.height = "10px";
        img.style.opacity = "0.2";
        img.style.transform = "translateZ(0)";
      });

      setTimeout(() => {
        try {
          img.remove();
        } catch (e) {}
      }, 700);
    } catch (err) {
      console.warn("Animación flyToCart falló:", err);
    }
  }

  return (
    <div className="flex flex-col justify-start mt-6 md:mt-10 md:pl-10 px-2 md:px-0">
      <div className="flex items-start gap-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center md:text-left flex-1">{product.title}</h1>
        <button
          onClick={() => toggle(productIdStr)}
          className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition border border-gray-200 ${fav ? "animate-[heartPop_0.3s_ease]" : ""}`}
          aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <svg className="w-5 h-5 transition-colors" fill={fav ? "#ef4444" : "none"} stroke={fav ? "#ef4444" : "#9ca3af"} strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Badge de descuento */}
      {product.originalPrice && product.originalPrice > product.price && (
        <div className="mt-3">
          <DiscountBadge
            originalPrice={product.originalPrice}
            discountPct={product.discountPct}
            price={product.price}
            size="lg"
          />
        </div>
      )}

      <p className="text-green-600 text-xl sm:text-2xl md:text-3xl mt-2 font-semibold text-center md:text-left">
        S/ {Number(product.price || 0).toFixed(2)}
      </p>

      {product.categoryId && (
        <BestPriceBadge categoryId={product.categoryId} currentPrice={product.price} />
      )}

      {remainingStock === 1 && <p className="text-red-600 font-semibold mt-2">🔥 Última unidad disponible</p>}
      {remainingStock > 1 && remainingStock <= 3 && <p className="text-orange-600 font-semibold mt-2">🔥 Solo quedan {remainingStock} unidades</p>}

      <div className="mt-2">
        <SocialProof productId={product.id} type="viewing" />
      </div>
      {remainingStock === 0 && <p className="text-red-600 font-semibold mt-2">Producto agotado</p>}

      {/* Shipping info */}
      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <p>
            <span className="font-medium">Envío gratis en Trujillo</span>
            <span className="text-gray-500"> · Fuera de Trujillo, se paga en destino</span>
          </p>
        </div>
        {product.storeId && (
          <div className="mt-2">
            <ShippingCostModal
              storeId={product.storeId}
              storeCity="Trujillo"
            />
          </div>
        )}
      </div>

      <div className="mt-6 space-y-1 text-sm text-gray-600 text-left">
        <p><span className="font-semibold text-gray-800">ID Producto:</span> {productIdStr}</p>
        <p><span className="font-semibold text-gray-800">Categoría:</span> {product.category?.name || "-"}</p>
        <p><span className="font-semibold text-gray-800">Vendedor:</span> {product.user?.name || "Sin nombre"} {product.user?.isVerified && <span title="Vendedor verificado" className="inline-flex items-center ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">✓ Verificado</span>}</p>
        <p><span className="font-semibold text-gray-800">Tienda:</span> {product.store?.name || "Sin tienda"}</p>
        <p><span className="font-semibold text-gray-800">Código tienda:</span> {product.store?.code || "-"}</p>
        <p><span className="font-semibold text-gray-800">Stock:</span> {remainingStock} disponibles</p>
      </div>

      <div className="mt-6 text-left">
        <h2 className="text-lg font-semibold mb-2 text-center md:text-left">Descripción</h2>
        <p className="text-gray-700 leading-relaxed">{product.description}</p>
      </div>

      <div className="flex items-center gap-4 mt-6 justify-center md:justify-start">
        <button aria-label="Disminuir cantidad" disabled={quantity <= 1} onClick={() => { setQuantity((q) => Math.max(1, q - 1)); setAnimateQty(true); setTimeout(() => setAnimateQty(false), 200); }} className={`w-11 h-11 rounded-lg border text-lg flex items-center justify-center ${quantity <= 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "hover:bg-gray-100"}`}>−</button>

        <span className={`text-lg font-semibold w-8 text-center ${animateQty ? "scale-125" : ""}`}>{quantity}</span>

        <button aria-label="Aumentar cantidad" disabled={remainingStock === 0 || quantity >= remainingStock} onClick={() => { setQuantity((q) => Math.min(remainingStock, q + 1)); setAnimateQty(true); setTimeout(() => setAnimateQty(false), 200); }} className={`w-11 h-11 rounded-lg border text-lg flex items-center justify-center ${remainingStock === 0 || quantity >= remainingStock ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "hover:bg-gray-100"}`}>+</button>
      </div>

      {quantity > 1 && <p className="text-gray-700 text-sm mt-2 font-medium">Total: <span className="text-green-600">S/ {selectionTotal.toFixed(2)}</span></p>}

      <button onClick={handleAdd} disabled={remainingStock === 0 || maxInCart || adding} className={`mt-8 w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-center ${remainingStock === 0 || maxInCart || adding ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`} data-test-id="add-to-cart-button">
        {adding ? "Agregando..." : remainingStock === 0 ? "Producto agotado" : maxInCart ? "Ya tienes el máximo en carrito" : quantity > 1 ? `Agregar ${quantity}` : "Agregar al carrito"}
      </button>

      <button onClick={handleChatWithSeller} className="mt-3 w-full sm:w-auto px-6 py-3 rounded-lg border border-green-600 text-green-600 hover:bg-green-50 transition flex items-center justify-center gap-2 font-semibold">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Chat con el vendedor
      </button>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${product.title} - S/ ${product.price}\n${typeof window !== "undefined" ? window.location.href : ""}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 w-full sm:w-auto px-6 py-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition flex items-center justify-center gap-2 font-semibold"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Compartir por WhatsApp
      </a>

      {added && showToast && (
        <div className="fixed bottom-6 right-6 bg-white shadow-xl border rounded-lg px-4 py-3 flex items-center gap-3 z-50">
          <div className="text-green-600 text-xl">✓</div>
          <div className="text-sm">
            <p className="font-semibold">Producto añadido</p>
            <p className="text-gray-500 text-xs">{product.title}</p>
          </div>
        </div>
      )}

      {stockLimit && (
        <div className="fixed bottom-6 right-6 bg-white shadow-xl border rounded-lg px-4 py-3 flex items-center gap-3 z-50">
          <div className="text-red-500 text-xl">!</div>
          <div className="text-sm">
            <p className="font-semibold">Stock máximo alcanzado</p>
            <p className="text-gray-500 text-xs">Ya tienes todas las unidades disponibles en el carrito</p>
          </div>
        </div>
      )}

      <AuthRequiredModal open={modalOpen} onClose={() => setModalOpen(false)} callbackUrl={typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"} />
    </div>
  );
}

function BestPriceBadge({ categoryId, currentPrice }) {
  const [isBest, setIsBest] = useState(false);

  useEffect(() => {
    fetch(`/api/products?category=${categoryId}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        const products = data?.products || [];
        if (products.length < 3) return;
        const prices = products.map((p) => Number(p.price)).filter((p) => p > 0);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        if (Number(currentPrice) < avg * 0.7) setIsBest(true);
      })
      .catch(() => {});
  }, [categoryId, currentPrice]);

  if (!isBest) return null;

  return (
    <div className="mt-2 inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
      <span>🏷️</span>
      <span>¡Mejor precio en esta categoría!</span>
    </div>
  );
}
