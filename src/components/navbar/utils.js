// components/navbar/utils.js
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

export function safeParseLocalCart(key = "mi_tienda_cart") {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
