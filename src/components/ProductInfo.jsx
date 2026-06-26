// src/components/ProductInfo.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { fetchSession } from "@/lib/useSessionCheck";
import toast from "react-hot-toast";

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
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center md:text-left">{product.title}</h1>

      <p className="text-green-600 text-xl sm:text-2xl md:text-3xl mt-4 font-semibold text-center md:text-left">
        S/ {Number(product.price || 0).toFixed(2)}
      </p>

      {remainingStock === 1 && <p className="text-red-600 font-semibold mt-2">🔥 Última unidad disponible</p>}
      {remainingStock > 1 && remainingStock <= 3 && <p className="text-orange-600 font-semibold mt-2">🔥 Solo quedan {remainingStock} unidades</p>}
      {remainingStock === 0 && <p className="text-red-600 font-semibold mt-2">Producto agotado</p>}

      <div className="mt-6 space-y-1 text-sm text-gray-600 text-left">
        <p><span className="font-semibold text-gray-800">ID Producto:</span> {productIdStr}</p>
        <p><span className="font-semibold text-gray-800">Categoría:</span> {product.category?.name || "-"}</p>
        <p><span className="font-semibold text-gray-800">Vendedor:</span> {product.user?.name || "Sin nombre"}</p>
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
