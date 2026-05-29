"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";

export default function ProductInfo({ product }) {
  const { addToCart, cartItems } = useCart();

  const existingItem = cartItems.find((item) => item.productId === product.id);

  const mainImage = product.images?.[0] || "/images/placeholder.png";

  const maxAvailable = Number(product.stock) || 0;
  const alreadyInCart = Number(existingItem?.quantity) || 0;
  const remainingStock = Math.max(maxAvailable - alreadyInCart, 0);
  const maxInCart = alreadyInCart >= maxAvailable;

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [stockLimit, setStockLimit] = useState(false);
  const [animateQty, setAnimateQty] = useState(false);

  const selectionTotal = product.price * quantity;

  // ---------------- AÑADIR AL CARRITO ----------------
  const handleAdd = (e) => {
    if (maxInCart) {
      setStockLimit(true);
      setTimeout(() => setStockLimit(false), 2000);
      return;
    }

    flyToCart(mainImage, e);

    addToCart({
      id: product.id,                // 🔹 id del producto
      productId: product.id,         // 🔹 necesario para OrderItemProduct
      storeId: product.storeId || product.store?.id || null, // 🔹 necesario para OrderItem
      title: product.title,
      price: product.price,
      quantity,
      image: product.images?.[0] || "/images/placeholder.png",
      stock: product.stock,              // 🔹 stock total del producto
    });


    setAdded(true);
    setShowToast(true);
    setTimeout(() => {
      setAdded(false);
      setShowToast(false);
    }, 2000);
  };

  // ---------------- ANIMACIÓN ----------------
  function flyToCart(imageSrc, event) {
    const cartIcon = document.querySelector("[data-cart-icon]");
    if (!cartIcon) return;

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

    document.body.appendChild(img);

    requestAnimationFrame(() => {
      img.style.left = cartRect.left + "px";
      img.style.top = cartRect.top + "px";
      img.style.width = "10px";
      img.style.height = "10px";
      img.style.opacity = "0.2";
    });

    setTimeout(() => img.remove(), 700);
  }

  return (
    <div className="flex flex-col justify-start mt-6 md:mt-10 md:pl-10 text-center md:text-left px-2 md:px-0">
      {/* Título */}
      <h1 className="text-3xl md:text-4xl font-bold">{product.title}</h1>

      {/* Precio */}
      <p className="text-green-600 text-2xl md:text-3xl mt-4 font-semibold">
        S/ {product.price}
      </p>

      {/* Stock dinámico */}
      {remainingStock === 1 && (
        <p className="text-red-600 font-semibold mt-2">🔥 Última unidad disponible</p>
      )}
      {remainingStock > 1 && remainingStock <= 3 && (
        <p className="text-orange-600 font-semibold mt-2">🔥 Solo quedan {remainingStock} unidades</p>
      )}
      {remainingStock === 0 && (
        <p className="text-red-600 font-semibold mt-2">Producto agotado</p>
      )}

      {/* Info */}
      <div className="mt-6 space-y-1 text-sm text-gray-600">
        <p>
          <span className="font-semibold text-gray-800">ID Producto:</span> {product.id}
        </p>
        <p>
          <span className="font-semibold text-gray-800">Categoría:</span> {product.category?.name || "-"}
        </p>
        <p>
          <span className="font-semibold text-gray-800">Vendedor:</span> {product.user?.name || "Sin nombre"}
        </p>
        <p>
          <span className="font-semibold text-gray-800">Tienda:</span> {product.store?.name || "Sin tienda"}
        </p>
        <p>
          <span className="font-semibold text-gray-800">Código tienda:</span> {product.store?.code || "-"}
        </p>
        <p>
          <span className="font-semibold text-gray-800">Stock:</span> {remainingStock} disponibles
        </p>
      </div>

      {/* Descripción */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Descripción</h2>
        <p className="text-gray-700 leading-relaxed text-justify">{product.description}</p>
      </div>

      {/* Selector */}
      <div className="flex items-center gap-4 mt-6 justify-center md:justify-start">
        <button
          disabled={quantity <= 1}
          onClick={() => {
            setQuantity((q) => Math.max(1, q - 1));
            setAnimateQty(true);
            setTimeout(() => setAnimateQty(false), 200);
          }}
          className={`w-10 h-10 rounded-lg border text-lg ${
            quantity <= 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "hover:bg-gray-100"
          }`}
        >
          −
        </button>

        <span className={`text-lg font-semibold w-8 text-center ${animateQty ? "scale-125" : ""}`}>
          {quantity}
        </span>

        <button
          disabled={remainingStock === 0 || quantity >= remainingStock}
          onClick={() => {
            setQuantity((q) => Math.min(remainingStock, q + 1));
            setAnimateQty(true);
            setTimeout(() => setAnimateQty(false), 200);
          }}
          className={`w-10 h-10 rounded-lg border text-lg ${
            remainingStock === 0 || quantity >= remainingStock
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "hover:bg-gray-100"
          }`}
        >
          +
        </button>
      </div>

      {/* Total */}
      {quantity > 1 && (
        <p className="text-gray-700 text-sm mt-2 font-medium">
          Total: <span className="text-green-600">S/ {selectionTotal}</span>
        </p>
      )}

      {/* BOTÓN */}
      <button
        onClick={handleAdd}
        disabled={remainingStock === 0 || maxInCart}
        className={`mt-8 px-6 py-3 rounded-lg ${
          remainingStock === 0 || maxInCart ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {remainingStock === 0
          ? "Producto agotado"
          : maxInCart
          ? "Ya tienes el máximo en carrito"
          : quantity > 1
          ? `Agregar ${quantity}`
          : "Agregar al carrito"}
      </button>

      {/* Toast añadido */}
      {added && showToast && (
        <div className="fixed bottom-6 right-6 bg-white shadow-xl border rounded-lg px-4 py-3 flex items-center gap-3 z-50">
          <div className="text-green-600 text-xl">✓</div>
          <div className="text-sm">
            <p className="font-semibold">Producto añadido</p>
            <p className="text-gray-500 text-xs">{product.title}</p>
          </div>
        </div>
      )}

      {/* Toast stock */}
      {stockLimit && (
        <div className="fixed bottom-6 right-6 bg-white shadow-xl border rounded-lg px-4 py-3 flex items-center gap-3 z-50">
          <div className="text-red-500 text-xl">!</div>
          <div className="text-sm">
            <p className="font-semibold">Stock máximo alcanzado</p>
            <p className="text-gray-500 text-xs">
              Ya tienes todas las unidades disponibles en el carrito
            </p>
          </div>
        </div>
      )}
    </div>
  );
}