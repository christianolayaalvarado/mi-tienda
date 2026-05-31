"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const CartContext = createContext();

// 🔹 Helper para validar ObjectId de Mongo
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

export function CartProvider({ children }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const isSyncing = useRef(false); // evita loops de actualización

  // ---------------- CARGAR DESDE DB O LOCAL ----------------
  useEffect(() => {
    const loadCart = async () => {
      if (session) {
        try {
          const res = await fetch("/api/cart");
          if (!res.ok) {
            const text = await res.text();
            console.warn("No se pudo cargar carrito desde DB:", res.status, text);
            setCartItems([]);
            return;
          }
          const data = await res.json();
          const normalized = (data.items || []).map((item) => ({
            ...item,
            productId: String(item.productId),
            storeId: String(item.storeId || ""),
            quantity: Number(item.quantity) || 1,
            stock: Number(item.stock) || 0,
            price: Number(item.price) || 0,
            image: item.image || "/images/placeholder.png",
          }));
          setCartItems(normalized);
        } catch (err) {
          console.error("Error cargando carrito desde DB:", err);
          setCartItems([]);
        }
      } else {
        const local = localStorage.getItem("cart");
        if (local) {
          try {
            setCartItems(JSON.parse(local));
          } catch {
            setCartItems([]);
          }
        }
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
    const stock = Number(product.stock) || 1;
    const quantityToAdd = Number(product.quantity) || 1;

    if (stock <= 0) {
      toast.error("Sin stock disponible ❌");
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === String(product.id));
      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantityToAdd, stock);
        return prev.map((item) =>
          item.productId === String(product.id)
            ? { ...item, quantity: newQuantity, stock }
            : item
        );
      }

      return [
        ...prev,
        {
          id: String(product.id),
          productId: String(product.id),
          storeId: String(product.storeId || product.store?.id || ""),
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
        if (!isValidObjectId(product.id) || !isValidObjectId(product.storeId)) {
          console.warn("⚠️ ID inválido, guardado solo en local");
          return;
        }

        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: String(product.id),
            storeId: String(product.storeId),
            title: product.title,
            price: Number(product.price),
            image: product.images?.[0] || "/images/placeholder.png",
            quantity: quantityToAdd,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.warn("No se pudo persistir en DB:", res.status, text);
        }
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
        const res = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.warn("No se pudo eliminar del carrito en DB:", res.status, text);
        }
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
        const res = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity: newQuantity }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.warn("No se pudo actualizar cantidad en DB:", res.status, text);
        }
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
        const res = await fetch("/api/cart", { method: "PUT" });
        if (!res.ok) {
          const text = await res.text();
          console.warn("No se pudo limpiar carrito en backend:", res.status, text);
        }
      } catch (err) {
        console.error("Error limpiando carrito en DB:", err);
      }
    }
  };

  // ---------------- CHECKOUT ROBUSTO ----------------
  const checkout = async (customer = {}, paymentMethod = "manual") => {
    if (!session) {
      alert("Debes iniciar sesión para comprar");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
          customer,
          paymentMethod,
          total: subtotal,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Error creando orden:", res.status, text);
        toast.error(`Error creando orden: ${res.status}`);
        return;
      }

      const data = await res.json();

      // Normalizar extracción de orderId (según lo que devuelva tu backend)
      const orderId =
        data?.id ||
        data?._id ||
        data?.order?.id ||
        data?.order?._id ||
        (data?.order && (data.order.id || data.order._id));

      // Limpiar carrito local inmediatamente
      setCartItems([]);
      toast.success("Compra realizada con éxito ✅");

      // Intentar limpiar carrito en backend (no bloquear la navegación)
      try {
        const clearRes = await fetch("/api/cart", { method: "PUT" });
        if (!clearRes.ok) {
          const t = await clearRes.text();
          console.warn("No se pudo limpiar carrito en backend:", clearRes.status, t);
        }
      } catch (err) {
        console.warn("Error limpiando carrito en backend:", err);
      }

      // Redirigir al detalle de la orden si tenemos id, si no ir a lista
      if (orderId) {
        router.push(`/dashboard/orders/${orderId}`);
      } else {
        router.push("/dashboard/orders");
      }
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
