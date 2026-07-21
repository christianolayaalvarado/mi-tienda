"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mi_tienda_recently_viewed";
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRecentlyViewed(JSON.parse(raw));
    } catch {}
  }, []);

  const addView = useCallback((product) => {
    if (!product?.id) return;
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [
        {
          id: product.id,
          title: product.title || product.name || "",
          price: product.price,
          image: product.image || (Array.isArray(product.images) && product.images[0]) || null,
          viewedAt: Date.now(),
        },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return { recentlyViewed, addView };
}
