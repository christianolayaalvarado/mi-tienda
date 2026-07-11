"use client";
// src/components/navbar/utils.js

export function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function buildURL({ searchVal = "", categoryVal = "", sortVal = "", pageVal = "1" }) {
  const params = new URLSearchParams();
  if (searchVal) params.set("search", searchVal);
  if (categoryVal) params.set("category", categoryVal);
  if (sortVal) params.set("sort", sortVal);
  params.set("page", pageVal);
  return `/?${params.toString()}`;
}

/**
 * safeParseLocalCart
 * - Devuelve siempre un array (no null).
 * - Normaliza cada item: productId, quantity.
 * - Manejo defensivo para evitar romper la UI si localStorage está corrupto.
 */
export function safeParseLocalCart(key = "mi_tienda_cart") {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Si el carrito está en formato { items: [...] } o { cart: { items: [...] } }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (Array.isArray(parsed.items)) return normalizeCart(parsed.items);
      if (parsed.cart && Array.isArray(parsed.cart.items)) return normalizeCart(parsed.cart.items);
      // si es objeto plano con campos de producto, devolver array con ese objeto
      return normalizeCart([parsed]);
    }
    if (!Array.isArray(parsed)) return [];
    return normalizeCart(parsed);
  } catch (e) {
    // No romper la app por un localStorage corrupto
    // eslint-disable-next-line no-console
    console.warn("safeParseLocalCart error", e);
    return [];
  }
}

/**
 * normalizeCart
 * - Acepta distintos formatos y devuelve siempre un array de items normalizados:
 *   { productId, id, quantity, price, storeId, name, ... }
 */
export function normalizeCart(raw = []) {
  if (!Array.isArray(raw)) return [];
  return raw.map((it) => {
    const productId = it.productId ?? it.id ?? it.product?.id ?? it.product?._id ?? null;
    const quantity = Number(it.quantity ?? it.qty ?? 0);
    const price = Number(it.price ?? it.unitPrice ?? 0);
    const storeId = it.storeId ?? it.product?.storeId ?? it.store ?? null;
    return {
      ...it,
      productId,
      id: it.id ?? productId,
      quantity,
      price,
      storeId,
    };
  });
}

/**
 * readCartRaw
 * - Devuelve el contenido crudo del carrito (array) o null si no existe.
 * - No lanza excepción en cliente.
 */
export function readCartRaw(key = "mi_tienda_cart") {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Normalizar a array si es posible
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.items)) return parsed.items;
      if (parsed.cart && Array.isArray(parsed.cart.items)) return parsed.cart.items;
      // si es objeto con campos de producto, devolver array con ese objeto
      return [parsed];
    }
    return null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("readCartRaw parse error", e);
    return null;
  }
}

/**
 * writeCartRaw
 * - Escribe el carrito en localStorage.
 * - Si value es null o array vacío, elimina la key.
 * - Dispara eventos: cart:updated (CustomEvent) y storage (Event).
 * - Devuelve el valor escrito (normalizado) o null.
 */
export function writeCartRaw(value, key = "mi_tienda_cart") {
  if (typeof window === "undefined") return null;
  try {
    if (value == null) {
      window.localStorage.removeItem(key);
    } else {
      // Si es array u objeto, stringify
      const toWrite = Array.isArray(value) ? value : value;
      window.localStorage.setItem(key, JSON.stringify(toWrite));
    }

    // Emitir evento personalizado para sincronizar en la misma pestaña
    try {
      window.dispatchEvent(new CustomEvent("cart:updated", { detail: { key, timestamp: Date.now() } }));
    } catch (e) {
      // ignore
    }

    // Emitir storage para otras pestañas
    try {
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      // ignore
    }

    return readCartRaw(key);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("writeCartRaw error", e);
    return null;
  }
}

/**
 * removeProductFromCart
 * - Elimina un productId del carrito (soporta varios formatos).
 * - Devuelve el carrito nuevo (array) o null si quedó vacío.
 */
export function removeProductFromCart(productId, key = "mi_tienda_cart") {
  if (typeof window === "undefined") return null;
  try {
    const raw = readCartRaw(key);
    if (!raw) return null;
    const filtered = raw.filter((it) => String(it.productId ?? it.id) !== String(productId));
    if (!filtered || filtered.length === 0) {
      window.localStorage.removeItem(key);
      // emitir eventos
      try { window.dispatchEvent(new CustomEvent("cart:updated", { detail: { removedProductId: productId } })); } catch { }
      try { window.dispatchEvent(new Event("storage")); } catch { }
      return null;
    }
    window.localStorage.setItem(key, JSON.stringify(filtered));
    try { window.dispatchEvent(new CustomEvent("cart:updated", { detail: { removedProductId: productId } })); } catch { }
    try { window.dispatchEvent(new Event("storage")); } catch { }
    return filtered;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("removeProductFromCart error", e);
    return null;
  }
}

/**
 * removeProductsFromCart
 * - Elimina varios productIds a la vez.
 * - Devuelve el carrito nuevo (array) o null si quedó vacío.
 */
export function removeProductsFromCart(productIds = [], key = "mi_tienda_cart") {
  if (typeof window === "undefined") return null;
  if (!Array.isArray(productIds) || productIds.length === 0) return readCartRaw(key);
  try {
    const raw = readCartRaw(key);
    if (!raw) return null;
    const ids = productIds.map((p) => String(p));
    const filtered = raw.filter((it) => !ids.includes(String(it.productId ?? it.id)));
    if (!filtered || filtered.length === 0) {
      window.localStorage.removeItem(key);
      try { window.dispatchEvent(new CustomEvent("cart:updated", { detail: { removedProductIds: productIds } })); } catch { }
      try { window.dispatchEvent(new Event("storage")); } catch { }
      return null;
    }
    window.localStorage.setItem(key, JSON.stringify(filtered));
    try { window.dispatchEvent(new CustomEvent("cart:updated", { detail: { removedProductIds: productIds } })); } catch { }
    try { window.dispatchEvent(new Event("storage")); } catch { }
    return filtered;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("removeProductsFromCart error", e);
    return null;
  }
}

/**
 * pendingAdd helpers
 * - getPendingAdd: devuelve el objeto pendiente en formato { items: [...], ts } o null.
 * - clearPendingAdd: elimina el pendingAdd de sessionStorage.
 */
export function getPendingAdd() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("pendingAdd");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("getPendingAdd parse error", e);
    return null;
  }
}

export function clearPendingAdd() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("pendingAdd");
  } catch (e) {
    // ignore
  }
}
