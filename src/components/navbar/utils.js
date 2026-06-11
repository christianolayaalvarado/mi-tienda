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
    if (!Array.isArray(parsed)) return [];
    return parsed.map((it) => ({
      ...it,
      productId: it.productId ?? it.id ?? null,
      quantity: Number(it.quantity || 0),
    }));
  } catch (e) {
    // No romper la app por un localStorage corrupto
    // eslint-disable-next-line no-console
    console.warn("safeParseLocalCart error", e);
    return [];
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
