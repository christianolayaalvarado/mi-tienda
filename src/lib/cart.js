"use client";
// src/lib/cart.js
const CART_KEY = "mi_tienda_cart";

export function readCartRaw() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
}

export function writeCartRaw(value) {
  try {
    if (value == null) {
      localStorage.removeItem(CART_KEY);
    } else {
      localStorage.setItem(CART_KEY, JSON.stringify(value));
    }
    // disparar evento storage local para otras pestañas
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.warn("No se pudo escribir carrito:", err);
  }
}

/**
 * Elimina del carrito local todos los items cuyo productId esté en productIdsToRemove (array de strings).
 * Soporta formatos de carrito: array, { items: [...] }, { cart: { items: [...] } }.
 */
export function removeProductsFromCart(productIdsToRemove = []) {
  if (!Array.isArray(productIdsToRemove) || productIdsToRemove.length === 0) return;

  const raw = readCartRaw();
  if (!raw) return;

  const normalizeItem = (it, idx) => {
    return {
      productId: it.productId ?? it.id ?? `unknown-${idx}`,
      raw: it,
    };
  };

  // Si es array raíz
  if (Array.isArray(raw)) {
    const filtered = raw.filter((it, idx) => {
      const pid = normalizeItem(it, idx).productId;
      return !productIdsToRemove.includes(String(pid));
    });
    writeCartRaw(filtered.length ? filtered : null);
    return;
  }

  // Si es { items: [...] }
  if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
    const filteredItems = raw.items.filter((it, idx) => {
      const pid = normalizeItem(it, idx).productId;
      return !productIdsToRemove.includes(String(pid));
    });
    if (filteredItems.length === 0) {
      writeCartRaw(null);
    } else {
      writeCartRaw({ ...raw, items: filteredItems });
    }
    return;
  }

  // Si es { cart: { items: [...] } }
  if (raw && typeof raw === "object" && raw.cart && Array.isArray(raw.cart.items)) {
    const filteredItems = raw.cart.items.filter((it, idx) => {
      const pid = normalizeItem(it, idx).productId;
      return !productIdsToRemove.includes(String(pid));
    });
    if (filteredItems.length === 0) {
      writeCartRaw(null);
    } else {
      writeCartRaw({ ...raw, cart: { ...raw.cart, items: filteredItems } });
    }
    return;
  }

  // Si no reconocemos el formato, no hacemos nada
  console.warn("Formato de carrito no reconocido, no se eliminó nada.");
}
