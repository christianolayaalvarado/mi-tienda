"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { data: session } = useSession();
  const [cartItems, setCartItems] = useState([]);
  const isSyncing = useRef(false); // evita loops de actualización

  // ---------------- CARGAR DESDE DB O LOCAL ----------------
  useEffect(() => {
    const loadCart = async () => {
      if (session) {
        try {
          const res = await fetch("/api/cart");
          const data = await res.json();
          const normalized = (data.items || []).map((item) => ({
            ...item,
            quantity: Number(item.quantity) || 1,
            stock: Number(item.stock) || 0,
            price: Number(item.price) || 0,
            storeId: item.storeId || null,
          }));
          setCartItems(normalized);
        } catch (err) {
          console.error("Error cargando carrito desde DB:", err);
        }
      } else {
        const local = localStorage.getItem("cart");
        if (local) setCartItems(JSON.parse(local));
      }
    };
    loadCart();
  }, [session]);

  // ---------------- GUARDAR EN LOCAL ----------------
  useEffect(() => {
    if (!session) localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems, session]);

  // ---------------- FUNCIONES ----------------

  const addToCart = async (product) => {
    const stock = Number(product.stock) || 0;
    const quantityToAdd = Number(product.quantity) || 1;

    if (stock <= 0) {
      toast.error("Sin stock disponible ❌");
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantityToAdd, stock);
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: newQuantity, stock } : item
        );
      }

      return [
        ...prev,
        {
          id: String(product.id),                 // 🔹 aseguramos que sea string
          productId: String(product.id),          // 🔹 siempre string
          storeId: String(product.storeId || product.store?.id || ""), // 🔹 siempre string
          title: product.title,
          price: Number(product.price),
          image: product.images?.[0] || "/images/placeholder.png",
          quantity: Math.min(quantityToAdd, stock),
          stock,
        },
      ];
    });
    toast.success("Producto agregado al carrito 🛒");

    if (session) {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: String(product.id),
            productId: String(product.id),
            storeId: String(product.storeId || product.store?.id || ""),
            title: product.title,
            price: Number(product.price),
            image: product.images?.[0] || "/images/placeholder.png",
            quantity: quantityToAdd,
          }),
        });
      } catch (err) {
        console.error("Error agregando producto en DB:", err);
      }
    }
  };

  const removeFromCart = async (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    toast.success("Producto eliminado 🗑️");

    if (session) {
      try {
        await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
      } catch (err) {
        console.error("Error eliminando producto en DB:", err);
      }
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(newQuantity, item.stock) }
          : item
      )
    );

    if (session) {
      try {
        await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: newQuantity }),
        });
      } catch (err) {
        console.error("Error actualizando cantidad en DB:", err);
      }
    }
  };

  const increaseQuantity = (productId) => {
    const item = cartItems.find((i) => i.productId === productId);
    if (!item) return;

    if (item.quantity >= item.stock) {
      toast.error("Has alcanzado el stock máximo 📦");
      return;
    }

    updateQuantity(productId, item.quantity + 1);
  };

  const decreaseQuantity = (productId) => {
    const item = cartItems.find((i) => i.productId === productId);
    if (!item) return;

    const newQuantity = item.quantity - 1;
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    toast.success("Carrito limpiado 🧹");

    if (session) {
      try {
        await fetch("/api/cart", { method: "PUT" });
      } catch (err) {
        console.error("Error limpiando carrito en DB:", err);
      }
    }
  };

  const checkout = async () => {
    if (!session) {
      alert("Debes iniciar sesión para comprar");
      return;
    }

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems }),
      });
      setCartItems([]);
      toast.success("Compra realizada con éxito ✅");
    } catch (err) {
      console.error("Error en la compra:", err);
      toast.error("Error en la compra");
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        checkout,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}